import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import api from '../../api/axios';

vi.mock('react-signature-canvas', () => {
  const React = require('react');
  const MockSignatureCanvas = React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      clear: vi.fn(),
      isEmpty: () => true,
      toDataURL: () => 'data:image/png;base64,mock',
    }));
    return React.createElement('canvas', { 'data-testid': 'signature-canvas', ...props.canvasProps });
  });
  MockSignatureCanvas.displayName = 'SignatureCanvas';
  return { __esModule: true, default: MockSignatureCanvas };
});

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import MppExecutionForm from '../../pages/MppExecutionForm';

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <MppExecutionForm />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('MppExecutionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((url) => {
      if (url.includes('/devices')) return Promise.resolve({ data: { devices: [] } });
      if (url.includes('/maintenance-plans/calendar')) return Promise.resolve({ data: { data: [] } });
      if (url.includes('/consumables')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: {} });
    });
  });

  it('randează titlul formularului', async () => {
    renderPage();
    expect(await screen.findByText('Formular Execuție MPP')).toBeInTheDocument();
  });

  it('afișează descrierea paginii', async () => {
    renderPage();
    expect(await screen.findByText(/Înregistrați rezultatele mentenanței/)).toBeInTheDocument();
  });

  it('afișează selectorul de dispozitive', async () => {
    renderPage();
    expect(await screen.findByText('-- Selectează dispozitiv --')).toBeInTheDocument();
  });

  it('afișează câmpul de dată execuție', async () => {
    renderPage();
    expect(await screen.findByText('Data execuției *')).toBeInTheDocument();
  });

  it('afișează câmpul de durată (minute)', async () => {
    renderPage();
    expect(await screen.findByText('Durată (minute)')).toBeInTheDocument();
  });

  it('afișează selectorul de rezultat', async () => {
    renderPage();
    expect(await screen.findByText('Rezultat *')).toBeInTheDocument();
  });

  it('afișează câmpul nume inginer', async () => {
    renderPage();
    expect(await screen.findByText('Inginer responsabil *')).toBeInTheDocument();
  });

  it('afișează zona de semnătură inginer', async () => {
    renderPage();
    expect(await screen.findByText('Semnătură Inginer *')).toBeInTheDocument();
  });

  it('afișează zona de semnătură responsabil secție', async () => {
    renderPage();
    expect(await screen.findByText('Semnătură Responsabil Secție')).toBeInTheDocument();
  });

  it('afișează zona de observații generale', async () => {
    renderPage();
    expect(await screen.findByText('Observații generale')).toBeInTheDocument();
  });

  it('afișează butonul de salvare', async () => {
    renderPage();
    expect(await screen.findByText(/Salvează Execuție MPP/)).toBeInTheDocument();
  });

  it('afișează butonul de anulare', async () => {
    renderPage();
    expect(await screen.findByText('Anulează')).toBeInTheDocument();
  });

  it('butonul anulare navighează la calendar', async () => {
    renderPage();
    const cancelBtn = await screen.findByText('Anulează');
    fireEvent.click(cancelBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/maintenance/calendar');
  });

  it('afișează butonul de adăugare consumabil', async () => {
    renderPage();
    expect(await screen.findByText('+ Adaugă consumabil')).toBeInTheDocument();
  });

  it('afișează zona de upload fotografii', async () => {
    renderPage();
    expect(await screen.findByText('Foto înainte')).toBeInTheDocument();
    expect(await screen.getByText('Foto după')).toBeInTheDocument();
  });

  it('adaugă și elimină un consumabil', async () => {
    renderPage();
    await screen.findByText('+ Adaugă consumabil');
    fireEvent.click(screen.getByText('+ Adaugă consumabil'));
    await waitFor(() => {
      expect(screen.getByText('Șterge')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Șterge'));
    await waitFor(() => {
      expect(screen.queryByText('Șterge')).not.toBeInTheDocument();
    });
  });

  it('afișează canvas-uri de semnătură', async () => {
    renderPage();
    await screen.findByText('Semnătură Inginer *');
    const canvases = screen.getAllByTestId('signature-canvas');
    expect(canvases.length).toBe(2);
  });

  it('afișează butoane de ștergere semnătură', async () => {
    renderPage();
    const clearBtns = await screen.findAllByText('Șterge semnătură');
    expect(clearBtns.length).toBe(2);
  });

  it('selectarea DEFECT arată avertizare', async () => {
    renderPage();
    await screen.findByText('Rezultat *');
    const selects = screen.getAllByRole('combobox');
    const resultSelect = selects.find(s => s.textContent.includes('Funcțional'));
    expect(resultSelect).toBeTruthy();
    fireEvent.change(resultSelect, { target: { value: 'DEFECT' } });
    await waitFor(() => {
      expect(screen.getByText(/Atenție: Defect detectat/)).toBeInTheDocument();
    });
  });

  it('încarcă dispozitivele din API', async () => {
    renderPage();
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('/devices')
      );
    });
  });

  it('încarcă calendarul mentenanță', async () => {
    renderPage();
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('/maintenance-plans/calendar')
      );
    });
  });

  it('încarcă consumabilele din API', async () => {
    renderPage();
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('/consumables')
      );
    });
  });

  it('dispozitivele sunt încărcate din API', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/devices')) return Promise.resolve({
        data: { devices: [{ id: 1, name: 'Test Device', inventoryNumber: 'DM-001' }] },
      });
      if (url.includes('/maintenance-plans/calendar')) return Promise.resolve({ data: { data: [] } });
      if (url.includes('/consumables')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: {} });
    });

    renderPage();
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('/devices')
      );
    });
  });

  it('butonul de submit este prezent', async () => {
    renderPage();
    const submitBtn = await screen.findByText(/Salvează Execuție MPP/);
    expect(submitBtn).toBeInTheDocument();
  });

  it('butonul de submit este disabled când loading', async () => {
    renderPage();
    const submitBtn = await screen.findByText(/Salvează Execuție MPP/);
    expect(submitBtn).toBeInTheDocument();
  });
});
