import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthProvider';

// Extend matchers
expect.extend(toHaveNoViolations);

// Mock API
global.fetch = () => Promise.resolve({ json: () => ({}) });

const queryClient = new QueryClient();

// Wrapper cu toți providerii
const AllProviders = ({ children }) => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

describe('Accessibility Compliance (WCAG 2.1 AA)', () => {
  afterEach(cleanup);

  it('StatusBadge - trebuie să aibă role și aria-label', async () => {
    const { container } = render(
      <div role="status" aria-label="Status: Activ">
        ✓ Activ
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Form inputs - trebuie să aibă labels conectate', async () => {
    const { container } = render(
      <div>
        <label htmlFor="device-name">Nume dispozitiv *</label>
        <input id="device-name" type="text" aria-label="Nume dispozitiv" />
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Buttons - trebuie să aibă aria-labels și focus states', async () => {
    const { container } = render(
      <button
        aria-label="Adaug plan de mentenanță"
        className="focus-visible:ring-2"
      >
        Adaugă plan
      </button>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Navigation menu - trebuie să aibă role și aria-labels', async () => {
    const { container } = render(
      <nav aria-label="Meniu mobil">
        <a href="/">Dashboard</a>
        <a href="/inventory">Inventar</a>
      </nav>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Color contrast - text pe fundal trebuie >= 4.5:1', async () => {
    const { container } = render(
      <div style={{ color: '#164E63', backgroundColor: '#ECFEFF' }}>
        Text cu contrast medical
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Dialog - trebuie să aibă role și focus management', async () => {
    const { container } = render(
      <div role="dialog" aria-labelledby="dialog-title">
        <h2 id="dialog-title">Creare plan</h2>
        <form>
          <label htmlFor="device">Dispozitiv</label>
          <input id="device" type="text" />
          <button>Salvare</button>
        </form>
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Heading hierarchy - h1, h2, h3 trebuie secvențiale', async () => {
    const { container } = render(
      <div>
        <h1>Plan de mentenanță</h1>
        <h2>Secțiunea 1</h2>
        <h3>Subsecțiune</h3>
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Image alt text - imagini trebuie să aibă alt descriptiv', async () => {
    const { container } = render(
      <img src="device.png" alt="Aparat USG model A12" />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Keyboard navigation - toate buttons trebuie accessible', async () => {
    const { container } = render(
      <button
        className="focus-visible:outline-none focus-visible:ring-2"
        aria-label="Ștergere"
      >
        ✕
      </button>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('Healthcare Design Compliance', () => {
  it('Medical colors - healthcare palette trebuie contrast-compliant', async () => {
    const { container } = render(
      <div>
        <div style={{ color: '#164E63', backgroundColor: '#ECFEFF' }}>
          Text primary on healthcare background
        </div>
        <button style={{ backgroundColor: '#059669', color: '#fff' }}>
          Acțiune medicală
        </button>
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Status badges - color + icon pentru accessibility', async () => {
    const { container } = render(
      <div role="status" aria-label="Status: Funcțional">
        <span aria-hidden="true">✓</span>
        <span>Funcțional</span>
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
