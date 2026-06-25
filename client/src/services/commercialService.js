import api from './api';

const getCommercialStats = async () => {
  const { data } = await api.get('/stats/commercial');
  return data;
};

export default { getCommercialStats };
