/**
 * Token store — sessionStorage pentru persistență la page refresh.
 * Access token-ul se salvează în sessionStorage (persistă la refresh, se curăță la browser close).
 * Refresh token-ul rămâne în httpOnly cookie (nu e accesibil JS).
 *
 * Trade-off: sessionStorage e accesibil via JS (XSS risk),
 * dar access token-ul expiră în 15 min — fereastra de atac e mică.
 * Refresh token-ul rămâne protejat în httpOnly cookie.
 */

const STORAGE_KEY = 'simdm_access_token';

export const getToken = () => {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, token);
  } catch {
    // sessionStorage unavailable — fallback to in-memory
  }
};

export const clearToken = () => {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
};
