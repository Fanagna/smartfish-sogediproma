import api from './api'

export async function getOrdresMission(params = {}) {
  const { data } = await api.get('/ordres-mission', { params })
  return data
}

export async function getOrdreMissionById(id) {
  const { data } = await api.get(`/ordres-mission/${id}`)
  return data
}

export async function createOrdreMission(ordreData) {
  const { data } = await api.post('/ordres-mission', ordreData)
  return data
}

export async function updateOrdreMission(id, ordreData) {
  const { data } = await api.put(`/ordres-mission/${id}`, ordreData)
  return data
}

export async function deleteOrdreMission(id) {
  await api.delete(`/ordres-mission/${id}`)
}
