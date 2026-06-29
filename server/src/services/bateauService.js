const prisma = require('../config/database');

const getAllBateaux = async () => {
  return await prisma.bateau.findMany({
    include: {
      capitaine: {
        select: { id: true, nom: true, prenom: true }
      }
    }
  });
};

const getBateauById = async (id) => {
  return await prisma.bateau.findUnique({
    where: { id: parseInt(id) },
    include: {
      capitaine: {
        select: { id: true, nom: true, prenom: true }
      },
      captures: true,
      stocks: true,
      maintenance: true
    }
  });
};

const createBateau = async (data) => {
  const { capitaine, ...rest } = data;
  return await prisma.bateau.create({
    data: {
      ...rest,
      capitaineNom: capitaine || null,
      carburantRestant: rest.carburantCapacity || 500.0
    },
    include: {
      capitaine: {
        select: { id: true, nom: true, prenom: true }
      }
    }
  });
};

const updateBateau = async (id, data) => {
  const { capitaine, ...rest } = data;
  return await prisma.bateau.update({
    where: { id: parseInt(id) },
    data: {
      ...rest,
      capitaineNom: capitaine || null
    },
    include: {
      capitaine: {
        select: { id: true, nom: true, prenom: true }
      }
    }
  });
};

const deleteBateau = async (id) => {
  return await prisma.bateau.delete({
    where: { id: parseInt(id) }
  });
};

const utiliserCarburant = async (id, quantite) => {
  const bateau = await prisma.bateau.findUnique({
    where: { id: parseInt(id) }
  });

  if (!bateau) {
    throw new Error('Bateau non trouvé');
  }

  const nouveauRestant = bateau.carburantRestant - quantite;
  if (nouveauRestant < 0) {
    throw new Error('Carburant insuffisant');
  }

  return await prisma.bateau.update({
    where: { id: parseInt(id) },
    data: { carburantRestant: nouveauRestant }
  });
};

const remplirCarburant = async (id, quantite) => {
  const bateau = await prisma.bateau.findUnique({
    where: { id: parseInt(id) }
  });

  if (!bateau) {
    throw new Error('Bateau non trouvé');
  }

  const nouveauRestant = Math.min(bateau.carburantRestant + quantite, bateau.carburantCapacity);

  return await prisma.bateau.update({
    where: { id: parseInt(id) },
    data: { carburantRestant: nouveauRestant }
  });
};

module.exports = {
  getAllBateaux,
  getBateauById,
  createBateau,
  updateBateau,
  deleteBateau,
  utiliserCarburant,
  remplirCarburant
};
