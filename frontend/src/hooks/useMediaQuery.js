import { useState, useEffect } from 'react';

/**
 * Hook pentru responsive queries (media queries in JavaScript)
 * @param {string} query - Media query string (e.g., "(min-width: 768px)")
 * @returns {boolean} - True if media query matches
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Listen for changes
    const handler = (e) => setMatches(e.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
