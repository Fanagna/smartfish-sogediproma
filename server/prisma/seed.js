const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding...');

  // ─── Nettoyage des données existantes (ordre inverse des dépendances) ───
  console.log('🧹 Nettoyage des données existantes...');
  await prisma.vente.deleteMany();
  await prisma.exportation.deleteMany();
  await prisma.maintenance.deleteMany();
  await prisma.capture.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.fraude.deleteMany();
  await prisma.anomalie.deleteMany();
  await prisma.achat.deleteMany();
  await prisma.ordreMission.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.client.deleteMany();
  await prisma.decisionLog.deleteMany();
  await prisma.rapport.deleteMany();
  await prisma.bateau.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Base nettoyée');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@smartfish.com',
      password: hashedPassword,
      nom: 'Administrateur',
      prenom: 'SmartFish',
      role: 'ADMIN'
    }
  });

  console.log('✅ Admin créé:', admin.email);

  const bateaux = await Promise.all([
    prisma.bateau.create({
      data: {
        nom: 'Le Marin',
        immatriculation: 'SF-001',
        type: 'Chalutier',
        longueur: 18.5,
        carburantCapacity: 600,
        carburantRestant: 450,
        capitaineId: admin.id
      }
    }),
    prisma.bateau.create({
      data: {
        nom: 'La Pêcheuse',
        immatriculation: 'SF-002',
        type: 'Senneur',
        longueur: 22.3,
        carburantCapacity: 800,
        carburantRestant: 620,
        capitaineId: admin.id
      }
    }),
    prisma.bateau.create({
      data: {
        nom: 'Ocean Star',
        immatriculation: 'SF-003',
        type: 'Filet maillant',
        longueur: 15.8,
        carburantCapacity: 400,
        carburantRestant: 350,
        capitaineId: admin.id
      }
    })
  ]);

  console.log('✅ 3 Bateaux créés');

  const especes = ['Cabillaud', 'Sardine', 'Hareng', 'Maquereau', 'Turbot', 'Sole', 'Dorade'];
  const zones = ['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E'];

  const stocks = await Promise.all([
    prisma.stock.create({
      data: {
        bateauId: bateaux[0].id,
        espece: 'Cabillaud',
        quantite: 150,
        unite: 'kg',
        seuil: 60,
        alerte: false
      }
    }),
    prisma.stock.create({
      data: {
        bateauId: bateaux[0].id,
        espece: 'Sardine',
        quantite: 200,
        unite: 'kg',
        seuil: 80,
        alerte: false
      }
    }),
    prisma.stock.create({
      data: {
        bateauId: bateaux[1].id,
        espece: 'Maquereau',
        quantite: 120,
        unite: 'kg',
        seuil: 50,
        alerte: false
      }
    }),
    prisma.stock.create({
      data: {
        bateauId: bateaux[2].id,
        espece: 'Turbot',
        quantite: 80,
        unite: 'kg',
        seuil: 40,
        alerte: false
      }
    })
  ]);

  console.log('✅ 4 Stocks créés');

  const captures = [];
  for (let i = 0; i < 50; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 90));
    
    captures.push({
      bateauId: bateaux[Math.floor(Math.random() * bateaux.length)].id,
      userId: admin.id,
      date: date,
      espece: especes[Math.floor(Math.random() * especes.length)],
      poids: Math.random() * 200 + 10,
      quantite: Math.floor(Math.random() * 50) + 1,
      zonePeche: zones[Math.floor(Math.random() * zones.length)],
      profondeur: Math.random() * 100 + 5,
      temperature: Math.random() * 15 + 5
    });
  }

  await prisma.capture.createMany({
    data: captures
  });

  console.log('✅ 50 Captures aléatoires créées');

  // Maintenance
  const maintenanceTypes = ['MOTEUR', 'HYDRAULIQUE', 'COQUE', 'ELECTRONIQUE', 'AUTRE'];
  const maintenances = [];
  for (let i = 0; i < 15; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 180));
    maintenances.push({
      bateauId: bateaux[Math.floor(Math.random() * bateaux.length)].id,
      userId: admin.id,
      type: maintenanceTypes[Math.floor(Math.random() * maintenanceTypes.length)],
      description: 'Maintenance régulière',
      date,
      statut: 'TERMINE',
      cout: Math.random() * 2000 + 500
    });
  }
  await prisma.maintenance.createMany({ data: maintenances });
  console.log('✅ 15 Maintenances créées');

  // ─── Clients ───
  const clientsData = [
    { nom: 'Le Grand Large', email: 'contact@legrandlarge.mg', telephone: '+261 34 12 345 01', type: 'Restaurant' },
    { nom: 'Poissonnerie Tanà', email: 'info@poissonnerietana.mg', telephone: '+261 34 12 345 02', type: 'Poissonnerie' },
    { nom: 'SuperMarché Leader Price', email: 'achats@leaderprice.mg', telephone: '+261 34 12 345 03', type: 'Supermarche' },
    { nom: 'Société Export Océan Indien', email: 'export@seoi.mg', telephone: '+261 34 12 345 04', type: 'Grossiste' },
    { nom: 'Association Pêche Durable', email: 'contact@aped.mg', telephone: '+261 34 12 345 05', type: 'Association' },
    { nom: 'Collectivité Région Boeny', email: 'marche@boeny.mg', telephone: '+261 34 12 345 06', type: 'Collectivite' },
    { nom: 'Rodel Restaurant Gastronomique', email: 'rodel@restaurant.mg', telephone: '+261 34 12 345 07', type: 'Restaurant' },
    { nom: 'Poissonnerie Fort Dauphin', email: 'poisson@ftd.mg', telephone: '+261 34 12 345 08', type: 'Poissonnerie' },
    { nom: 'Monsieur Rakotoarisoa', email: 'rakoto@gmail.com', telephone: '+261 34 12 345 09', type: 'Particulier' },
    { nom: 'Madame Rasoamanana', email: 'rasoa@gmail.com', telephone: '+261 34 12 345 10', type: 'Particulier' },
    { nom: 'Espace Créol', email: 'creol@espace.mg', telephone: '+261 34 12 345 11', type: 'Restaurant' },
    { nom: 'Distrib Alimentation SA', email: 'commandes@distribal.mg', telephone: '+261 34 12 345 12', type: 'Grossiste' },
  ];

  const clients = await Promise.all(
    clientsData.map(c =>
      prisma.client.create({
        data: {
          userId: admin.id,
          nom: c.nom,
          email: c.email,
          telephone: c.telephone,
          type: c.type,
          totalAchats: 0,
          nbCommandes: 0
        }
      })
    )
  );
  console.log(`✅ ${clients.length} Clients créés`);

  // Ventes — LIÉES AUX CLIENTS
  const typeClients = ['RESTAURANT', 'MARCHE', 'SUPERMARCHE', 'EXPORTATEUR'];
  const ventes = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 60));
    const espece = especes[Math.floor(Math.random() * especes.length)];
    const quantite = parseFloat((Math.random() * 100 + 10).toFixed(1));
    const prixUnitaire = parseFloat((Math.random() * 20 + 5).toFixed(2));
    const total = parseFloat((quantite * prixUnitaire).toFixed(2));
    const client = clients[Math.floor(Math.random() * clients.length)];
    ventes.push({
      stockId: stocks[Math.floor(Math.random() * stocks.length)].id,
      clientId: client.id,
      userId: admin.id,
      date,
      espece,
      quantite,
      prixUnitaire,
      total,
      typeClient: client.type.toUpperCase()
    });
    // Mettre à jour les stats du client
    client.totalAchats += total;
    client.nbCommandes += 1;
  }
  await prisma.vente.createMany({ data: ventes });

  // Sauvegarder les stats clients mises à jour
  for (const client of clients) {
    await prisma.client.update({
      where: { id: client.id },
      data: { totalAchats: client.totalAchats, nbCommandes: client.nbCommandes }
    });
  }
  console.log('✅ 30 Ventes créées (liées aux clients)');

  // Exportations — LIÉES AUX CLIENTS
  const paysDestinations = ['France', 'Espagne', 'Italie', 'Belgique', 'Suisse', 'Portugal'];
  const exportations = [];
  for (let i = 0; i < 15; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 90));
    const espece = especes[Math.floor(Math.random() * especes.length)];
    const quantite = parseFloat((Math.random() * 200 + 50).toFixed(1));
    const prixTotal = parseFloat((quantite * (Math.random() * 15 + 8)).toFixed(2));
    // Prendre un client de type Grossiste pour les exportations
    const exportClient = clients.filter(c => c.type === 'Grossiste' || c.type === 'Supermarche')[Math.floor(Math.random() * 3)] || clients[0];
    exportations.push({
      stockId: stocks[Math.floor(Math.random() * stocks.length)].id,
      clientId: exportClient.id,
      userId: admin.id,
      date,
      espece,
      quantite,
      paysDestination: paysDestinations[Math.floor(Math.random() * paysDestinations.length)],
      prixTotal,
      statut: 'LIVRE'
    });
    // Mettre à jour les stats du client exportateur
    exportClient.totalAchats += prixTotal;
    exportClient.nbCommandes += 1;
  }
  await prisma.exportation.createMany({ data: exportations });

  // Sauvegarder les stats clients mises à jour (exportations)
  for (const client of clients) {
    await prisma.client.update({
      where: { id: client.id },
      data: { totalAchats: client.totalAchats, nbCommandes: client.nbCommandes }
    });
  }
  console.log('✅ 15 Exportations créées (liées aux clients)');

  // ─── NOTIFICATIONS DE DÉMONSTRATION ───
  console.log('🔔 Création de notifications de démonstration...');

  const demoNotifications = [
    {
      userId: admin.id,
      message: '🚨 Anomalie critique détectée sur le capteur du bateau "Le Marin" — température moteur anormale',
      type: 'error',
      read: false,
      link: '/anomalies'
    },
    {
      userId: admin.id,
      message: '⚠️ Alerte stock : Cabillaud — seuil critique atteint (45 kg restants)',
      type: 'warning',
      read: false,
      link: '/stocks'
    },
    {
      userId: admin.id,
      message: '✅ Prédiction IA terminée : Captures estimées à 320 kg cette semaine',
      type: 'success',
      read: false,
      link: '/ia/predictions-captures'
    },
    {
      userId: admin.id,
      message: 'ℹ️ Nouvelle zone de pêche recommandée par l\'IA : Zone C (Fort Dauphin)',
      type: 'info',
      read: false,
      link: '/ia/zones-peche'
    },
    {
      userId: admin.id,
      message: '🚨 Fraude potentielle détectée : écart de stock important pour la Sardine (-120 kg)',
      type: 'error',
      read: false,
      link: '/ia/detection-fraude'
    },
    {
      userId: admin.id,
      message: '⚠️ Maintenance prédictive : Le bateau "Ocean Star" nécessite une révision dans 15 jours',
      type: 'warning',
      read: false,
      link: '/ia/maintenance-predictive'
    },
    {
      userId: admin.id,
      message: '✅ Exportation vers la France livrée avec succès (850 kg de Turbot)',
      type: 'success',
      read: false,
      link: '/exportations'
    },
    {
      userId: admin.id,
      message: '📊 Rapport mensuel IA disponible — Consultez les recommandations DG',
      type: 'info',
      read: false,
      link: '/ia/rapports'
    },
    {
      userId: admin.id,
      message: '⛽ Le Marin — Niveau carburant bas (15%). Prévoir ravitaillement.',
      type: 'warning',
      read: false,
      link: '/flotte'
    },
    {
      userId: admin.id,
      message: '✅ Objectif mensuel dépassé : CA de 12,5M Ar contre 10M Ar prévu',
      type: 'success',
      read: true,
      link: '/dashboard-ia'
    },
  ];

  // Créer les notifications avec des dates échelonnées (les plus récentes en premier)
  for (let i = 0; i < demoNotifications.length; i++) {
    const date = new Date();
    date.setMinutes(date.getMinutes() - (i * 15 + Math.floor(Math.random() * 10)));
    await prisma.notification.create({
      data: {
        ...demoNotifications[i],
        createdAt: date
      }
    });
  }
  console.log(`✅ ${demoNotifications.length} Notifications de démonstration créées`);

  console.log('🎉 Seeding terminé avec succès!');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
