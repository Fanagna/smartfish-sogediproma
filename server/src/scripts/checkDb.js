const prisma = require('../config/database');

async function checkDatabase() {
  try {
    const now = new Date();
    const date180jAgo = new Date(now);
    date180jAgo.setDate(date180jAgo.getDate() - 180);
    const date90jAgo = new Date(now);
    date90jAgo.setDate(date90jAgo.getDate() - 90);

    console.log('=== VÉRIFICATION DES DONNÉES ===');
    console.log(`Date actuelle: ${now.toISOString()}`);
    console.log(`Date -180j: ${date180jAgo.toISOString()}`);
    console.log('');

    // ---- CAPTURES ----
    const totalCaptures = await prisma.capture.count();
    const captures180j = await prisma.capture.count({ where: { date: { gte: date180jAgo } } });
    const firstCapture = await prisma.capture.findFirst({ orderBy: { date: 'asc' }, select: { date: true } });
    const lastCapture = await prisma.capture.findFirst({ orderBy: { date: 'desc' }, select: { date: true } });
    const speciesDistinct = await prisma.capture.groupBy({ by: ['espece'], _count: { id: true } });
    const zonesDistinct = await prisma.capture.groupBy({ by: ['zonePeche'], _count: { id: true } });

    console.log('📊 CAPTURES');
    console.log(`  Total: ${totalCaptures}`);
    console.log(`  Derniers 180 jours: ${captures180j}`);
    console.log(`  Première capture: ${firstCapture?.date?.toISOString() || 'N/A'}`);
    console.log(`  Dernière capture: ${lastCapture?.date?.toISOString() || 'N/A'}`);
    console.log(`  Espèces distinctes: ${speciesDistinct.length}`);
    console.log(`  Zones distinctes: ${zonesDistinct.length}`);

    // ---- STOCKS ----
    const totalStocks = await prisma.stock.count();
    const stocksActifs = await prisma.stock.count({ where: { dateSortie: null } });
    console.log('');
    console.log('📦 STOCKS');
    console.log(`  Total: ${totalStocks}`);
    console.log(`  Actifs (dateSortie = null): ${stocksActifs}`);

    // ---- ANOMALIES ----
    const totalAnomalies = await prisma.anomalie.count();
    const anomalies180j = await prisma.anomalie.count({ where: { date: { gte: date90jAgo } } });
    const lastAnomalie = await prisma.anomalie.findFirst({ orderBy: { date: 'desc' }, select: { date: true } });
    console.log('');
    console.log('⚠️ ANOMALIES');
    console.log(`  Total: ${totalAnomalies}`);
    console.log(`  Derniers 90 jours: ${anomalies180j}`);
    console.log(`  Dernière anomalie: ${lastAnomalie?.date?.toISOString() || 'N/A'}`);

    // ---- BATEAUX ----
    const totalBateaux = await prisma.bateau.count();
    console.log('');
    console.log('🚢 BATEAUX');
    console.log(`  Total: ${totalBateaux}`);

    // ---- VENTES ----
    const totalVentes = await prisma.vente.count();
    const ventes180j = await prisma.vente.count({ where: { date: { gte: date180jAgo } } });
    console.log('');
    console.log('💰 VENTES');
    console.log(`  Total: ${totalVentes}`);
    console.log(`  Derniers 180 jours: ${ventes180j}`);

    // ---- EXPORTATIONS ----
    const totalExportations = await prisma.exportation.count();
    const exportations180j = await prisma.exportation.count({ where: { date: { gte: date180jAgo } } });
    console.log('');
    console.log('📤 EXPORTATIONS');
    console.log(`  Total: ${totalExportations}`);
    console.log(`  Derniers 180 jours: ${exportations180j}`);

    // ---- DÉCISION LOGS ----
    const totalDecisionLogs = await prisma.decisionLog.count();
    console.log('');
    console.log('🧠 DECISION LOGS');
    console.log(`  Total: ${totalDecisionLogs}`);

    // ---- ESPÈCES PAR CAPTURE (top 10) ----
    console.log('');
    console.log('🐟 TOP ESPÈCES CAPTURÉES');
    for (const s of speciesDistinct.slice(0, 10)) {
      const sum = await prisma.capture.aggregate({
        where: { espece: s.espece },
        _sum: { poids: true, quantite: true },
        _count: { id: true }
      });
      console.log(`  ${s.espece}: ${sum._count.id} captures, ${(sum._sum.poids || 0).toFixed(1)} kg, ${sum._sum.quantite || 0} unités`);
    }

    // ---- ZONES PAR CAPTURE ----
    console.log('');
    console.log('📍 ZONES DE PÊCHE');
    for (const z of zonesDistinct) {
      console.log(`  ${z.zonePeche}: ${z._count.id} captures`);
    }

    console.log('');
    console.log('=== VÉRIFICATION TERMINÉE ===');
  } catch (error) {
    console.error('ERREUR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
