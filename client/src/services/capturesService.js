import api from './api'

export async function getCaptures(params = {}) {
  const { data } = await api.get('/captures', { params })
  return data
}

export async function getCaptureById(id) {
  const { data } = await api.get(`/captures/${id}`)
  return data
}

export async function createCapture(captureData) {
  const { data } = await api.post('/captures', captureData)
  return data
}

export async function updateCapture(id, captureData) {
  const { data } = await api.put(`/captures/${id}`, captureData)
  return data
}

export async function deleteCapture(id) {
  await api.delete(`/captures/${id}`)
}

export async function getStatsMensuelles() {
  const { data } = await api.get('/captures/stats/mensuelles')
  return data
}

// Fusionné depuis captureService.js (ancien fichier doublon à supprimer)
export async function getCapturesStats() {
  const { data } = await api.get('/captures/stats')
  return data
}

export async function importCaptures(csvData) {
  const { data } = await api.post('/captures/import', { captures: csvData })
  return data
}

