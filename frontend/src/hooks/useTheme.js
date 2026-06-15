import { useState, useEffect } from 'react';

export function useTheme() {
  const getInitialTheme = () => {
    const saved = localStorage.getItem('simdm_theme');
    if (saved) return saved === 'light' ? 'light' : 'dark';
    if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
    return 'dark';
  };

  const [theme, setTheme] = useState(() => getInitialTheme());

  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'light') {
      html.removeAttribute('data-theme');
    } else {
      html.setAttribute('data-theme', 'dark');
    }
    localStorage.setItem('simdm_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  return { theme, toggleTheme };
}
