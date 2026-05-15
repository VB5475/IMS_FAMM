// useApi.js — Custom hook with a global Axios interceptor
// ────────────────────────────────────────────────────────
// Every API call in the project goes through this single instance,
// so logging, auth headers, error normalization, etc. are applied
// in one place.

import { useState, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from './constants';

// ── Shared Axios instance (singleton) ─────────────────────────────
// Created once, outside the hook, so every component shares the
// same interceptors and default config.

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ── REQUEST interceptor ───────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    // 🔹 Future: attach auth tokens here
    // const token = localStorage.getItem('authToken');
    // if (token) config.headers.Authorization = `Bearer ${token}`;

    console.log(
      `%c[API ➜] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
      'color:#6366f1;font-weight:600',
      config.params || ''
    );
    return config;
  },
  (error) => {
    console.error('[API ➜] Request setup error:', error);
    return Promise.reject(error);
  }
);

// ── RESPONSE interceptor ──────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => {
    console.log(
      `%c[API ✓] ${response.status} ${response.config.url}`,
      'color:#22c55e;font-weight:600'
    );
    // Normalize: most endpoints return { Links: [...] }
    return response.data;
  },
  (error) => {
    // Let cancel errors pass through silently so axios.isCancel() still works
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const url = error.config?.url;

    // Structured error logging
    console.error(
      `%c[API ✗] ${status || 'NETWORK'} ${url}`,
      'color:#ef4444;font-weight:600',
      error.response?.data || error.message
    );

    // 🔹 Future: global error handling
    // if (status === 401) { redirect to login }
    // if (status === 403) { show permission toast }

    return Promise.reject({
      status,
      message: error.response?.data?.message || error.message,
      raw: error,
    });
  }
);

// ── Export the raw client for non-hook contexts ───────────────────
export { apiClient };

// ── Hook ──────────────────────────────────────────────────────────
/**
 * useApi — provides `get` and `post` helpers that track
 * loading / error state automatically.
 *
 * Usage:
 *   const { get, post, loading, error } = useApi();
 *   const data = await get('/GetFilters', { prmMasterID: 1 });
 */
export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const activeRequests = useRef(0);

  const get = useCallback(async (url, params = {}) => {
    const controller = new AbortController();

    activeRequests.current += 1;
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get(url, {
        params,
        signal: controller.signal,
      });
      return data;
    } catch (err) {
      if (!axios.isCancel(err)) setError(err);
      throw err;
    } finally {
      activeRequests.current -= 1;
      if (activeRequests.current === 0) setLoading(false);
    }
  }, []);

  const post = useCallback(async (url, body = {}, params = {}) => {
    const controller = new AbortController();

    activeRequests.current += 1;
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.post(url, body, {
        params,
        signal: controller.signal,
      });
      return data;
    } catch (err) {
      if (!axios.isCancel(err)) setError(err);
      throw err;
    } finally {
      activeRequests.current -= 1;
      if (activeRequests.current === 0) setLoading(false);
    }
  }, []);

  return useMemo(
    () => ({ get, post, loading, error, client: apiClient }),
    [get, post, loading, error]
  );
}
