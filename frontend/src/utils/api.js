/**
 * API 호출을 위한 기본 설정
 */

const API_BASE_URL = 'http://localhost:8081/api/admin';

export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {}),
    },
  };

  try {
    const response = await fetch(url, finalOptions);
    
    if (!response.ok) {
      throw new Error(`API error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

export const getApi = (endpoint) => apiCall(endpoint, { method: 'GET' });
export const postApi = (endpoint, data) => apiCall(endpoint, { method: 'POST', body: JSON.stringify(data) });
export const putApi = (endpoint, data) => apiCall(endpoint, { method: 'PUT', body: JSON.stringify(data) });
export const deleteApi = (endpoint) => apiCall(endpoint, { method: 'DELETE' });
