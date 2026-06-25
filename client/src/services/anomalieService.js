import api from './api'

export async function getAnomalies(params = {}) {
  const { data } = await api.get('/anomalies', { params })
  return data
}

export async function updateAnomalieStatus(id, statut) {
  const { data } = await api.patch(`/anomalies/${id}`, { statut })
  return data
}
