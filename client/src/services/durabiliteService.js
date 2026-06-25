import api from './api';

const getDurabiliteStats = async () => {
  const { data } = await api.get('/stats/durabilite');
  return data;
};

export default { getDurabiliteStats };
