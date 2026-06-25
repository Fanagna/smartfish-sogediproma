import axios from 'axios'
import { API_URL } from '../utils/constants'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      toast.error('Session expirée, veuillez vous reconnecter')
    } else {
      toast.error(error.response?.data?.error || 'Erreur inattendue')
    }
    return Promise.reject(error)
  }
)

export default api
