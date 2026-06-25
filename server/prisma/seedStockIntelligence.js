/**
 * 🌊 SEED STOCK INTELLIGENCE — Données de test pour le module IA
 * 
 * Ce script injecte des données spécifiquement conçues pour que les
 * algorithmes de détection fonctionnent :
 *   - RUPTURE : stocks bas + ventes élevées → joursRestants ≤ 7
 *   - SURSTOCK : stocks hauts + ventes faibles → ratio > 3
 *   - CRITIQUES : ruptures CRITIQUE/HAUTE + surstocks ratio > 5
 *   - RECOMMANDATIONS : données complètes pour le fallback IA
 *
 * Exécution : node prisma/seedStockIntelligence.js
 * Sûr à relancer — supprime puis recrée les données de test.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── Configuration des données de test ─────────────────────────────────────

const TEST_ESPECES = {
  // Espèces en RUPTURE (stock bas + forte demande)
  rupture: [
    {
      espece: 'Thon Rouge',
      quantite: 30, seuil: 100, unite: 'kg',
      // Ventes 30j : 150 kg → demandeJournaliere = 5 → joursRestants = 6 → HAUTE
      // Ventes 90j : 450 kg → ratio = 30/150 = 0.2 (pas surstock)
      ventes30j: 150, ventes90j: 450,
      prixUnitaire: 18.50,
      bilan: "RUPTURE HAUTE (joursRestants=6)"
    },
    {
      espece: 'Crevette',
      quantite: 20, seuil: 80, unite: 'kg',
      // Ventes 30j : 200 kg → demandeJournaliere = 6.67 → joursRestants = 3 → CRITIQUE
      // Ventes 90j : 600 kg → ratio = 20/200 = 0.1 (pas surstock)
      ventes30j: 200, ventes90j: 600,
      prixUnitaire: 25.00,
      bilan: "RUPTURE CRITIQUE (joursRestants=3)"
    },
  ],

  // Espèces en SURSTOCK (stock haut + faible demande)
  surstock: [
    {
      espece: 'Cabillaud',
      quantite: 600, seuil: 60, unite: 'kg',
      // Ventes 30j : 30 kg → ratio = 600/30 = 20 → SURSTOCK DANGEREUX
      ventes30j: 30, ventes90j: 90,
      prixUnitaire: 12.00,
      bilan: "SURSTOCK CRITIQUE (ratio=20)"
    },
    {
      espece: 'Sardine',
      quantite: 400, seuil: 80, unite: 'kg',
      // Ventes 30j : 40 kg → ratio = 400/40 = 10 → SURSTOCK
      ventes30j: 40, ventes90j: 120,
      prixUnitaire: 6.50,
      bilan: "SURSTOCK (ratio=10)"
    },
  ],

  // Espèces normales (données de base pour les autres modules)
  normal: [
    {
      espece: 'Maquereau',
      quantite: 120, seuil: 50, unite: 'kg',
      ventes30j: 60, ventes90j: 180,
      prixUnitaire: 8.00,
      bilan: "Normal (jours=60, ratio=2)"
    },
    {
      espece: 'Dorade',
      quantite: 45, seuil: 40, unite: 'kg',
      ventes30j: 50, ventes90j: 150,
      prixUnitaire: 14.00,
      bilan: "Normal — proche seuil"
    },
    {
      espece: 'Sole',
      quantite: 55, seuil: 30, unite: 'kg',
      ventes30j: 45, ventes90j: 135,
      prixUnitaire: 22.00,
      bilan: "Normal — bonne rentabilité"
    },
  ],
};

// Toutes les espèces de test
const ALL_ESPECES = [
  ...TEST_ESPECES.rupture,
  ...TEST_ESPECES.surstock,
  ...TEST_ESPECES.normal,
];

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Crée N ventes espacées sur une période de J jours */
function generateVentes(espece, quantiteTotal, joursPeriode, prixUnitaire, stockIds, clientIds, userId) {
  const ventes = [];
  const nbVentes = Math.min(Math.ceil(quantiteTotal / 5), 20); // max 20 ventes, min 5 kg chacune
  const qteParVente = quantiteTotal / nbVentes;
  const now = Date.now();

  for (let i = 0; i < nbVentes; i++) {
    const date = new Date(now - Math.random() * joursPeriode * 24 * 60 * 60 * 1000);
    const qte = parseFloat((qteParVente * (0.7 + Math.random() * 0.6)).toFixed(1));
    ventes.push({
      stockId: stockIds[Math.floor(Math.random() * stockIds.length)],
      clientId: clientIds[Math.floor(Math.random() * clientIds.length)],
      userId,
      date,
      espece,
      quantite: qte,
      prixUnitaire,
      total: parseFloat((qte * prixUnitaire).toFixed(2)),
      typeClient: ['RESTAURANT', 'MARCHE', 'SUPERMARCHE', 'EXPORTATEUR'][Math.floor(Math.random() * 4)],
    });
  }
  return ventes;
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  console.log('🧪 Seed Stock Intelligence — Début');
  console.log('='.repeat(60));

  // 1. Récupérer ou créer un admin et des bateaux
  let admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    const bcrypt = require('bcryptjs');
    admin = await prisma.user.create({
      data: {
        email: 'admin@smartfish.com',
        password: await bcrypt.hash('admin123', 10),
        nom: 'Administrateur',
        prenom: 'SmartFish',
        role: 'ADMIN',
      },
    });
    console.log('✅ Admin créé');
  } else {
    console.log(`✅ Admin trouvé : ${admin.email}`);
  }

  // 2. Récupérer les bateaux existants (ou en créer 2)
  let bateaux = await prisma.bateau.findMany({ take: 3 });
  if (bateaux.length < 2) {
    const newBateaux = [];
    for (const b of [
      { nom: 'Thonier CI-01', immatriculation: 'TEST-SF-01', type: 'Thonier', longueur: 20 },
      { nom: 'Caseyeur CI-02', immatriculation: 'TEST-SF-02', type: 'Caseyeur', longueur: 16 },
    ]) {
      const bateau = await prisma.bateau.upsert({
        where: { immatriculation: b.immatriculation },
        update: {},
        create: { ...b, carburantCapacity: 500, carburantRestant: 400, capitaineId: admin.id },
      });
      newBateaux.push(bateau);
    }
    bateaux = [...bateaux, ...newBateaux];
  }
  console.log(`✅ ${bateaux.length} bateaux disponibles`);

  // 3. Récupérer des clients (ou en créer)
  let clients = await prisma.client.findMany({ take: 5 });
  if (clients.length < 3) {
    const newClients = await Promise.all(
      [
        { nom: 'Test Grossiste Export', email: 'grossiste@test.mg', telephone: '+261 00 000 001', type: 'Grossiste' },
        { nom: 'Test Poissonnerie Centre', email: 'poissonnerie@test.mg', telephone: '+261 00 000 002', type: 'Poissonnerie' },
        { nom: 'Test Restaurant Étoile', email: 'resto@test.mg', telephone: '+261 00 000 003', type: 'Restaurant' },
      ].map(c => prisma.client.create({ data: { ...c, userId: admin.id } }))
    );
    clients = [...clients, ...newClients];
  }
  console.log(`✅ ${clients.length} clients disponibles`);

  // 4. SUPPRIMER les anciennes données de test pour éviter les doublons
  //    On supprime uniquement les stocks/ventes de nos espèces de test
  const testEspeceNames = ALL_ESPECES.map(e => e.espece);
  
  const oldStocks = await prisma.stock.findMany({
    where: { espece: { in: testEspeceNames }, dateSortie: null },
  });
  const oldStockIds = oldStocks.map(s => s.id);
  
  if (oldStockIds.length > 0) {
    await prisma.vente.deleteMany({ where: { stockId: { in: oldStockIds } } });
    // Supprimer aussi les ventes directes par espèce
    await prisma.vente.deleteMany({ where: { espece: { in: testEspeceNames } } });
    await prisma.stock.deleteMany({ where: { id: { in: oldStockIds } } });
    console.log(`🧹 ${oldStocks.length} anciens stocks + ventes nettoyés`);
  }

  // 5. CRÉER LES NOUVEAUX STOCKS
  console.log('\n📦 Création des stocks de test...');
  const newStocks = [];
  for (const esp of ALL_ESPECES) {
    const bateau = bateaux[newStocks.length % bateaux.length];
    const stock = await prisma.stock.create({
      data: {
        bateauId: bateau.id,
        espece: esp.espece,
        quantite: esp.quantite,
        unite: esp.unite,
        seuil: esp.seuil,
        alerte: esp.quantite <= esp.seuil,
        // Date d'entrée récente (moins de 7 jours)
        dateEntree: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      },
    });
    newStocks.push(stock);
    console.log(`   ${esp.espece.padEnd(15)} ${String(esp.quantite).padStart(5)} ${esp.unite.padEnd(4)} seuil:${String(esp.seuil).padStart(4)} → ${esp.bilan}`);
  }

  // 6. CRÉER LES VENTES ASSOCIÉES
  console.log('\n💰 Création des ventes de test...');
  const stockIds = newStocks.map(s => s.id);
  const clientIds = clients.map(c => c.id);
  let totalVentes = 0;

  for (const esp of ALL_ESPECES) {
    // Ventes des 30 derniers jours (pour le calcul de rupture)
    const ventes30j = generateVentes(esp.espece, esp.ventes30j, 30, esp.prixUnitaire, stockIds, clientIds, admin.id);
    await prisma.vente.createMany({ data: ventes30j });
    totalVentes += ventes30j.length;

    // Ventes additionnelles des jours 31-90 (pour le calcul de surstock)
    const ventesComplement90j = esp.ventes90j - esp.ventes30j;
    if (ventesComplement90j > 0) {
      const ventes60_90 = generateVentes(esp.espece, ventesComplement90j, 60, esp.prixUnitaire, stockIds, clientIds, admin.id);
      // Ajuster les dates pour qu'elles soient entre -90j et -31j
      const now = Date.now();
      const dateLimite = now - 31 * 24 * 60 * 60 * 1000;
      ventes60_90.forEach(v => {
        v.date = new Date(dateLimite - Math.random() * 59 * 24 * 60 * 60 * 1000);
      });
      await prisma.vente.createMany({ data: ventes60_90 });
      totalVentes += ventes60_90.length;
    }

    console.log(`   ${esp.espece.padEnd(15)} ${String(ventes30j.length).padStart(2)} ventes (30j) + ${String(ventesComplement90j > 0 ? Math.ceil(ventesComplement90j / 5) : 0)} ventes (31-90j) → ${Math.round(esp.ventes30j)}kg / ${Math.round(esp.ventes90j)}kg`);
  }

  // 7. METTRE À JOUR les stats des clients
  for (const client of clients) {
    const ventesClient = await prisma.vente.findMany({
      where: { clientId: client.id },
    });
    const totalAchats = ventesClient.reduce((s, v) => s + v.total, 0);
    await prisma.client.update({
      where: { id: client.id },
      data: { totalAchats: parseFloat(totalAchats.toFixed(2)), nbCommandes: ventesClient.length },
    });
  }

  console.log(`\n✅ ${totalVentes} ventes créées au total`);
  
  // 8. AFFICHER LE RÉSULTAT ATTENDU
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSULTAT ATTENDU — Intelligence Stock');
  console.log('='.repeat(60));
  console.log(`
   Ruptures détectées (≥2) :
     ✓ Crevette  → CRITIQUE (3 jours restants)
     ✓ Thon Rouge → HAUTE (6 jours restants)

   Surstocks détectés (≥2) :
     ✓ Cabillaud → ratio 20x → DANGEREUX
     ✓ Sardine   → ratio 10x

   Produits critiques (≥2) :
     ✓ { rupture: Crevette, Thon Rouge, surstock: Cabillaud }

   Recommandations IA (fallback) :
     ✓ recommandationsRupture → 2 recommandations
     ✓ recommandationsSurstock → 2 recommandations
     ✓ analyseRentabilite → basée sur le CA réel

  🎯 Rafraîchissez la page Intelligence Stock dans le dashboard !
`);

  await prisma.$disconnect();
  console.log('🎉 Seed terminé avec succès !');
}

main().catch((err) => {
  console.error('❌ Erreur :', err);
  process.exit(1);
});
