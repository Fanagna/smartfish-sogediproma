import api from './api'

export const getVentes = async (params = {}) => {
  const { data } = await api.get('/ventes', { params })
  return data
}

export const createVente = async (venteData) => {
  const { data } = await api.post('/ventes', venteData)
  return data
}

export const getVenteById = async (id) => {
  const { data } = await api.get(`/ventes/${id}`)
  return data
}

export const deleteVente = async (id) => {
  await api.delete(`/ventes/${id}`)
}

export default { getVentes, createVente, getVenteById, deleteVente }
