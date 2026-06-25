import api from './api'

// IA3 — Prédictions de captures (7 jours)
export const getPredictionsCaptures = () => api.get('/ia/predictions').then(r => r.data)

// IA7 — Zones de pêche recommandées
export const getZonesPeche = () => api.get('/ia/zones').then(r => r.data)

// IA4 — Prédictions de maintenance
export const getPredictionsMaintenance = () => api.get('/ia/flotte/maintenance/predict').then(r => r.data)

// IA5 — Prédictions de ventes / prix
export const getPredictionsVentes = () => api.get('/ia/ventes/predict').then(r => r.data)

// IA6 — Prédictions d'exportation
export const getPredictionsExport = () => api.get('/ia/exportations/predict').then(r => r.data)

// IA2 — Chat assistant exécutif
export const chatWithAssistant = (question, history = []) => api.post('/ia/chat', { question, history }).then(r => r.data)

// IA8 — Optimisation de la flotte
export const getOptimisationFlotte = () => api.get('/ia/flotte/optimiser').then(r => r.data)

// IA14 — Recommandations stratégiques (DG)
export const getRecommandationsStrategiques = () => api.get('/ia/recommandations-strategiques').then(r => r.data)

// IA9 — Détection d'anomalies opérationnelles
export const detectAnomaliesOperationnelles = () => api.post('/ia/anomalies-operationnelles/detecter').then(r => r.data)

// IA10 — Détection de fraude
export const detecterFraude = () => api.post('/ia/fraude/detecter').then(r => r.data)

// IA12 — Analyse des risques
export const getAnalyseRisques = () => api.get('/ia/risques/analyser').then(r => r.data)

// IA13 — Génération de rapports
export const genererRapport = (type) => api.post(`/ia/rapports/generer?type=${type}`).then(r => r.data)
