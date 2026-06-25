import { io } from 'socket.io-client'

let socket = null

/**
 * Connect to the Socket.io server for real-time notifications
 * @param {string} token - JWT authentication token
 * @returns {import('socket.io-client').Socket}
 */
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || undefined

export function connectSocket(token) {
  if (socket?.connected) {
    return socket
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 20000,
  })

  socket.on('connect', () => {
    console.log('[Socket] Connecté au serveur de notifications temps réel')
  })

  socket.on('connected', (data) => {
    console.log('[Socket] Prêt :', data.message)
  })

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Erreur de connexion:', err.message)
  })

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Déconnecté:', reason)
  })

  socket.on('error', (err) => {
    console.error('[Socket] Erreur:', err.message)
  })

  return socket
}

/**
 * Disconnect the socket
 */
export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }
}

/**
 * Get the current socket instance
 */
export function getSocket() {
  return socket
}
