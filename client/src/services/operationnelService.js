import api from './api';

const getOperationnelStats = async () => {
  const { data } = await api.get('/stats/operationnel');
  return data;
};

export default { getOperationnelStats };
