const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081/api';

const getToken = () => localStorage.getItem('admin_token');

const apiCall = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/login';
    throw new Error('인증이 만료되었습니다.');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `요청 실패 (${response.status})`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

export const getApi = (endpoint) => apiCall(endpoint, { method: 'GET' });
export const postApi = (endpoint, data) =>
  apiCall(endpoint, { method: 'POST', body: JSON.stringify(data) });
export const putApi = (endpoint, data) =>
  apiCall(endpoint, { method: 'PUT', body: JSON.stringify(data) });
export const patchApi = (endpoint, data) =>
  apiCall(endpoint, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteApi = (endpoint) => apiCall(endpoint, { method: 'DELETE' });
