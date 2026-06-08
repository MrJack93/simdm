/**
 * In-memory token store (heap-only, not persisted to Web Storage).
 * Eliminates XSS attack surface from sessionStorage while maintaining
 * httpOnly cookie-based refresh flow.
 */

let accessToken = null;

export const getToken = () => accessToken;

export const setToken = (token) => {
  accessToken = token;
};

export const clearToken = () => {
  accessToken = null;
};
