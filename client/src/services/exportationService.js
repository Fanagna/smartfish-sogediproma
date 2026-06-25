import api from './api'

export const getExportations = (params) => api.get('/exportations', { params }).then(r => r.data)
export const getExportationById = (id) => api.get(`/exportations/${id}`).then(r => r.data)
export const createExportation = (data) => api.post('/exportations', data).then(r => r.data)
export const updateExportationStatut = (id, statut) => api.patch(`/exportations/${id}/statut`, { statut }).then(r => r.data)
export const deleteExportation = (id) => api.delete(`/exportations/${id}`).then(r => r.data)
