// Setup global pentru testele frontend SIMDM (Vitest + React Testing Library).
// Conține: matchers jest-dom, mock global axios, cleanup, mock-uri pentru
// librării grele (react-toastify, react-select, react-datepicker) și API-uri DOM.
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock global pentru instanța axios (src/api/axios.js).
// Toate apelurile de rețea sunt interceptate; testele controlează răspunsurile.
// ---------------------------------------------------------------------------
vi.mock('./api/axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

// Același mock, dar pentru importurile relative de la o adâncime diferită
// (ex: ../api/axios din components/ și pages/).
vi.mock('../api/axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

// ---------------------------------------------------------------------------
// Mock react-toastify — evită portaluri / timere reale în teste.
// ---------------------------------------------------------------------------
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
  ToastContainer: () => null,
}));

// ---------------------------------------------------------------------------
// Mock react-datepicker — îl reducem la un input text controlat.
// ---------------------------------------------------------------------------
vi.mock('react-datepicker', () => ({
  default: ({ onChange, placeholderText, selected }) => {
    return React.createElement('input', {
      type: 'text',
      placeholder: placeholderText,
      value: selected ? new Date(selected).toISOString().slice(0, 10) : '',
      onChange: (e) => onChange && onChange(new Date(e.target.value)),
    });
  },
}));

// ---------------------------------------------------------------------------
// Mock react-select — îl reducem la un <select> nativ accesibil,
// pentru ca testele să poată selecta opțiuni fără DOM-ul complex react-select.
// ---------------------------------------------------------------------------
vi.mock('react-select', () => ({
  default: ({ options = [], value, onChange, placeholder, id }) => {
    const React = require('react');
    return React.createElement(
      'select',
      {
        'data-testid': id ? `select-${id}` : 'react-select',
        id,
        value: value?.value ?? '',
        onChange: (e) => {
          const opt = options.find((o) => String(o.value) === e.target.value);
          onChange && onChange(opt || null);
        },
      },
      [
        React.createElement('option', { key: '__placeholder', value: '' }, placeholder || '—'),
        ...options.map((o) =>
          React.createElement('option', { key: o.value, value: o.value }, o.label)
        ),
      ]
    );
  },
}));

// ---------------------------------------------------------------------------
// API-uri DOM lipsă în jsdom, folosite de export/download în pagini.
// ---------------------------------------------------------------------------
if (!window.URL.createObjectURL) {
  window.URL.createObjectURL = vi.fn(() => 'blob:mock');
}
if (!window.URL.revokeObjectURL) {
  window.URL.revokeObjectURL = vi.fn();
}
window.confirm = vi.fn(() => true);

// Curățare după fiecare test — fără stare partajată între teste.
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
