// Alias service for naming consistency with the existing flotteService
import api from './api'

export const getBateaux = async () => {
  const { data } = await api.get('/flotte')
  return data
}

export const getBateauById = async (id) => {
  const { data } = await api.get(`/flotte/${id}`)
  return data
}

export const createBateau = async (bateauData) => {
  const { data } = await api.post('/flotte', bateauData)
  return data
}

export const updateBateau = async (id, bateauData) => {
  const { data } = await api.put(`/flotte/${id}`, bateauData)
  return data
}

export const deleteBateau = async (id) => {
  await api.delete(`/flotte/${id}`)
}

export const utiliserCarburant = async (id, quantite) => {
  const { data } = await api.post(`/flotte/${id}/carburant/utiliser`, { quantite })
  return data
}

export const remplirCarburant = async (id, quantite) => {
  const { data } = await api.post(`/flotte/${id}/carburant/remplir`, { quantite })
  return data
}

// Maintenance
export const getPredictionsMaintenance = async () => {
  const { data } = await api.get('/ia/flotte/maintenance/predict')
  return data
}

export default {
  getBateaux,
  getBateauById,
  createBateau,
  updateBateau,
  deleteBateau,
  utiliserCarburant,
  remplirCarburant,
  getPredictionsMaintenance
}
