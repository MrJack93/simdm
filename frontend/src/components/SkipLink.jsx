import { useState } from 'react';

/**
 * SkipLink Component
 * Accessible pattern for keyboard users to jump directly to main content
 * Visible only on Tab focus (not mouse hover)
 * WCAG 2.1 AA compliant
 */
export default function SkipLink() {
  const [isFocused, setIsFocused] = useState(false);

  const handleSkip = (e) => {
    e.preventDefault();
    const mainContent = document.getElementById('main');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
      setIsFocused(false);
    }
  };

  return (
    <a
      href="#main"
      onClick={handleSkip}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className={`
        fixed top-0 left-0 z-[9999]
        px-4 py-3 rounded-br-lg
        font-semibold text-sm
        transition-all duration-200
        ${isFocused
          ? 'visible opacity-100 translate-x-0'
          : 'invisible opacity-0 -translate-x-2'}
      `}
      style={{
        backgroundColor: 'var(--color-accent)',
        color: 'var(--color-bg-primary)',
      }}
      aria-label="Sari la conținut principal"
    >
      ↓ Sari la conținut
    </a>
  );
}
