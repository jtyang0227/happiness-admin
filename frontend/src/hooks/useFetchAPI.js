import { useState, useEffect } from 'react';

/**
 * API 호출을 처리하는 커스텀 훅
 * @param {string} url - 호출할 API URL
 * @param {object} options - fetch 옵션
 * @returns {object} { data, loading, error }
 */
export const useFetchAPI = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        setData(result);
        setError(null);
      } catch (error) {
        console.error('Fetch error:', error);
        setError(error.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
};
