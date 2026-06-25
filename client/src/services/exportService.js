import api from './api';

const getExportStats = async () => {
  const { data } = await api.get('/stats/export');
  return data;
};

export default { getExportStats };
