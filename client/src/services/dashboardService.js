import apiClient from './api';

const getDashboardStats = async () => {
  const response = await apiClient.get('/stats');
  return response.data;
};

const getIAInsights = async () => {
  const response = await apiClient.get('/ia/analyse-global');
  return response.data;
};

const getDashboardPredictif = async () => {
  const response = await apiClient.get('/ia/dashboard-predictif');
  return response.data;
};

const getRecentActivities = async (limit = 15) => {
  const response = await apiClient.get(`/stats/activities?limit=${limit}`);
  return response.data;
};

const getExecutifAvance = async () => {
  const response = await apiClient.get('/stats/executif-avance');
  return response.data;
};

export default {
  getDashboardStats,
  getIAInsights,
  getDashboardPredictif,
  getRecentActivities,
  getExecutifAvance
};
