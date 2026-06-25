const { GoogleGenerativeAI } = require('@google/generative-ai');
const prisma = require('../config/database');
const logger = require('../utils/logger');

// ─── Instance unique Gemini ───
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

/**
 * Générateur fallback intelligent — analyse les données réelles pour produire
 * des recommandations, prédictions et analyses pertinentes même quand Gemini
 * est indisponible.
 * 
 * Chaque type analyse les données passées et génère des résultats concrets
 * basés sur des règles métier et des calculs statistiques simples.
 */
function generateFallback(type, data) {
  const now = new Date();
  const date30j = new Date(now); date30j.setDate(date30j.getDate() - 30);
  const date7j = new Date(now); date7j.setDate(date7j.getDate() - 7);
  const date90j = new Date(now); date90j.setDate(date90j.getDate() - 90);

  const fallbacks = {

    // ── GLOBAL_ANALYSIS ──
    GLOBAL_ANALYSIS: () => {
      const { captures = [], stocks = [], bateaux = [], maintenances = [], ventes = [], exportations = [], anomalies = [] } = data;
      const capt30j = captures.filter(c => new Date(c.date) >= date30j);
      const stockTotal = stocks.reduce((s, st) => s + (st.quantite || 0), 0);
      const ca30j = ventes.filter(v => new Date(v.date) >= date30j).reduce((s, v) => s + (v.total || 0), 0);
      const anomaliesActives = anomalies.filter(a => a.statut === 'EN_ATTENTE').length;
      const bateauxActifs = bateaux.filter(b => b.etat === 'ACTIF' || !b.etat).length;

      const tendances = [];
      if (capt30j.length > 10) tendances.push({ type: 'captures', description: `Activité de pêche soutenue avec ${capt30j.length} opérations en 30 jours`, tendance: 'positive' });
      else if (capt30j.length > 0) tendances.push({ type: 'captures', description: `Activité modérée avec ${capt30j.length} opérations en 30 jours`, tendance: 'neutre' });
      else tendances.push({ type: 'captures', description: 'Aucune opération de capture récente détectée', tendance: 'negative' });

      if (stockTotal > 10000) tendances.push({ type: 'stock', description: `Stock total de ${stockTotal.toLocaleString('fr-FR')} kg — couverture satisfaisante`, tendance: 'positive' });
      else if (stockTotal > 0) tendances.push({ type: 'stock', description: `Stock total de ${stockTotal.toLocaleString('fr-FR')} kg — niveau modéré`, tendance: 'neutre' });

      if (ca30j > 0) tendances.push({ type: 'ventes', description: `Chiffre d'affaires de ${ca30j.toLocaleString('fr-FR')} Ar sur 30 jours`, tendance: ca30j > 500000 ? 'positive' : 'neutre' });

      const pointsForts = [];
      if (capt30j.length > 0) pointsForts.push(`${capt30j.length} opérations de pêche réalisées en 30 jours`);
      if (stockTotal > 5000) pointsForts.push(`Stock important de ${stockTotal.toLocaleString('fr-FR')} kg disponible`);
      if (ca30j > 1000000) pointsForts.push(`Chiffre d'affaires de ${ca30j.toLocaleString('fr-FR')} Ar sur 30 jours`);
      if (bateauxActifs > 0) pointsForts.push(`${bateauxActifs} bateaux opérationnels`);
      if (exportations.length > 0) pointsForts.push(`${exportations.length} opérations d'exportation enregistrées`);

      const risques = [];
      if (stocks.filter(s => s.quantite <= s.seuil).length > 0) risques.push({ description: `${stocks.filter(s => s.quantite <= s.seuil).length} produit(s) en stock sous seuil critique`, niveau: 'haute' });
      if (anomaliesActives > 5) risques.push({ description: `${anomaliesActives} anomalies en attente de résolution`, niveau: 'moyenne' });
      if (bateaux.filter(b => b.carburantRestant < b.carburantCapacity * 0.2).length > 0) risques.push({ description: `Carburant bas sur ${bateaux.filter(b => b.carburantRestant < b.carburantCapacity * 0.2).length} bateau(x)`, niveau: 'moyenne' });

      return {
        kpiCles: {
          totalCaptures30j: capt30j.length,
          stockTotal: Math.round(stockTotal),
          caVentes30j: Math.round(ca30j),
          nbAnomaliesActives: anomaliesActives,
          nbBateauxActifs: bateauxActifs
        },
        tendances,
        pointsForts: pointsForts.length > 0 ? pointsForts : ['Aucun point fort majeur identifié'],
        risques: risques.length > 0 ? risques : [{ description: 'Aucun risque majeur détecté. Les indicateurs sont globalement stables.', niveau: 'basse' }],
        opportunites: [
          stockTotal > 5000 ? `Écouler le stock de ${stockTotal.toLocaleString('fr-FR')} kg via des canaux locaux ou export` : 'Reconstituer le stock pour sécuriser les ventes',
          capt30j.length > 5 ? 'Augmenter la fréquence des sorties de pêche pour maximiser la production' : 'Planifier des sorties de pêche pour relancer la production',
          anomaliesActives > 0 ? 'Traiter les anomalies en attente pour améliorer la conformité' : 'Maintenir le faible taux d\'anomalies'
        ],
        recommandationsImmediates: [
          stockTotal < 5000 ? { titre: '🚨 Réapprovisionnement urgent', description: `Le stock total est de ${stockTotal.toLocaleString('fr-FR')} kg. Planifier des approvisionnements urgents.`, priorite: 'haute' } : { titre: '📊 Gestion des stocks', description: `Stock de ${stockTotal.toLocaleString('fr-FR')} kg. Surveiller les sorties et planifier les réapprovisionnements.`, priorite: 'moyenne' },
          anomaliesActives > 3 ? { titre: '🔍 Résolution d\'anomalies', description: `${anomaliesActives} anomalies en attente. Prioriser leur résolution.`, priorite: 'haute' } : { titre: '✅ Conformité', description: `${anomaliesActives} anomalie(s) en attente — suivi régulier recommandé.`, priorite: 'basse' },
          bateauxActifs > 0 ? { titre: '⚓ Planification flotte', description: `${bateauxActifs} bateau(x) disponible(s). Optimiser les rotations pour maximiser le rendement.`, priorite: 'moyenne' } : { titre: '⚓ Maintenance flotte', description: 'Aucun bateau actif. Vérifier l\'état de la flotte.', priorite: 'haute' }
        ],
        disponible: true,
        raison: 'Analyse fallback basée sur les données réelles'
      };
    },

    // ── PREDICTION (IA3 Captures + IA11 Stocks) ──
    PREDICTION: () => {
      const { captures = [], stocks = [] } = data;
      const capt90j = captures.filter(c => new Date(c.date) >= date90j);

      // Compter les espèces les plus fréquentes dans les captures récentes
      const especesCount = {};
      capt90j.forEach(c => { especesCount[c.espece] = (especesCount[c.espece] || 0) + 1; });
      const totalCapt = Object.values(especesCount).reduce((s, v) => s + v, 0);
      const topEspeces = Object.entries(especesCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([espece, count]) => ({
          espece,
          probabilite: totalCapt > 0 ? Math.round((count / totalCapt) * 100) : 0
        }));

      // Prédictions stocks
      const predictionStocks = stocks.map(s => {
        const ventesEspece = data.ventes ? data.ventes.filter(v => v.espece === s.espece && new Date(v.date) >= date30j) : [];
        const venteRate = ventesEspece.reduce((sum, v) => sum + (v.quantite || 0), 0) / 30;
        const joursRestants = venteRate > 0 ? Math.round(s.quantite / venteRate) : 999;
        return {
          espece: s.espece,
          statut: joursRestants < 14 ? 'insuffisant' : 'suffisant',
          recommandation: joursRestants < 14
            ? `Stock critique — prévoir réapprovisionnement urgent (${joursRestants} jours restants estimés)`
            : joursRestants < 30
              ? `Surveillance renforcée — stock pour ${joursRestants} jours environ`
              : `Stock confortable — couverture estimée à ${joursRestants} jours`
        };
      });

      return {
        predictionCaptures: topEspeces,
        predictionStocks,
        disponible: true,
        raison: 'Prédictions basées sur l\'historique réel des données'
      };
    },

    // ── ZONE (IA7) ──
    ZONE: () => {
      const { captures = [] } = data;
      const capt90j = captures.filter(c => new Date(c.date) >= date90j);

      // Analyser les zones de pêche dans les captures
      const zonesData = {};
      capt90j.forEach(c => {
        const zone = c.zonePeche || 'Non spécifiée';
        if (!zonesData[zone]) zonesData[zone] = { poids: 0, nbCaptures: 0, especes: new Set() };
        zonesData[zone].poids += c.poids || 0;
        zonesData[zone].nbCaptures++;
        zonesData[zone].especes.add(c.espece);
      });

      // Zones recommandées triées par rendement
      const zones = Object.entries(zonesData)
        .sort((a, b) => b[1].poids - a[1].poids)
        .slice(0, 5)
        .map(([nom, zd]) => ({
          nom,
          espece: [...zd.especes].slice(0, 3).join(', '),
          moment: zd.nbCaptures > 5 ? 'Toute la journée — bonne activité' : 'Matin — meilleur rendement observé',
          justification: `${zd.nbCaptures} opérations, ${zd.poids.toFixed(0)} kg capturés — ${[...zd.especes].length} espèces différentes`
        }));

      return {
        zones: zones.length > 0
          ? zones
          : [{ nom: 'Zone côtière Est', espece: 'Captures variées', moment: 'Matin (6h-10h)', justification: 'Zone historiquement productive — données insuffisantes pour une analyse poussée' }],
        disponible: true,
        raison: 'Analyse des zones basée sur les captures réelles'
      };
    },

    // ── RECOMMANDATION (générale) ──
    RECOMMANDATION: () => {
      const { captures = [], stocks = [], maintenance = [] } = data;
      const recommandations = [];

      // Stock sous seuil
      const stocksBas = stocks.filter(s => s.quantite <= s.seuil);
      if (stocksBas.length > 0) {
        recommandations.push({
          categorie: 'stock', titre: '📦 Réapprovisionnement stocks',
          contenu: `${stocksBas.length} produit(s) sous seuil critique : ${stocksBas.map(s => `${s.espece} (${s.quantite}/${s.seuil} ${s.unite || 'kg'})`).join(', ')}.`,
          priorite: stocksBas.length > 3 ? 'haute' : 'moyenne'
        });
      }

      // Maintenance préventive
      const maintsUrgentes = maintenance.filter(m => new Date(m.date) < date30j);
      if (maintsUrgentes.length > 0) {
        recommandations.push({
          categorie: 'maintenance', titre: '🔧 Maintenance préventive',
          contenu: `${maintsUrgentes.length} maintenance(s) ancienne(s) identifiée(s) — planifier les interventions.`,
          priorite: maintsUrgentes.length > 3 ? 'haute' : 'moyenne'
        });
      }

      // Captures récentes
      const capt30j = captures.filter(c => new Date(c.date) >= date30j).length;
      if (capt30j === 0) {
        recommandations.push({
          categorie: 'captures', titre: '🎣 Reprise des activités de pêche',
          contenu: 'Aucune capture récente détectée en 30 jours. Planifier des sorties pour maintenir la production.',
          priorite: 'haute'
        });
      } else if (capt30j < 5) {
        recommandations.push({
          categorie: 'captures', titre: '📈 Intensifier les sorties',
          contenu: `Seulement ${capt30j} opération(s) de pêche en 30 jours. Augmenter la fréquence pour améliorer le rendement.`,
          priorite: 'moyenne'
        });
      }

      // Conseil général
      recommandations.push({
        categorie: 'strategie', titre: '📊 Optimisation globale',
        contenu: 'Analyser régulièrement les KPIs pour ajuster la stratégie de pêche et de stockage.',
        priorite: 'basse'
      });

      return { recommandations, disponible: true, raison: 'Recommandations basées sur l\'analyse des données actuelles' };
    },

    // ── MAINTENANCE (IA4) ──
    MAINTENANCE: () => {
      const { bateaux = [], maintenance = [] } = data;
      const predictions = [];

      bateaux.forEach(b => {
        const maintsBateau = maintenance.filter(m => m.bateauId === b.id || m.bateau === b.id);
        const derniereMaint = maintsBateau.sort((a, m) => new Date(m.date) - new Date(a.date))[0];
        const joursDepuis = derniereMaint ? Math.floor((now - new Date(derniereMaint.date)) / (1000 * 60 * 60 * 24)) : 999;

        let priorite = 'basse';
        if (joursDepuis > 180) priorite = 'haute';
        else if (joursDepuis > 90) priorite = 'moyenne';

        // Calculer le nombre de jours jusqu'à la prochaine maintenance recommandée
        const joursAvantProchaine = priorite === 'haute' ? 7 : priorite === 'moyenne' ? 30 : Math.max(90 - joursDepuis, 0);
        const dateEstimee = new Date(now);
        dateEstimee.setDate(dateEstimee.getDate() + joursAvantProchaine);

        // Construire le type et la raison
        let type = '';
        let raison = '';
        if (!derniereMaint) {
          type = 'Maintenance initiale requise';
          raison = 'Aucun historique de maintenance trouvé — inspection complète recommandée';
        } else if (joursDepuis > 180) {
          type = 'Maintenance moteur/coque urgente';
          raison = `Dernière maintenance il y a ${joursDepuis} jours — intervention urgente requise`;
        } else if (joursDepuis > 90) {
          type = 'Maintenance préventive programmée';
          raison = `Dernière maintenance il y a ${joursDepuis} jours — planifier dans les 30 jours`;
        } else {
          type = 'Maintenance de routine — état satisfaisant';
          raison = `Dernière maintenance il y a ${joursDepuis} jours — prochaine visite dans ${joursAvantProchaine} jours environ`;
        }

        // Toujours générer une prédiction pour chaque bateau
        predictions.push({
          bateauId: b.id,
          nom: b.nom || `Bateau #${b.id}`,
          type,
          dateEstimee: dateEstimee.toISOString().split('T')[0],
          priorite,
          raison
        });
      });

      // Si aucun bateau, ajouter une prédiction par défaut
      if (predictions.length === 0) {
        predictions.push({
          bateauId: null,
          nom: 'Aucun bateau enregistré',
          type: 'Information',
          dateEstimee: now.toISOString().split('T')[0],
          priorite: 'basse',
          raison: 'Aucun bateau trouvé dans la base de données — ajoutez des bateaux pour obtenir des prédictions de maintenance.'
        });
      }

      return { predictions, disponible: true, raison: 'Prédictions basées sur l\'historique de maintenance réel' };
    },

    // ── MAINTENANCE_PREDICTION (maintenanceIAService cron) ──
    MAINTENANCE_PREDICTION: () => {
      const { bateaux = [], maintenanceRecords = [], maintenance = [] } = data;
      const maintenances = maintenanceRecords.length > 0 ? maintenanceRecords : maintenance;
      const predictions = [];

      bateaux.forEach(b => {
        const maintsBateau = maintenances.filter(m => m.bateauId === b.id || m.bateau === b.id);
        const derniereMaint = maintsBateau.sort((a, m) => new Date(m.date) - new Date(a.date))[0];
        const joursDepuis = derniereMaint ? Math.floor((now - new Date(derniereMaint.date)) / (1000 * 60 * 60 * 24)) : 999;

        let priorite = 'basse';
        if (joursDepuis > 180) priorite = 'haute';
        else if (joursDepuis > 90) priorite = 'moyenne';

        const joursAvantProchaine = priorite === 'haute' ? 7 : priorite === 'moyenne' ? 30 : Math.max(90 - joursDepuis, 0);
        const dateEstimee = new Date(now);
        dateEstimee.setDate(dateEstimee.getDate() + joursAvantProchaine);

        let type = '';
        let raison = '';
        if (!derniereMaint) {
          type = 'MAINTENANCE_INITIALE';
          raison = 'Aucun historique de maintenance trouvé — inspection complète recommandée';
        } else if (joursDepuis > 180) {
          type = 'URGENTE';
          raison = `Dernière maintenance il y a ${joursDepuis} jours — intervention urgente requise`;
        } else if (joursDepuis > 90) {
          type = 'PREVENTIVE';
          raison = `Dernière maintenance il y a ${joursDepuis} jours — planifier dans les 30 jours`;
        } else {
          type = 'ROUTINE';
          raison = `Dernière maintenance il y a ${joursDepuis} jours — prochaine visite dans ${joursAvantProchaine} jours environ`;
        }

        predictions.push({
          bateauId: b.id,
          type,
          dateEstimee: dateEstimee.toISOString().split('T')[0],
          priorite: priorite.toUpperCase(),
          raison
        });
      });

      if (predictions.length === 0) {
        predictions.push({
          bateauId: null,
          type: 'INFORMATION',
          dateEstimee: now.toISOString().split('T')[0],
          priorite: 'BASSE',
          raison: 'Aucun bateau trouvé dans la base de données.'
        });
      }

      return { predictions, disponible: true, raison: 'Prédictions basées sur l\'historique de maintenance réel' };
    },

    // ── VENTES (IA5) ──
    VENTES: () => {
      const { ventes = [], stocks = [] } = data;
      const ventes30j = ventes.filter(v => new Date(v.date) >= date30j);

      const parEspece = {};
      ventes30j.forEach(v => {
        if (!parEspece[v.espece]) parEspece[v.espece] = { quantite: 0, ca: 0, nbVentes: 0, prix: [] };
        parEspece[v.espece].quantite += v.quantite || 0;
        parEspece[v.espece].ca += v.total || 0;
        parEspece[v.espece].nbVentes++;
        if (v.prixUnitaire) parEspece[v.espece].prix.push(v.prixUnitaire);
      });

      // Calcul de tendance fiable: comparer première moitié vs deuxième moitié des 30j
      const dateMilieu = new Date(now); dateMilieu.setDate(dateMilieu.getDate() - 15);
      const ventes1ereMoitie = ventes30j.filter(v => new Date(v.date) >= date30j && new Date(v.date) < dateMilieu);
      const ventes2emeMoitie = ventes30j.filter(v => new Date(v.date) >= dateMilieu);

      const predictionVentes = Object.entries(parEspece).map(([espece, d]) => {
        const qteMoyenne = d.nbVentes > 0 ? d.quantite / d.nbVentes : 0;
        const caMoyen = d.nbVentes > 0 ? d.ca / d.nbVentes : 0;
        const stockEspece = stocks.filter(s => s.espece === espece).reduce((s, st) => s + (st.quantite || 0), 0);
        const stockRatio = stockEspece > 0 ? d.quantite / stockEspece : 0;
        // Tendance basée sur comparaison 1ère moitié vs 2ème moitié
        const qteAvant = ventes1ereMoitie.filter(v => v.espece === espece).reduce((s, v) => s + (v.quantite || 0), 0);
        const qteApres = ventes2emeMoitie.filter(v => v.espece === espece).reduce((s, v) => s + (v.quantite || 0), 0);
        let tendance = 'stable';
        if (qteAvant > 0 && qteApres > qteAvant * 1.2) tendance = 'hausse';
        else if (qteAvant > 0 && qteApres < qteAvant * 0.8) tendance = 'baisse';
        return {
          espece,
          quantiteEstimee: Math.round(qteMoyenne * 30),
          caEstime: Math.round(caMoyen * 30),
          tendance,
          recommandation: stockRatio > 1
            ? `Stock (${
              stockEspece.toLocaleString('fr-FR')} kg) insuffisant pour couvrir la demande — prévoir réapprovisionnement`
            : `Stock suffisant pour ${Math.round(1 / (stockRatio || 1))} mois de ventes`
        };
      });

      const recommandationsGenerales = [
        predictionVentes.length > 0 ? `Prioriser les ventes de ${predictionVentes.sort((a, b) => b.caEstime - a.caEstime)[0].espece} (CA estimé le plus élevé)` : 'Développer le portefeuille d\'espèces pour les ventes',
        ventes30j.length < 5 ? 'Intensifier les actions commerciales — faible volume de ventes sur 30 jours' : 'Maintenir le rythme des ventes et explorer de nouveaux débouchés',
        stocks.length > 0 ? 'Surveiller les niveaux de stock pour anticiper les ruptures' : 'Constituer un stock de base pour sécuriser les ventes'
      ];

      return { predictionVentes, recommandationsGenerales, disponible: true, raison: 'Prévisions basées sur l\'historique des ventes' };
    },

    // ── EXPORT (IA6) ──
    EXPORT: () => {
      const { exportations = [], stocks = [] } = data;
      const exp30j = exportations.filter(e => new Date(e.date) >= date30j);

      const parPays = {};
      exp30j.forEach(e => {
        if (!parPays[e.paysDestination]) parPays[e.paysDestination] = { quantite: 0, nbExports: 0, especes: new Set() };
        parPays[e.paysDestination].quantite += e.quantite || 0;
        parPays[e.paysDestination].nbExports++;
        parPays[e.paysDestination].especes.add(e.espece);
      });

      const predictionExportations = [];
      Object.entries(parPays).forEach(([pays, d]) => {
        [...d.especes].forEach(espece => {
          const qteEspece = exp30j.filter(e => e.paysDestination === pays && e.espece === espece)
            .reduce((s, e) => s + (e.quantite || 0), 0);
          const stockEspece = stocks.filter(s => s.espece === espece).reduce((s, st) => s + (st.quantite || 0), 0);
          // Utiliser le nb d'exports pour ce pays comme diviseur (pas le total général)
          const nbExportsPays = exp30j.filter(e => e.paysDestination === pays && e.espece === espece).length;
          predictionExportations.push({
            espece,
            paysDestination: pays,
            quantiteEstimee: Math.round((qteEspece / Math.max(nbExportsPays, 1)) * 30),
            opportunite: stockEspece > 1000,
            recommandation: stockEspece > 1000
              ? `Stock disponible de ${stockEspece.toLocaleString('fr-FR')} kg — opportunité d'exportation vers ${pays}`
              : `Stock limité (${stockEspece.toLocaleString('fr-FR')} kg) — privilégier le marché local`
          });
        });
      });

      const recommandationsGenerales = [
        predictionExportations.length > 0 ? 'Maintenir les relations commerciales avec les partenaires actuels' : 'Prospecter de nouveaux marchés d\'exportation',
        stocks.length > 10 ? 'Diversifier les espèces destinées à l\'export' : 'Augmenter la production pour alimenter les marchés export',
        'Optimiser la logistique export pour réduire les coûts et délais'
      ];

      return { predictionExportations, recommandationsGenerales, disponible: true, raison: 'Prévisions basées sur l\'historique des exportations' };
    },

    // ── CHAT_IA15 ──
    CHAT_IA15: () => {
      return {
        reponse: 'Bonjour ! Je suis l\'assistant SmartFish. Actuellement, mon module d\'IA avancée (Gemini) n\'est pas connecté, mais je peux vous aider avec les données opérationnelles. Consultez les différents tableaux de bord pour suivre vos KPIs, captures, stocks et ventes en temps réel. Si vous avez besoin d\'analyses approfondies, assurez-vous que la clé API Gemini est correctement configurée.',
        disponible: true
      };
    },

    // ── FLEET_OPTIMIZATION (IA8) ──
    FLEET_OPTIMIZATION: () => {
      const { bateaux = [], captures = [], maintenances = [] } = data;
      const capt30j = captures.filter(c => new Date(c.date) >= date30j);

      // Priorisation des bateaux
      const priorisationBateaux = bateaux
        .map(b => {
          const captBateau = capt30j.filter(c => c.bateauId === b.id);
          const derniereCapture = captBateau.sort((a, c) => new Date(c.date) - new Date(a.date))[0];
          const joursInactif = derniereCapture ? Math.floor((now - new Date(derniereCapture.date)) / (1000 * 60 * 60 * 24)) : 999;
          const carburantRatio = b.carburantCapacity > 0 ? (b.carburantRestant || 0) / b.carburantCapacity : 0;
          const score = (joursInactif > 30 ? 30 : joursInactif) * 2 + (carburantRatio > 0.5 ? 20 : carburantRatio > 0.2 ? 10 : 0) + (captBateau.length > 0 ? captBateau.length : 0);
          return {
            bateauId: b.id,
            nom: b.nom || `Bateau #${b.id}`,
            recommandation: joursInactif > 30
              ? `Inactif depuis ${joursInactif} jours — prioritaire pour une sortie`
              : captBateau.length < 3
                ? `Faible activité (${captBateau.length} opérations récentes) — à mobiliser`
                : `Activité régulière (${captBateau.length} opérations) — maintenir le rythme`,
            priorite: Math.min(5, Math.max(1, Math.round(score / 20)))
          };
        })
        .sort((a, b) => a.priorite - b.priorite);

      // Répartition zones
      const zonesUtilisees = {};
      capt30j.forEach(c => {
        const zone = c.zonePeche || 'Non spécifiée';
        if (!zonesUtilisees[zone]) zonesUtilisees[zone] = { poids: 0, nbCaptures: 0, especes: new Set() };
        zonesUtilisees[zone].poids += c.poids || 0;
        zonesUtilisees[zone].nbCaptures++;
        zonesUtilisees[zone].especes.add(c.espece);
      });

      const topZones = Object.entries(zonesUtilisees)
        .sort((a, b) => b[1].poids - a[1].poids)
        .slice(0, 3);

      const repartitionZones = priorisationBateaux.slice(0, topZones.length).map((b, i) => ({
        bateauId: b.bateauId,
        zonePeche: topZones[i] ? topZones[i][0] : 'Zone Est',
        especeCible: topZones[i] ? [...topZones[i][1].especes][0] || 'Mixte' : 'Mixte',
        justification: topZones[i]
          ? `${topZones[i][1].nbCaptures} opérations, ${topZones[i][1].poids.toFixed(0)} kg capturés`
          : 'Zone recommandée par défaut'
      }));

      // Conseils équipages
      const conseilsEquipages = [
        priorisationBateaux.length > 0 ? `Prioriser les sorties avec ${priorisationBateaux[0].nom} (priorité #1)` : 'Vérifier la disponibilité des équipages',
        repartitionZones.length > 0 ? `Affecter les équipages expérimentés sur ${repartitionZones[0].zonePeche}` : 'Former les équipages aux différentes zones de pêche',
        'Planifier les rotations équipage pour maximiser le temps en mer'
      ];

      // Recommandations carburant
      const bateauxBasCarburant = bateaux.filter(b => b.carburantCapacity > 0 && (b.carburantRestant || 0) < b.carburantCapacity * 0.3);
      const recommandationsCarburant = [
        bateauxBasCarburant.length > 0
          ? `Ravitaillement urgent pour ${bateauxBasCarburant.map(b => b.nom || `#${b.id}`).join(', ')}`
          : 'Niveaux de carburant satisfaisants sur l\'ensemble de la flotte',
        'Optimiser les trajets pour réduire la consommation de carburant',
        'Suivre les prix du carburant pour planifier les achats aux meilleurs moments'
      ];

      return {
        priorisationBateaux,
        repartitionZones,
        conseilsEquipages,
        recommandationsCarburant,
        disponible: true,
        raison: 'Optimisation basée sur les données réelles de la flotte'
      };
    },

    // ── STRATEGIC_RECOMMENDATIONS (IA14) ──
    STRATEGIC_RECOMMENDATIONS: () => {
      const { captures = [], stocks = [], bateaux = [], ventes = [], exportations = [] } = data;
      const capt30j = captures.filter(c => new Date(c.date) >= date30j);
      const ca30j = ventes.filter(v => new Date(v.date) >= date30j).reduce((s, v) => s + (v.total || 0), 0);

      const recommandationsStrategiques = [
        capt30j.length > 10
          ? { titre: '📈 Expansion de la flotte', description: `Activité soutenue avec ${capt30j.length} opérations en 30 jours. Étudier la faisabilité d'acquérir un bateau supplémentaire.`, impact: 'moyen', delai: 'long', coutEstime: '200 000 000 - 500 000 000 Ar' }
          : { titre: '🎣 Optimisation des opérations', description: `Seulement ${capt30j.length} opérations en 30 jours. Analyser les causes et optimiser les sorties avant d'envisager une expansion.`, impact: 'élevé', delai: 'court', coutEstime: 'À définir' },
        stocks.length > 5
          ? { titre: '📦 Diversification des espèces', description: `${stocks.length} espèces en stock. Étudier le potentiel commercial de nouvelles espèces à forte valeur ajoutée.`, impact: 'moyen', delai: 'moyen', coutEstime: '50 000 000 - 100 000 000 Ar' }
          : { titre: '📦 Renforcement de la chaîne d\'approvisionnement', description: `Seulement ${stocks.length} produit(s) en stock. Diversifier les sources d'approvisionnement.`, impact: 'élevé', delai: 'court', coutEstime: '20 000 000 - 50 000 000 Ar' },
        exportations.length > 0
          ? { titre: '🌍 Expansion géographique', description: `${exportations.length} opérations d'exportation. Explorer de nouveaux marchés en Europe et en Asie.`, impact: 'élevé', delai: 'moyen', coutEstime: '100 000 000 - 200 000 000 Ar' }
          : { titre: '🌍 Développement export', description: 'Aucune exportation récente. Étudier les opportunités sur les marchés régionaux et internationaux.', impact: 'élevé', delai: 'moyen', coutEstime: '50 000 000 - 150 000 000 Ar' },
        { titre: '💻 Transformation numérique', description: 'Investir dans des capteurs IoT, un ERP et des outils d\'analyse avancée pour améliorer la traçabilité et l\'efficacité opérationnelle.', impact: 'élevé', delai: 'moyen', coutEstime: '80 000 000 - 150 000 000 Ar' },
        { titre: '🔋 Efficacité énergétique', description: 'Réduire les coûts de carburant via des audits énergétiques et une optimisation des routes maritimes avec l\'IA.', impact: 'moyen', delai: 'court', coutEstime: '15 000 000 - 30 000 000 Ar' },
      ];

      const scenariosFuturs = [
        {
          titre: 'Croissance organique',
          description: ca30j > 500000
            ? `Avec un CA de ${ca30j.toLocaleString('fr-FR')} Ar/30j, croissance de 15-20% envisageable en 12 mois via optimisation`
            : 'Croissance modérée (5-10%) en consolidant les opérations existantes avant expansion',
          probabilite: ca30j > 500000 ? 'élevée' : 'moyenne',
          impact: ca30j > 500000 ? '+20-30% de CA annuel' : '+5-10% de CA annuel'
        },
        {
          titre: 'Diversification des marchés',
          description: exportations.length > 0 ? 'Ouvrir 2-3 nouveaux marchés d\'exportation en Asie du Sud-Est et au Moyen-Orient' : 'Développer le réseau de distribution local avant d\'exporter',
          probabilite: 'moyenne',
          impact: 'Réduction de 30% de la dépendance au marché local'
        },
        {
          titre: 'Modernisation technologique',
          description: 'Investir dans l\'IA, l\'IoT et la blockchain pour la traçabilité — avantage compétitif majeur',
          probabilite: 'moyenne',
          impact: 'Amélioration de 25% de l\'efficacité opérationnelle'
        }
      ];

      const prioritesDG = [
        capt30j.length === 0 ? '🔴 Priorité #1 : Relancer les opérations de pêche d\'urgence' : '🟢 Maintien de l\'activité de pêche — optimiser les rendements',
        stocks.filter(s => s.quantite <= s.seuil).length > 0 ? `🔴 Priorité #2 : Réapprovisionner ${stocks.filter(s => s.quantite <= s.seuil).length} produit(s) en rupture` : '🟢 Niveaux de stock satisfaisants — surveillance continue',
        bateaux.filter(b => b.etat === 'MAINTENANCE' || !b.etat).length > 0 ? `🟡 Priorité #3 : Remettre en service ${bateaux.filter(b => b.etat === 'MAINTENANCE' || !b.etat).length} bateau(x)` : '🟢 Flotte opérationnelle — planifier maintenance préventive',
        '📊 Mettre en place des revues de performance hebdomadaires',
        '🎯 Définir des objectifs trimestriels pour chaque département'
      ];

      return { recommandationsStrategiques, scenariosFuturs, prioritesDG, disponible: true, raison: 'Recommandations stratégiques basées sur les données réelles' };
    },

    // ── OPERATIONAL_ANOMALIES (IA9) ──
    OPERATIONAL_ANOMALIES: () => {
      const { captures = [], stocks = [], bateaux = [], maintenances = [] } = data;
      const anomaliesDetectees = [];
      const capt30j = captures.filter(c => new Date(c.date) >= date30j);

      // Détecter stocks sous seuil
      stocks.forEach(s => {
        if (s.quantite <= s.seuil) {
          anomaliesDetectees.push({
            description: `Stock critique : ${s.espece} — ${s.quantite} ${s.unite || 'kg'} (seuil: ${s.seuil})`,
            type: 'stock_critique',
            urgence: s.quantite <= s.seuil * 0.5 ? 'CRITIQUE' : 'HAUTE',
            details: `Réapprovisionnement urgent nécessaire. Ratio actuel: ${((s.quantite / s.seuil) * 100).toFixed(0)}% du seuil.`
          });
        }
      });

      // Détecter maintenance overdue
      maintenances.forEach((m, idx) => {
        const joursDepuis = Math.floor((now - new Date(m.date)) / (1000 * 60 * 60 * 24));
        if (joursDepuis > 90 && m.bateauId) {
          anomaliesDetectees.push({
            description: `Maintenance dépassée sur le bateau #${m.bateauId} — ${joursDepuis} jours depuis la dernière intervention`,
            type: 'maintenance_overdue',
            urgence: joursDepuis > 180 ? 'CRITIQUE' : 'MOYENNE',
            details: `Dernière maintenance: ${m.type || 'inconnue'} (${new Date(m.date).toLocaleDateString('fr-FR')})`
          });
        }
      });

      // Détecter bateaux sans activité récente
      bateaux.forEach(b => {
        const captBateau = capt30j.filter(c => c.bateauId === b.id);
        if (captBateau.length === 0) {
          anomaliesDetectees.push({
            description: `Bateau inactif : ${b.nom || `#${b.id}`} — aucune capture en 30 jours`,
            type: 'bateau_inactif',
            urgence: 'MOYENNE',
            details: `Vérifier l'état du bateau et la disponibilité de l'équipage`
          });
        }
      });

      // Détecter chute soudaine des captures
      const capt15jAvant = captures.filter(c => {
        const d = new Date(c.date);
        return d >= date30j && d < new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
      }).length;
      const capt15jApres = captures.filter(c => {
        const d = new Date(c.date);
        return d >= new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
      }).length;
      if (capt15jAvant > 0 && capt15jApres < capt15jAvant * 0.5) {
        anomaliesDetectees.push({
          description: `Chute significative des captures : ${capt15jAvant} → ${capt15jApres} opérations (15 jours)`,
          type: 'chute_captures',
          urgence: 'HAUTE',
          details: `Baisse de ${Math.round((1 - capt15jApres / capt15jAvant) * 100)}% de l'activité de pêche`
        });
      }

      return {
        anomaliesDetectees,
        disponible: true,
        raison: 'Détection basée sur l\'analyse des données opérationnelles'
      };
    },

    // ── ANOMALIE (checkAnomalies) ──
    ANOMALIE: () => {
      const { captures = [], stocks = [], bateaux = [] } = data;
      const anomalies = [];
      const capt30j = captures.filter(c => new Date(c.date) >= date30j);

      // Stocks sous seuil
      stocks.forEach(s => {
        if (s.quantite <= s.seuil) {
          anomalies.push({
            description: `Stock critique : ${s.espece} — ${s.quantite} ${s.unite || 'kg'} (seuil: ${s.seuil})`,
            type: 'STOCK',
            urgence: s.quantite <= s.seuil * 0.5 ? 'CRITIQUE' : 'HAUTE',
            details: `Réapprovisionnement urgent. Ratio: ${((s.quantite / s.seuil) * 100).toFixed(0)}% du seuil.`
          });
        }
      });

      // Bateaux sans activité
      bateaux.forEach(b => {
        if (capt30j.filter(c => c.bateauId === b.id).length === 0) {
          anomalies.push({
            description: `Bateau inactif : ${b.nom || `#${b.id}`} — aucune capture en 30 jours`,
            type: 'AUTRE',
            urgence: 'MOYENNE',
            details: `Vérifier l'état du bateau et la disponibilité de l'équipage`
          });
        }
      });

      // Chute des captures
      const capt15jAvant = captures.filter(c => {
        const d = new Date(c.date);
        return d >= date30j && d < new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
      }).length;
      const capt15jApres = captures.filter(c => {
        const d = new Date(c.date);
        return d >= new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
      }).length;
      if (capt15jAvant > 0 && capt15jApres < capt15jAvant * 0.5) {
        anomalies.push({
          description: `Chute des captures : ${capt15jAvant} → ${capt15jApres} opérations (baisse de ${Math.round((1 - capt15jApres / capt15jAvant) * 100)}%)`,
          type: 'CAPTURE',
          urgence: 'HAUTE',
          details: 'Analyse recommandée pour identifier la cause de la baisse d\'activité'
        });
      }

      // Anomalie générale si rien
      if (anomalies.length === 0) {
        anomalies.push({
          description: 'Aucune anomalie majeure détectée dans les données récentes',
          type: 'AUTRE',
          urgence: 'BASSE',
          details: 'La situation opérationnelle semble normale'
        });
      }

      return { anomalies, disponible: true, raison: 'Détection basée sur les données réelles' };
    },

    // ── ANOMALIE_DETECTION (detecterAnomalies cron) ──
    ANOMALIE_DETECTION: () => {
      // Même logique que ANOMALIE — retourne `anomalies`
      const { captures = [], stocks = [], bateaux = [] } = data;
      const anomalies = [];
      const capt30j = captures.filter(c => new Date(c.date) >= date30j);

      stocks.forEach(s => {
        if (s.quantite <= s.seuil) {
          anomalies.push({
            description: `Stock critique : ${s.espece} — ${s.quantite} ${s.unite || 'kg'} (seuil: ${s.seuil})`,
            type: 'STOCK',
            urgence: s.quantite <= s.seuil * 0.5 ? 'CRITIQUE' : 'HAUTE',
            details: `Réapprovisionnement urgent. Ratio: ${((s.quantite / s.seuil) * 100).toFixed(0)}% du seuil.`
          });
        }
      });

      bateaux.forEach(b => {
        if (capt30j.filter(c => c.bateauId === b.id).length === 0) {
          anomalies.push({
            description: `Bateau inactif : ${b.nom || `#${b.id}`} — aucune capture en 30 jours`,
            type: 'MAINTENANCE',
            urgence: 'MOYENNE',
            details: `Vérifier l'état du bateau et la disponibilité de l'équipage`
          });
        }
      });

      const capt15jAvant = captures.filter(c => {
        const d = new Date(c.date);
        return d >= date30j && d < new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
      }).length;
      const capt15jApres = captures.filter(c => {
        const d = new Date(c.date);
        return d >= new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
      }).length;
      if (capt15jAvant > 0 && capt15jApres < capt15jAvant * 0.5) {
        anomalies.push({
          description: `Chute des captures : ${capt15jAvant} → ${capt15jApres} opérations (baisse de ${Math.round((1 - capt15jApres / capt15jAvant) * 100)}%)`,
          type: 'CAPTURE',
          urgence: 'HAUTE',
          details: 'Analyse recommandée pour identifier la cause de la baisse d\'activité'
        });
      }

      if (anomalies.length === 0) {
        anomalies.push({
          description: 'Aucune anomalie majeure détectée dans les données récentes',
          type: 'AUTRE',
          urgence: 'BASSE',
          details: 'La situation opérationnelle semble normale'
        });
      }

      return { anomalies, disponible: true, raison: 'Détection basée sur les données réelles' };
    },

    // ── FRAUD_DETECTION (IA10) ──
    FRAUD_DETECTION: () => {
      const { captures = [], stocks = [], ventes = [], exportations = [] } = data;
      const fraudesDetectees = [];

      // Vérifier écarts entre captures déclarées et stocks entrants
      const capParEspece = {};
      captures.forEach(c => {
        capParEspece[c.espece] = (capParEspece[c.espece] || 0) + (c.quantite || 0);
      });

      // Vérifier les ventes sans stock correspondant
      ventes.forEach(v => {
        const stockEspece = stocks.filter(s => s.espece === v.espece).reduce((s, st) => s + (st.quantite || 0), 0);
        if (v.quantite > stockEspece * 1.5 && stockEspece > 0) {
          fraudesDetectees.push({
            description: `Vente ${v.espece} suspecte : ${v.quantite} kg vendus pour ${stockEspece} kg en stock`,
            type: 'ecart_stock',
            niveauRisque: stockEspece === 0 ? 'critique' : 'eleve',
            donneesConcernees: `Vente: ${v.quantite} kg ${v.espece} — Stock: ${stockEspece} kg`
          });
        }
      });

      // Vérifier les incohérences captures/stocks
      Object.entries(capParEspece).forEach(([espece, qteCapt]) => {
        if (stocks.length > 0) {
          const stockEspece = stocks.filter(s => s.espece === espece).reduce((s, st) => s + (st.quantite || 0), 0);
          if (qteCapt > stockEspece * 3 && stockEspece > 100) {
            fraudesDetectees.push({
              description: `Écart significatif captures/stocks pour ${espece}: ${qteCapt} kg capturés vs ${stockEspece} kg en stock`,
              type: 'declaration_incoherente',
              niveauRisque: 'moyen',
              donneesConcernees: `Captures: ${qteCapt} kg — Stock: ${stockEspece} kg`
            });
          }
        }
      });

      // Transactions export suspectes
      exportations.forEach(e => {
        const stockEspece = stocks.filter(s => s.espece === e.espece).reduce((s, st) => s + (st.quantite || 0), 0);
        if (e.quantite > stockEspece * 1.2 && stockEspece > 0) {
          fraudesDetectees.push({
            description: `Exportation ${e.espece} vers ${e.paysDestination} : ${e.quantite} kg exportés pour ${stockEspece} kg en stock`,
            type: 'transaction_suspecte',
            niveauRisque: stockEspece === 0 ? 'critique' : 'eleve',
            donneesConcernees: `Export: ${e.quantite} kg — Stock: ${stockEspece} kg — Pays: ${e.paysDestination}`
          });
        }
      });

      return {
        fraudesDetectees,
        disponible: true,
        raison: 'Détection basée sur l\'analyse croisée des données'
      };
    },

    // ── RISK_ANALYSIS (IA12) ──
    RISK_ANALYSIS: () => {
      const { captures = [], stocks = [], bateaux = [], maintenances = [], ventes = [], exportations = [], anomalies = [] } = data;
      const capt30j = captures.filter(c => new Date(c.date) >= date30j);

      const risquesFinanciers = [];
      const risquesOperationnels = [];
      const risquesLogistiques = [];

      // Risques financiers
      const ca30j = ventes.filter(v => new Date(v.date) >= date30j).reduce((s, v) => s + (v.total || 0), 0);
      if (ca30j < 100000) {
        risquesFinanciers.push({ titre: 'Faible chiffre d\'affaires', description: `CA de ${ca30j.toLocaleString('fr-FR')} Ar sur 30 jours — risque de trésorerie`, probabilite: 'élevée', impact: 'élevé', recommandation: 'Relancer les ventes et réduire les coûts opérationnels' });
      } else if (ca30j < 500000) {
        risquesFinanciers.push({ titre: 'CA modéré', description: `CA de ${ca30j.toLocaleString('fr-FR')} Ar/30j — marge de progression`, probabilite: 'moyenne', impact: 'moyen', recommandation: 'Optimiser le mix produit pour augmenter les marges' });
      }
      const stocksValeur = stocks.reduce((s, st) => s + (st.quantite || 0) * 5000, 0);
      if (stocksValeur > 0) {
        risquesFinanciers.push({ titre: 'Valeur des stocks', description: `Stock estimé à ${(stocksValeur / 1000).toFixed(0)}k Ar — risque de dépréciation`, probabilite: stocks.filter(s => s.quantite <= s.seuil).length > 0 ? 'élevée' : 'moyenne', impact: 'moyen', recommandation: 'Accélérer la rotation des stocks périssables' });
      }

      // Risques opérationnels
      const bateauxInactifs = bateaux.filter(b => {
        const captBateau = capt30j.filter(c => c.bateauId === b.id);
        return captBateau.length === 0;
      });
      if (bateauxInactifs.length > 0) {
        risquesOperationnels.push({ titre: 'Bateaux inactifs', description: `${bateauxInactifs.length} bateau(x) sans activité en 30 jours`, probabilite: bateauxInactifs.length > 2 ? 'élevée' : 'moyenne', impact: 'élevé', recommandation: `Vérifier l'état des ${bateauxInactifs.map(b => b.nom || `#${b.id}`).join(', ')} et planifier leur remise en service` });
      }
      if (stocks.filter(s => s.quantite <= s.seuil).length > 0) {
        risquesOperationnels.push({ titre: 'Rupture stock imminente', description: `${stocks.filter(s => s.quantite <= s.seuil).length} produit(s) sous seuil critique`, probabilite: 'élevée', impact: stocks.filter(s => s.quantite <= s.seuil).length > 3 ? 'critique' : 'élevé', recommandation: 'Commander d\'urgence les produits en rupture' });
      }
      const anomaliesActives = anomalies.filter(a => a.statut === 'EN_ATTENTE').length;
      if (anomaliesActives > 5) {
        risquesOperationnels.push({ titre: 'Anomalies non résolues', description: `${anomaliesActives} anomalies en attente de traitement`, probabilite: 'moyenne', impact: 'moyen', recommandation: 'Mettre en place un plan de résolution des anomalies' });
      }

      // Risques logistiques
      if (stocks.filter(s => s.quantite > s.seuil * 3).length > 0) {
        risquesLogistiques.push({ titre: 'Surstock dangereux', description: `${stocks.filter(s => s.quantite > s.seuil * 3).length} produit(s) en surstock — risque de péremption`, probabilite: 'moyenne', impact: 'moyen', recommandation: 'Lancer des promotions pour écouler les surstocks' });
      }
      if (exportations.length > 0) {
        const expParPays = {};
        exportations.forEach(e => { expParPays[e.paysDestination] = (expParPays[e.paysDestination] || 0) + 1; });
        Object.entries(expParPays).forEach(([pays, nb]) => {
          if (nb > exportations.length * 0.7) {
            risquesLogistiques.push({ titre: `Dépendance au marché ${pays}`, description: `${Math.round((nb / exportations.length) * 100)}% des exportations vers un seul pays`, probabilite: 'moyenne', impact: 'élevé', recommandation: 'Diversifier les destinations d\'exportation' });
          }
        });
      }

      const recommandationsGlobales = [
        ...risquesFinanciers.map(r => r.recommandation),
        ...risquesOperationnels.map(r => r.recommandation),
        ...risquesLogistiques.map(r => r.recommandation),
        'Mettre en place un tableau de bord des risques avec suivi hebdomadaire'
      ];

      return {
        risquesFinanciers,
        risquesOperationnels,
        risquesLogistiques,
        recommandationsGlobales,
        disponible: true,
        raison: 'Analyse des risques basée sur les données réelles'
      };
    },

    // ── STOCK_INTELLIGENCE ──
    STOCK_INTELLIGENCE: () => {
      const { rupture = [], surstock = [], rentabilite = [], stocks = [] } = data;

      const recommandationsRupture = rupture.map(r => ({
        espece: r.espece,
        quantiteRecommandee: Math.max(Math.round(r.quantiteActuelle * 1.5), Math.round(r.ventes30j * 0.5)),
        urgence: r.niveauUrgence || 'HAUTE',
        priorite: r.niveauUrgence === 'CRITIQUE' ? 1 : r.niveauUrgence === 'HAUTE' ? 2 : 3,
        raison: `Rupture imminente détectée — stock actuel: ${r.quantiteActuelle} ${r.unite || 'kg'}, ventes 30j: ${r.ventes30j}, seuil: ${r.seuil}. Recommandation: achat urgent pour couvrir ${Math.round(r.joursRestants)} jours.`
      }));

      const recommandationsSurstock = surstock.map(s => ({
        espece: s.espece,
        action: parseFloat(s.ratio) > 5 ? 'Promotion immédiate — écouler l\'excédent' : 'Arrêt temporaire des achats — surveiller la rotation',
        raison: `Surstock détecté — ${s.quantiteActuelle} ${s.unite || 'kg'} en stock (ratio: ${s.ratio}x), ventes 90j: ${s.ventes90j}. Action recommandée: ${parseFloat(s.ratio) > 5 ? 'promotion et écoulement prioritaire' : 'réduction des achats'}.`
      }));

      // Calculer les espèces les plus rentables pour recommandations d'achat massif
      const recommandationsAchatMassif = (rentabilite || []).slice(0, 3).map(r => ({
        espece: r.espece,
        quantiteSuggestionnee: Math.round(r.totalQuantite * 0.5),
        raison: `Espèce ${r.espece} très rentable — CA: ${r.totalCA.toLocaleString('fr-FR')} Ar, ${r.totalQuantite} kg vendus. Achat massif recommandé pour couvrir la demande.`
      }));

      // Si pas de rentabilité, utiliser les stocks et ventes récents
      if (recommandationsAchatMassif.length === 0) {
        stocks.filter(s => s.quantite > s.seuil * 2).slice(0, 3).forEach(s => {
          recommandationsAchatMassif.push({
            espece: s.espece,
            quantiteSuggestionnee: Math.round(s.quantite * 0.3),
            raison: `Stock confortable de ${s.espece} (${s.quantite} ${s.unite || 'kg'}) — achat modéré pour maintenir le niveau.`
          });
        });
      }

      // Analyse rentabilité enrichie
      const analyseRentabilite = (rentabilite || []).length > 0
        ? rentabilite.map(r => ({
            ...r,
            rentabilite: r.totalCA > 1000000 ? 'HAUTE' : r.totalCA > 500000 ? 'MOYENNE' : 'BASSE'
          }))
        : stocks.slice(0, 5).map(s => ({
            espece: s.espece,
            totalCA: 0,
            prixMoyenUnitaire: 0,
            totalQuantite: 0,
            rentabilite: 'MOYENNE',
            nombreVentes: 0
          }));

      return {
        recommandationsRupture,
        recommandationsSurstock,
        recommandationsAchatMassif,
        analyseRentabilite,
        disponible: true,
        raison: 'Recommandations générées à partir des données réelles de stock'
      };
    },

    // ── REPORT_GENERATION (IA13) ──
    REPORT_GENERATION: () => {
      const { type = 'journalier', captures = [], stocks = [], bateaux = [], maintenances = [], ventes = [], exportations = [], anomalies = [] } = data;
      const capt30j = captures.filter(c => new Date(c.date) >= date30j);
      const ventes30j = ventes.filter(v => new Date(v.date) >= date30j);
      const caTotal = ventes30j.reduce((s, v) => s + (v.total || 0), 0);
      const stockTotal = stocks.reduce((s, st) => s + (st.quantite || 0), 0);
      const anomaliesActives = anomalies.filter(a => a.statut === 'EN_ATTENTE').length;

      const periodeLabel = type === 'journalier' ? 'journalier' : type === 'hebdomadaire' ? 'hebdomadaire' : 'mensuel';

      const contenu = `# Rapport ${periodeLabel} — SmartFish\n\n**Généré le ${now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}**\n\n---

## 📊 Résumé Exécutif

- **Captures (30j) :** ${capt30j.length} opérations
- **Stock total :** ${stockTotal.toLocaleString('fr-FR')} kg
- **Chiffre d'affaires (30j) :** ${caTotal.toLocaleString('fr-FR')} Ar
- **Bateaux actifs :** ${bateaux.length}
- **Anomalies en attente :** ${anomaliesActives}

## 🎣 Analyse des Captures

${capt30j.length > 0
  ? `- **Volume total capturé :** ${capt30j.reduce((s, c) => s + (c.poids || 0), 0).toFixed(0)} kg
- **Nombre d'opérations :** ${capt30j.length}
- **Espèces principales :** ${[...new Set(capt30j.map(c => c.espece))].join(', ')}
- **Zones de pêche :** ${[...new Set(capt30j.map(c => c.zonePeche).filter(Boolean))].join(', ') || 'Non spécifiées'}`
  : 'Aucune capture enregistrée sur la période.'
}

## 📦 État des Stocks

- **Volume total :** ${stockTotal.toLocaleString('fr-FR')} kg
- **Produits sous seuil :** ${stocks.filter(s => s.quantite <= s.seuil).length}
- **Produits en surstock :** ${stocks.filter(s => s.quantite > s.seuil * 3).length}

## ⚓ État de la Flotte

- **Total bateaux :** ${bateaux.length}
- **Maintenances planifiées :** ${maintenances.filter(m => new Date(m.date) > now).length}

## 💰 Ventes et Exportations

- **Ventes (30j) :** ${ventes30j.length} transactions — ${caTotal.toLocaleString('fr-FR')} Ar
- **Exportations :** ${exportations.length} opérations

## ⚠️ Anomalies et Risques

- **Anomalies totales :** ${anomaliesActives}
- **Ruptures stock :** ${stocks.filter(s => s.quantite <= s.seuil).length}

## ✅ Recommandations

1. ${anomaliesActives > 0 ? `Traiter les ${anomaliesActives} anomalies en attente` : 'Maintenir le suivi des anomalies'}
2. ${stocks.filter(s => s.quantite <= s.seuil).length > 0 ? `Réapprovisionner ${stocks.filter(s => s.quantite <= s.seuil).length} produit(s) sous seuil` : 'Surveiller les niveaux de stock'}
3. ${ventes30j.length < 5 ? 'Intensifier les actions commerciales' : 'Fidéliser la clientèle existante'}
4. Planifier les maintenances préventives
5. Analyser les tendances pour ajuster la stratégie

---

*Rapport généré automatiquement par SmartFish IA*
`;

      const titre = `Rapport ${type} — ${now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`;

      return {
        titre,
        contenu,
        disponible: true,
        raison: 'Rapport généré à partir des données réelles'
      };
    }
  };

  const fallbackFn = fallbacks[type];
  if (fallbackFn) {
    try {
      const result = fallbackFn();
      // Enrichir avec les métadonnées standard
      return { ...result, _fallback: true, _timestamp: now.toISOString() };
    } catch (err) {
      logger.error(`Erreur fallback pour ${type}: ${err.message}`);
      return buildMinimalEmpty(type, err.message);
    }
  }

  return buildMinimalEmpty(type, 'Type non supporté');
}

/**
 * Dernier recours — retour minimaliste mais jamais vide
 */
function buildMinimalEmpty(type, raison) {
  const base = { disponible: false, raison, _fallback: true };
  switch (type) {
    case 'GLOBAL_ANALYSIS': return { ...base, kpiCles: {}, tendances: [], pointsForts: ['Données insuffisantes'], risques: [], opportunites: [], recommandationsImmediates: [{ titre: 'Analyse indisponible', description: raison, priorite: 'moyenne' }] };
    case 'PREDICTION': return { ...base, predictionCaptures: [{ espece: 'Analyse indisponible', probabilite: 0 }], predictionStocks: [] };
    case 'ZONE': return { ...base, zones: [{ nom: 'Données insuffisantes', espece: '—', moment: '—', justification: 'Impossible d\'analyser les zones' }] };
    case 'RECOMMANDATION': return { ...base, recommandations: [{ categorie: 'information', titre: 'Analyse indisponible', contenu: raison, priorite: 'basse' }] };
    case 'MAINTENANCE': return { ...base, predictions: [] };
    case 'VENTES': return { ...base, predictionVentes: [], recommandationsGenerales: [raison] };
    case 'EXPORT': return { ...base, predictionExportations: [], recommandationsGenerales: [raison] };
    case 'CHAT_IA15': return { ...base, reponse: `Service temporairement indisponible. ${raison}` };
    case 'FLEET_OPTIMIZATION': return { ...base, priorisationBateaux: [], repartitionZones: [], conseilsEquipages: [raison], recommandationsCarburant: [] };
    case 'STRATEGIC_RECOMMENDATIONS': return { ...base, recommandationsStrategiques: [], scenariosFuturs: [], prioritesDG: [raison] };
    case 'OPERATIONAL_ANOMALIES': return { ...base, anomaliesDetectees: [] };
    case 'FRAUD_DETECTION': return { ...base, fraudesDetectees: [] };
    case 'ANOMALIE':
    case 'ANOMALIE_DETECTION': return { ...base, anomalies: [] };
    case 'MAINTENANCE_PREDICTION': return { ...base, predictions: [] };
    case 'RISK_ANALYSIS': return { ...base, risquesFinanciers: [], risquesOperationnels: [], risquesLogistiques: [], recommandationsGlobales: [raison] };
    case 'REPORT_GENERATION': return { ...base, titre: 'Rapport non disponible', contenu: `# Rapport non disponible\n\n${raison}` };
    case 'STOCK_INTELLIGENCE': return { ...base, recommandationsRupture: [], recommandationsSurstock: [], recommandationsAchatMassif: [], analyseRentabilite: [] };
    default: return { ...base, message: raison };
  }
}

const askGemini = async (promptSystem, userData, type = 'RECOMMENDATION') => {
  try {
    const fullPrompt = `${promptSystem}\n\nDonnées utilisateur:\n${JSON.stringify(userData, null, 2)}\n\nRéponds STRICTEMENT en JSON valide, sans texte supplémentaire.`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    let text = response.text();

    text = text.replace(/```json|```/g, '').trim();

    let jsonResponse;
    try {
      jsonResponse = JSON.parse(text);
    } catch (parseError) {
      logger.error('Erreur de parsing JSON Gemini:', parseError);
      logger.error('Réponse brute:', text);
      throw new Error('Réponse Gemini invalide (JSON attendu)');
    }

    await prisma.decisionLog.create({
      data: {
        contenu: JSON.stringify(jsonResponse),
        contexte: JSON.stringify({ promptSystem, userData }),
        type
      }
    }).catch(err => logger.warn('Impossible de logger la décision:', err.message));

    return jsonResponse;
  } catch (error) {
    logger.warn(`Gemini indisponible pour ${type}: ${error.message}`);
    // Fallback intelligent — génère des recommandations à partir des données réelles
    return generateFallback(type, userData);
  }
};

module.exports = { askGemini, genAI, model };
