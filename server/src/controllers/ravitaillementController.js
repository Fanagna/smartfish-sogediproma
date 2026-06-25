const prisma = require('../config/database');

/**
 * Crée un ravitaillement et met à jour le carburant du bateau
 */
const createRavitaillement = async (req, res, next) => {
  try {
    const { bateauId, litres, prixLitre, fournisseur, notes } = req.body;

    if (!bateauId || !litres || litres <= 0) {
      return res.status(400).json({ error: 'bateauId et litres (positif) requis' });
    }

    const bateau = await prisma.bateau.findUnique({ where: { id: parseInt(bateauId) } });
    if (!bateau) return res.status(404).json({ error: 'Bateau introuvable' });

    const prixUnitaire = prixLitre || 4800;
    const coutTotal = litres * prixUnitaire;

    // Créer le ravitaillement
    const ravitaillement = await prisma.ravitaillement.create({
      data: {
        bateauId: parseInt(bateauId),
        litres,
        prixLitre: prixUnitaire,
        coutTotal: parseFloat(coutTotal.toFixed(2)),
        fournisseur: fournisseur || null,
        notes: notes || null
      }
    });

    // Mettre à jour le carburant du bateau
    await prisma.bateau.update({
      where: { id: parseInt(bateauId) },
      data: {
        carburantRestant: bateau.carburantRestant + litres
      }
    });

    res.status(201).json({
      ravitaillement,
      nouveauCarburant: bateau.carburantRestant + litres
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupère l'historique des ravitaillements d'un bateau
 */
const getRavitaillements = async (req, res, next) => {
  try {
    const bateauId = parseInt(req.params.bateauId);
    if (!bateauId) return res.status(400).json({ error: 'bateauId requis' });

    const [ravitaillements, total] = await Promise.all([
      prisma.ravitaillement.findMany({
        where: { bateauId },
        orderBy: { date: 'desc' },
        take: 50,
        include: { bateau: { select: { nom: true, immatriculation: true } } }
      }),
      prisma.ravitaillement.count({ where: { bateauId } })
    ]);

    // Statistiques cumulées
    const stats = {
      totalRavitaillements: total,
      totalLitres: ravitaillements.reduce((s, r) => s + r.litres, 0),
      totalCout: ravitaillements.reduce((s, r) => s + r.coutTotal, 0),
      coutMoyenLitre: ravitaillements.length > 0
        ? ravitaillements.reduce((s, r) => s + r.prixLitre, 0) / ravitaillements.length
        : 0,
      dernierRavitaillement: ravitaillements[0] || null
    };

    res.json({ ravitaillements, stats });
  } catch (error) {
    next(error);
  }
};

/**
 * Supprime un ravitaillement (ajuste le carburant si nécessaire)
 */
const deleteRavitaillement = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const ravitaillement = await prisma.ravitaillement.findUnique({ where: { id } });
    if (!ravitaillement) return res.status(404).json({ error: 'Ravitaillement introuvable' });

    // Ajuster le carburant du bateau (enlever les litres qu'on avait ajoutés)
    const bateau = await prisma.bateau.findUnique({ where: { id: ravitaillement.bateauId } });
    if (bateau) {
      await prisma.bateau.update({
        where: { id: ravitaillement.bateauId },
        data: {
          carburantRestant: Math.max(0, bateau.carburantRestant - ravitaillement.litres)
        }
      });
    }

    await prisma.ravitaillement.delete({ where: { id } });
    res.json({ message: 'Ravitaillement supprimé', ajustementCarburant: -ravitaillement.litres });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRavitaillement,
  getRavitaillements,
  deleteRavitaillement
};
