import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  // Send and accept HttpOnly session cookies set by the backend.
  withCredentials: true,
});

// On 401, try the backend refresh endpoint exactly once. If that succeeds the
// new session cookies are already set on the response; replay the original
// request. If refresh fails too, surface the 401 — AuthContext will handle the
// logout side effects.
let refreshPromise = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config || {};
    const status = error.response?.status;

    if (status !== 401 || original.__isRetry) {
      return Promise.reject(error);
    }

    // Don't try to refresh on the auth endpoints themselves
    const url = original.url || '';
    if (url.includes('/auth/login') || url.includes('/auth/register')
        || url.includes('/auth/refresh') || url.includes('/auth/logout')) {
      return Promise.reject(error);
    }

    try {
      if (!refreshPromise) {
        refreshPromise = api.post('/auth/refresh').finally(() => {
          refreshPromise = null;
        });
      }
      await refreshPromise;
    } catch {
      return Promise.reject(error);
    }

    original.__isRetry = true;
    return api.request(original);
  }
);

export default api;
