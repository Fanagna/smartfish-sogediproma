import api from './api'

export const getAchats = async (params = {}) => {
  const { data } = await api.get('/achats', { params })
  return data
}

export const createAchat = async (achatData) => {
  const { data } = await api.post('/achats', achatData)
  return data
}

export const getAchatById = async (id) => {
  const { data } = await api.get(`/achats/${id}`)
  return data
}

export const deleteAchat = async (id) => {
  await api.delete(`/achats/${id}`)
}

export const getFournisseurs = async () => {
  const { data } = await api.get('/achats/fournisseurs')
  return data
}

export default { getAchats, createAchat, getAchatById, deleteAchat, getFournisseurs }
