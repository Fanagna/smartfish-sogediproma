import api from './api'

// ===== CRUD Stocks =====

export async function getStocks(bateauId) {
  const params = bateauId ? { bateauId } : {}
  const { data } = await api.get('/stocks', { params })
  return data
}

export async function getCurrentStock() {
  const { data } = await api.get('/stocks')
  return data
}

export async function getStockById(id) {
  const { data } = await api.get(`/stocks/${id}`)
  return data
}

export async function createStock(stockData) {
  const { data } = await api.post('/stocks', stockData)
  return data
}

export async function updateStock(id, stockData) {
  const { data } = await api.put(`/stocks/${id}`, stockData)
  return data
}

export async function updateSeuils(seuils) {
  const { data } = await api.patch('/stocks/seuils', { seuils })
  return data
}

export async function deleteStock(id) {
  await api.delete(`/stocks/${id}`)
}

// ===== Intelligence Stock =====

export async function getRuptureStock() {
  const { data } = await api.get('/stocks/intelligence/rupture')
  return data
}

export async function getSurstock() {
  const { data } = await api.get('/stocks/intelligence/surstock')
  return data
}

export async function getRecommendationStock() {
  const { data } = await api.post('/stocks/intelligence/recommendation')
  return data
}

export async function getRotationStock() {
  const { data } = await api.get('/stocks/intelligence/rotation')
  return data
}

export async function getCritiquesStock() {
  const { data } = await api.get('/stocks/intelligence/critiques')
  return data
}
