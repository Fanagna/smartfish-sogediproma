const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * One-time seed endpoint
 * GET /api/seed
 * Exécute le seed uniquement si la base est vide (sécurisé : pas de double seed)
 */
const seedDatabase = async (req, res) => {
  try {
    // Vérifier si la base a déjà des données (sécurité anti-double seed)
    const userCount = await prisma.user.count();
    
    if (userCount > 0) {
      return res.status(400).json({
        error: 'La base contient déjà des données. Seed annulé pour éviter les doublons.',
        userCount
      });
    }

    logger.info('🌱 Lancement du seed via endpoint API...');

    // Exécuter le script de seed
    const seedModule = require('../../prisma/seed');
    
    // Le seed.js s'exécute tout seul, mais on attends qu'il finisse
    // On utilise le même pattern que le fichier seed.js
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // ─── USER ADMIN ───
    const admin = await prisma.user.create({
      data: {
        email: 'admin@smartfish.com',
        password: hashedPassword,
        nom: 'Administrateur',
        prenom: 'SmartFish',
        role: 'ADMIN'
      }
    });
    logger.info(`✅ Admin créé: ${admin.email}`);

    // ─── CAPITAINE ───
    const hashedPassword2 = await bcrypt.hash('capitaine123', 10);
    const capitaine = await prisma.user.create({
      data: {
        email: 'capitaine@smartfish.com',
        password: hashedPassword2,
        nom: 'Le Capitaine',
        prenom: 'Jean',
        role: 'CAPITAINE'
      }
    });
    logger.info(`✅ Capitaine créé: ${capitaine.email}`);

    // ─── BATEAUX ───
    const bateaux = await Promise.all([
      prisma.bateau.create({
        data: {
          nom: 'Le Marin',
          immatriculation: 'SF-001',
          type: 'Chalutier',
          longueur: 18.5,
          carburantCapacity: 600,
          carburantRestant: 450,
          consoHoraire: 25,
          capitaineId: capitaine.id,
          capitaineNom: 'Jean Le Capitaine'
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
          consoHoraire: 32,
          capitaineId: capitaine.id,
          capitaineNom: 'Jean Le Capitaine'
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
          consoHoraire: 18,
          capitaineNom: 'Pierre Le Matelot'
        }
      })
    ]);
    logger.info(`✅ ${bateaux.length} Bateaux créés`);

    // ─── STOCKS ───
    const stocks = await Promise.all([
      prisma.stock.create({ data: { bateauId: bateaux[0].id, espece: 'Cabillaud', quantite: 150, unite: 'kg', seuil: 60 } }),
      prisma.stock.create({ data: { bateauId: bateaux[0].id, espece: 'Sardine', quantite: 200, unite: 'kg', seuil: 80 } }),
      prisma.stock.create({ data: { bateauId: bateaux[1].id, espece: 'Maquereau', quantite: 120, unite: 'kg', seuil: 50 } }),
      prisma.stock.create({ data: { bateauId: bateaux[2].id, espece: 'Turbot', quantite: 80, unite: 'kg', seuil: 40 } }),
      prisma.stock.create({ data: { bateauId: bateaux[0].id, espece: 'Dorade', quantite: 90, unite: 'kg', seuil: 30 } }),
      prisma.stock.create({ data: { bateauId: bateaux[1].id, espece: 'Sole', quantite: 60, unite: 'kg', seuil: 25 } }),
    ]);
    logger.info(`✅ ${stocks.length} Stocks créés`);

    // ─── CAPTURES (50 aléatoires) ───
    const especes = ['Cabillaud', 'Sardine', 'Hareng', 'Maquereau', 'Turbot', 'Sole', 'Dorade', 'Thon', 'Bar', 'Merlu'];
    const zones = ['Zone A - Nosy Be', 'Zone B - Toliara', 'Zone C - Fort Dauphin', 'Zone D - Toamasina', 'Zone E - Antsiranana'];
    const captures = [];
    for (let i = 0; i < 50; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 90));
      captures.push({
        bateauId: bateaux[Math.floor(Math.random() * bateaux.length)].id,
        userId: admin.id,
        date,
        espece: especes[Math.floor(Math.random() * especes.length)],
        poids: parseFloat((Math.random() * 200 + 10).toFixed(1)),
        quantite: Math.floor(Math.random() * 50) + 1,
        zonePeche: zones[Math.floor(Math.random() * zones.length)],
        profondeur: parseFloat((Math.random() * 100 + 5).toFixed(1)),
        temperature: parseFloat((Math.random() * 15 + 5).toFixed(1))
      });
    }
    await prisma.capture.createMany({ data: captures });
    logger.info(`✅ ${captures.length} Captures créées`);

    // ─── MAINTENANCES ───
    const maintenances = [];
    const types = ['MOTEUR', 'HYDRAULIQUE', 'COQUE', 'ELECTRONIQUE', 'AUTRE'];
    for (let i = 0; i < 15; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 180));
      maintenances.push({
        bateauId: bateaux[Math.floor(Math.random() * bateaux.length)].id,
        userId: admin.id,
        type: types[Math.floor(Math.random() * types.length)],
        description: 'Maintenance régulière',
        date,
        statut: 'TERMINE',
        cout: parseFloat((Math.random() * 2000 + 500).toFixed(2))
      });
    }
    await prisma.maintenance.createMany({ data: maintenances });
    logger.info(`✅ ${maintenances.length} Maintenances créées`);

    // ─── CLIENTS ───
    const clientsData = [
      { nom: 'Le Grand Large', type: 'Restaurant' },
      { nom: 'Poissonnerie Tanà', type: 'Poissonnerie' },
      { nom: 'SuperMarché Leader Price', type: 'Supermarche' },
      { nom: 'Société Export Océan Indien', type: 'Grossiste' },
      { nom: 'Association Pêche Durable', type: 'Association' },
      { nom: 'Collectivité Région Boeny', type: 'Collectivite' },
      { nom: 'Rodel Restaurant Gastronomique', type: 'Restaurant' },
      { nom: 'Poissonnerie Fort Dauphin', type: 'Poissonnerie' },
      { nom: 'Monsieur Rakotoarisoa', type: 'Particulier' },
      { nom: 'Madame Rasoamanana', type: 'Particulier' },
      { nom: 'Espace Créol', type: 'Restaurant' },
      { nom: 'Distrib Alimentation SA', type: 'Grossiste' },
    ];
    const clients = await Promise.all(
      clientsData.map(c => prisma.client.create({
        data: { userId: admin.id, nom: c.nom, type: c.type, totalAchats: 0, nbCommandes: 0 }
      }))
    );
    logger.info(`✅ ${clients.length} Clients créés`);

    // ─── VENTES ───
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
        date, espece, quantite, prixUnitaire, total,
        typeClient: client.type.toUpperCase()
      });
      client.totalAchats += total;
      client.nbCommandes += 1;
    }
    await prisma.vente.createMany({ data: ventes });
    for (const client of clients) {
      await prisma.client.update({
        where: { id: client.id },
        data: { totalAchats: client.totalAchats, nbCommandes: client.nbCommandes }
      });
    }
    logger.info(`✅ ${ventes.length} Ventes créées`);

    // ─── EXPORTATIONS ───
    const pays = ['France', 'Espagne', 'Italie', 'Belgique', 'Suisse', 'Portugal'];
    const exports = [];
    for (let i = 0; i < 15; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 90));
      const espece = especes[Math.floor(Math.random() * especes.length)];
      const quantite = parseFloat((Math.random() * 200 + 50).toFixed(1));
      const prixTotal = parseFloat((quantite * (Math.random() * 15 + 8)).toFixed(2));
      const client = clients.filter(c => c.type === 'Grossiste' || c.type === 'Supermarche')[Math.floor(Math.random() * 3)] || clients[0];
      exports.push({
        stockId: stocks[Math.floor(Math.random() * stocks.length)].id,
        clientId: client.id,
        userId: admin.id,
        date, espece, quantite, prixTotal,
        paysDestination: pays[Math.floor(Math.random() * pays.length)],
        statut: 'LIVRE'
      });
    }
    await prisma.exportation.createMany({ data: exports });
    logger.info(`✅ ${exports.length} Exportations créées`);

    return res.json({
      success: true,
      message: '🌱 Base de données seedée avec succès !',
      stats: {
        users: 2,
        bateaux: bateaux.length,
        stocks: stocks.length,
        captures: captures.length,
        maintenances: maintenances.length,
        clients: clients.length,
        ventes: ventes.length,
        exportations: exports.length
      },
      comptes: {
        admin: { email: 'admin@smartfish.com', password: 'admin123' },
        capitaine: { email: 'capitaine@smartfish.com', password: 'capitaine123' }
      }
    });
  } catch (error) {
    logger.error(`❌ Erreur seed: ${error.message}`);
    return res.status(500).json({ error: `Erreur seed: ${error.message}` });
  }
};

module.exports = { seedDatabase };
