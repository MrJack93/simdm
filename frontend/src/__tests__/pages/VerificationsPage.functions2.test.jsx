import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../api/axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

vi.mock('../../api/verifications', () => ({
  getVerifications: vi.fn(() => Promise.resolve({ data: [], pagination: { page: 1, total: 0 } })),
  uploadVerification: vi.fn(() => Promise.resolve({})),
  getComplianceReport: vi.fn(() => Promise.resolve(null)),
  deleteVerification: vi.fn(() => Promise.resolve({})),
  downloadCertificate: vi.fn(() => Promise.resolve(new Blob(['pdf']))),
}));

vi.mock('../../api/devices', () => ({
  getDevices: vi.fn(() => Promise.resolve({ devices: [{ id: 1, name: 'Echograf' }, { id: 2, name: 'Ventilator' }] })),
}));

import VerificationsPage from '../../pages/VerificationsPage';
import { getVerifications, uploadVerification, getComplianceReport, deleteVerification, downloadCertificate } from '../../api/verifications';

const VERIFICATIONS = [
  { id: 1, device: { name: 'Echograf' }, verificationType: 'LABORATOR', performedAt: '2026-01-15', validUntil: '2027-01-15', status: 'CONFORM' },
  { id: 2, device: { name: 'Ventilator' }, verificationType: 'METROLOGIC', performedAt: '2025-06-01', validUntil: '2025-12-01', status: 'EXPIRAT' },
  { id: 3, device: { name: 'Monitor' }, verificationType: 'LABORATOR', performedAt: null, validUntil: null, status: 'NEVERIFICAT' },
];

const REPORT = { total: 10, conform: 7, expirat: 2, expiraCurand: 1, neconform: 0, devices: [
  { deviceName: 'Echograf', inventoryNumber: 'INV-001', verificationType: 'LABORATOR', status: 'CONFORM', daysLeft: 200, lastVerification: { performedAt: '2026-01-15', validUntil: '2027-01-15' } },
  { deviceName: 'Ventilator', inventoryNumber: 'INV-002', verificationType: 'METROLOGIC', status: 'EXPIRAT', daysLeft: 0, lastVerification: { performedAt: '2025-06-01', validUntil: '2025-12-01' } },
] };

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <VerificationsPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('VerificationsPage -- function coverage 2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getVerifications.mockResolvedValue({ data: VERIFICATIONS, pagination: { page: 1, total: 3 } });
    getComplianceReport.mockResolvedValue(REPORT);
  });

  it('renders heading and upload button', async () => {
    renderPage();
    expect(await screen.findByText('Încarcă Certificat')).toBeInTheDocument();
    expect(screen.getByText(/Verific/)).toBeInTheDocument();
  });

  it('displays compliance report', async () => {
    renderPage();
    expect(await screen.findByText('Raport Conformitate')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('displays verifications table', async () => {
    renderPage();
    await screen.findByText('Echograf');
    expect(screen.getByText('Ventilator')).toBeInTheDocument();
    expect(screen.getByText('Monitor')).toBeInTheDocument();
  });

  it('handleDownloadCertificate creates blob', async () => {
    renderPage();
    await screen.findByText('Echograf');
    const pdfBtns = screen.getAllByText('PDF');
    await userEvent.setup().click(pdfBtns[0]);
    await waitFor(() => {
      expect(downloadCertificate).toHaveBeenCalledWith(1);
    });
  });

  it('handleDownloadComplianceReport creates CSV', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Raport Conformitate');
    await user.click(screen.getByText(/Descarca Raport/));
    await waitFor(() => {
      expect(window.URL.createObjectURL).toHaveBeenCalled();
    });
  });

  it('showFilters toggle shows filter panel', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Echograf');
    await user.click(screen.getByText('Filtrare'));
    expect(screen.getByText('Tip Verificare')).toBeInTheDocument();
    expect(screen.getAllByText('LABORATOR').length).toBeGreaterThanOrEqual(1);
  });

  it('applyFilter type toggles filter', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Echograf');
    await user.click(screen.getByText('Filtrare'));
    fireEvent.click(screen.getByLabelText('LABORATOR'));
    await waitFor(() => {
      expect(screen.queryByText('Ventilator')).not.toBeInTheDocument();
      expect(screen.getByText('Echograf')).toBeInTheDocument();
    });
  });

  it('applyFilter status toggles filter', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Echograf');
    await user.click(screen.getByText('Filtrare'));
    fireEvent.click(screen.getByLabelText('CONFORM'));
    await waitFor(() => {
      expect(screen.queryByText('Ventilator')).not.toBeInTheDocument();
    });
  });

  it('sortByExpiry toggles sort', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Echograf');
    const validUntilHeader = screen.getByText('Valabil Până la');
    await user.click(validUntilHeader);
    await user.click(validUntilHeader);
  });

  it('handleDeleteConfirm calls deleteVerification', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Echograf');
    const deleteBtns = screen.getAllByText(/terge/);
    await user.click(deleteBtns[0]);
    await waitFor(() => {
      expect(screen.getByText(/sigur/)).toBeInTheDocument();
    });
    await user.click(screen.getByText('Confirmare'));
    await waitFor(() => {
      expect(deleteVerification).toHaveBeenCalled();
    });
  });

  it('ConfirmModal cancel closes', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Echograf');
    const deleteBtns = screen.getAllByText(/terge/);
    await user.click(deleteBtns[0]);
    await waitFor(() => { expect(screen.getByText(/sigur/)).toBeInTheDocument(); });
    await user.click(screen.getByText('Anulare'));
    await waitFor(() => {
      expect(screen.queryByText(/sigur/)).not.toBeInTheDocument();
    });
  });

  it('UploadModal opens and closes', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Încarcă Certificat');
    await user.click(screen.getByText('Încarcă Certificat'));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Încarcă Certificat/i })).toBeInTheDocument();
    });
    await user.click(screen.getByText('Anulare'));
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /Încarcă Certificat/i })).not.toBeInTheDocument();
    });
  });

  it('UploadModal validates required fields', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Încarcă Certificat');
    await user.click(screen.getByText('Încarcă Certificat'));
    await waitFor(() => { expect(screen.getByRole('heading', { name: /Încarcă Certificat/i })).toBeInTheDocument(); });
    await user.click(screen.getByText('Salvare'));
    expect(screen.getByText(/Dispozitiv.*obligatoriu/)).toBeInTheDocument();
  });

  it('UploadModal submits with valid data', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Încarcă Certificat');
    await user.click(screen.getByText('Încarcă Certificat'));
    await waitFor(() => { expect(screen.getByRole('heading', { name: /Încarcă Certificat/i })).toBeInTheDocument(); });
    fireEvent.change(screen.getByLabelText('Dispozitiv'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Tip Verificare'), { target: { value: 'METROLOGIC' } });
    fireEvent.change(screen.getByLabelText('Nr. Certificat'), { target: { value: 'CERT-001' } });
    const fileInput = screen.getByLabelText(/ier Certificat/);
    const file = new File(['test'], 'cert.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: 1024 });
    fireEvent.change(fileInput, { target: { files: [file] } });
    await user.click(screen.getByText('Salvare'));
    await waitFor(() => {
      expect(uploadVerification).toHaveBeenCalled();
    });
  });

  it('pagination buttons work', async () => {
    getVerifications.mockResolvedValue({ data: VERIFICATIONS, pagination: { page: 1, total: 100 } });
    renderPage();
    await screen.findByText('Echograf');
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    const nextBtn = screen.getByText(/urm/);
    expect(nextBtn).not.toBeDisabled();
    await userEvent.setup().click(nextBtn);
    await waitFor(() => {
      expect(screen.getByText('2 / 2')).toBeInTheDocument();
    });
  });

  it('prev page disabled on page 1', async () => {
    renderPage();
    await screen.findByText('Echograf');
    const prevBtns = screen.getAllByText(/anterioar/);
    expect(prevBtns[0]).toBeDisabled();
  });

  it('getStatusColor returns correct classes', async () => {
    renderPage();
    await screen.findByText('Echograf');
    const conformCell = screen.getByText('CONFORM');
    expect(conformCell.className).toContain('var(--color-success)');
  });

  it('empty state when no verifications', async () => {
    getVerifications.mockResolvedValue({ data: [], pagination: { page: 1, total: 0 } });
    renderPage();
    expect(await screen.findByText(/exist.*verific/)).toBeInTheDocument();
  });

  it('conform percentage is calculated', async () => {
    renderPage();
    expect(await screen.findByText('70%')).toBeInTheDocument();
  });
});
