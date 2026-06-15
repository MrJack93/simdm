import { useState } from 'react';

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
        font-medium text-sm
        transition-all duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        ${isFocused
          ? 'visible opacity-100 translate-x-0'
          : 'invisible opacity-0 -translate-x-2'}
      `}
      style={{
        backgroundColor: 'var(--color-accent)',
        color: 'var(--color-bg-primary)',
        '--tw-ring-color': 'var(--color-bg-primary)',
        '--tw-ring-offset-color': 'var(--color-accent)',
      }}
      aria-label="Sari la conținut principal"
    >
      Sari la conținut
    </a>
  );
}
