import api from './api'

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password })
  return data
}

export async function register(userData) {
  const { data } = await api.post('/auth/register', userData)
  return data
}

export async function getMe() {
  const { data } = await api.get('/auth/me')
  return data
}

export async function updateMe(userData) {
  const { data } = await api.patch('/auth/me', userData)
  return data
}
