import api from './api'

/**
 * Récupère l'historique des ravitaillements d'un bateau
 */
export async function getRavitaillements(bateauId) {
  const { data } = await api.get(`/ravitaillements/${bateauId}`)
  return data
}

/**
 * Crée un ravitaillement (met à jour le carburant automatiquement)
 */
export async function createRavitaillement({ bateauId, litres, prixLitre, fournisseur, notes }) {
  const { data } = await api.post('/ravitaillements', { bateauId, litres, prixLitre, fournisseur, notes })
  return data
}

/**
 * Supprime un ravitaillement (ajuste le carburant)
 */
export async function deleteRavitaillement(id) {
  const { data } = await api.delete(`/ravitaillements/${id}`)
  return data
}
