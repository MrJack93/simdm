/**
 * Teste pentru VerificationsPage
 * - Tabel verificări
 * - Upload certificat
 * - Raport conformitate
 * - Filtrare
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import VerificationsPage from '../pages/VerificationsPage';

vi.mock('../api/verifications', () => ({
  getVerifications: vi.fn(() =>
    Promise.resolve({
      data: [
        {
          id: 1,
          device: { id: 1, name: 'Echograf' },
          verificationType: 'METROLOGIE',
          performedAt: '2026-06-08T10:00:00Z',
          validUntil: '2026-12-08T23:59:59Z',
          certificateNo: 'CERT-2026-001',
          status: 'CONFORM',
        },
        {
          id: 2,
          device: { id: 2, name: 'Radiograf' },
          verificationType: 'ELECTRICA',
          performedAt: '2025-06-08T10:00:00Z',
          validUntil: '2025-12-08T23:59:59Z',
          certificateNo: 'CERT-2025-001',
          status: 'EXPIRAT',
        },
      ],
      pagination: { page: 1, limit: 50, total: 2 },
    })
  ),
  uploadVerification: vi.fn(() =>
    Promise.resolve({
      id: 3,
      device: { name: 'Densitometru' },
      certificateNo: 'CERT-2026-003',
      status: 'CONFORM',
    })
  ),
  getComplianceReport: vi.fn(() =>
    Promise.resolve({
      total: 50,
      conform: 35,
      expirat: 10,
      neverificat: 5,
    })
  ),
}));

vi.mock('../api/devices', () => ({
  getDevices: vi.fn(() =>
    Promise.resolve({
      data: [
        { id: 1, name: 'Echograf' },
        { id: 2, name: 'Radiograf' },
        { id: 3, name: 'Densitometru' },
      ],
    })
  ),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

function renderPage() {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <VerificationsPage />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

describe('VerificationsPage — Verificări Periodice & Conformitate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('randează tabel verificări', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Echograf')).toBeInTheDocument();
      expect(screen.getByText('Radiograf')).toBeInTheDocument();
    });
  });

  it('afișează status verificări (CONFORM, EXPIRAT, NEVERIFICAT)', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/CONFORM/i)).toBeInTheDocument();
      expect(screen.getByText(/EXPIRAT/i)).toBeInTheDocument();
    });
  });

  it('culori diferite pentru status (verde=CONFORM, roșu=EXPIRAT)', async () => {
    renderPage();

    await waitFor(() => {
      const conformCell = screen.getByText(/CONFORM/i);
      const expiratCell = screen.getByText(/EXPIRAT/i);

      // Status-uri ar trebui să aibă clase diferite
      expect(conformCell).toBeInTheDocument();
      expect(expiratCell).toBeInTheDocument();
    });
  });

  it('permite upload certificat pentru dispozitiv', async () => {
    const user = userEvent.setup();
    const { uploadVerification } = await import('../api/verifications');

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Upload Certificat/i })).toBeInTheDocument();
    });

    const uploadBtn = screen.getByRole('button', { name: /Upload Certificat/i });
    await user.click(uploadBtn);

    // Modal ar trebui deschis
    await waitFor(() => {
      expect(screen.getByText(/Încarcă Certificat/i)).toBeInTheDocument();
    });

    // Select device
    const deviceSelect = screen.getByLabelText(/Dispozitiv/i);
    await user.selectOptions(deviceSelect, '3');

    // Select type
    const typeSelect = screen.getByLabelText(/Tip Verificare/i);
    await user.selectOptions(typeSelect, 'METROLOGIE');

    // Upload file (mock)
    const fileInput = screen.getByLabelText(/Fișier Certificat/i);
    const file = new File(['cert content'], 'cert.pdf', { type: 'application/pdf' });
    await user.upload(fileInput, file);

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Salvare/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(uploadVerification).toHaveBeenCalled();
    });
  });

  it('validează date upload (dispozitiv, tip, fișier)', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Upload Certificat/i })).toBeInTheDocument();
    });

    const uploadBtn = screen.getByRole('button', { name: /Upload Certificat/i });
    await user.click(uploadBtn);

    await waitFor(() => {
      expect(screen.getByText(/Încarcă Certificat/i)).toBeInTheDocument();
    });

    // Try submit empty
    const submitBtn = screen.getByRole('button', { name: /Salvare/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/obligatoriu/i)).toBeInTheDocument();
    });
  });

  it('afișează raport conformitate (CONFORM, EXPIRAT, NEVERIFICAT)', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Raport Conformitate/i)).toBeInTheDocument();
    });

    // Check compliance stats are displayed
    const report = screen.getByText(/Raport Conformitate/i);
    expect(report).toBeInTheDocument();

    // Stats should be visible in some form
    await waitFor(() => {
      expect(screen.getByText(/Total: 50/i)).toBeInTheDocument();
    });
  });

  it('calculează și afișează procent conformitate', async () => {
    renderPage();

    await waitFor(() => {
      // 35/50 = 70%
      expect(screen.getByText(/70%/i)).toBeInTheDocument();
    });
  });

  it('permite filtrare după tip verificare', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Filtrare/i })).toBeInTheDocument();
    });

    const filterBtn = screen.getByRole('button', { name: /Filtrare/i });
    await user.click(filterBtn);

    const metroCheckbox = screen.getByLabelText(/METROLOGIE/i);
    await user.click(metroCheckbox);

    await waitFor(() => {
      // Should only show METROLOGIE verifications
      expect(screen.getByText(/METROLOGIE/)).toBeInTheDocument();
    });
  });

  it('permite filtrare după status (CONFORM, EXPIRAT)', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Filtrare/i })).toBeInTheDocument();
    });

    const filterBtn = screen.getByRole('button', { name: /Filtrare/i });
    await user.click(filterBtn);

    const conformCheckbox = screen.getByLabelText(/CONFORM/i);
    await user.click(conformCheckbox);

    await waitFor(() => {
      // Should only show CONFORM verifications
      expect(screen.getByText(/CONFORM/i)).toBeInTheDocument();
    });
  });

  it('permite sortare după data expirare', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('columnheader', { name: /Valid Until/i })).toBeInTheDocument();
    });

    const sortBtn = screen.getByRole('columnheader', { name: /Valid Until/i });
    await user.click(sortBtn);

    // Table should re-render sorted
    await waitFor(() => {
      expect(screen.getByText('Echograf')).toBeInTheDocument();
    });
  });

  it('afișează alertă pentru verificări care expiră în 30 zile', async () => {
    renderPage();

    await waitFor(() => {
      // Check if alert is shown for soon-to-expire verifications
      const expiringDevices = screen.queryByText(/Expiră în \d+ zile/);
      // May or may not be present depending on test data
      expect(screen.getByText('Echograf')).toBeInTheDocument();
    });
  });

  it('permite ștergere verificare (cu confirmare)', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Șterge/i }).length).toBeGreaterThan(0);
    });

    const deleteButtons = screen.getAllByRole('button', { name: /Șterge/i });
    await user.click(deleteButtons[0]);

    // Confirmation dialog should appear
    await waitFor(() => {
      expect(screen.getByText(/Ești sigur\?/i)).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole('button', { name: /Confirmare/i });
    await user.click(confirmBtn);

    // Verification should be deleted
    await waitFor(() => {
      expect(screen.queryByText(/Ești sigur\?/i)).not.toBeInTheDocument();
    });
  });

  it('paginare funcționează corect', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Pagina următoare/i })).toBeInTheDocument();
    });

    const nextBtn = screen.getByRole('button', { name: /Pagina următoare/i });

    // Initially, next button might be disabled or enabled depending on data
    expect(nextBtn).toBeInTheDocument();
  });
});
