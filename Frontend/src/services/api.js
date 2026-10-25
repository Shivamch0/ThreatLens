import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', withCredentials: true, headers: { 'Content-Type': 'application/json' } });
let accessToken = null;
let refreshPromise = null;

export function setAccessToken(token) { accessToken = token; }
api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});
api.interceptors.response.use((response) => response, async (error) => {
  const request = error.config;
  if (error.response?.status !== 401 || !request || request._retried || request.url?.includes('/auth/')) throw error;
  request._retried = true;
  try {
    refreshPromise ||= api.post('/auth/refresh').then(({ data }) => {
      accessToken = data.data.accessToken;
      return accessToken;
    }).finally(() => { refreshPromise = null; });
    request.headers.Authorization = `Bearer ${await refreshPromise}`;
    return api(request);
  } catch (refreshError) {
    accessToken = null;
    window.dispatchEvent(new Event('threatlens:session-expired'));
    throw refreshError;
  }
});

export default api;
