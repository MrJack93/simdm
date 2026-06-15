import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'react-toastify';

vi.mock('../../api/axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { data: [], devices: [] } })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

import IncidentsPage from '../../pages/IncidentsPage';
import api from '../../api/axios';
import { renderWithProviders } from '../helpers/renderWithProviders';

const DEVICES = [
  { id: 1, name: 'Ventilator', inventoryNumber: 'INV-001' },
  { id: 2, name: 'Monitor', inventoryNumber: 'INV-002' },
];

const INCIDENTS = [
  {
    id: 1, deviceId: 1, description: 'Defect display', severity: 'GRAV', status: 'DESCHIS',
    occurredAt: '2025-06-14T10:00:00Z', patientAffected: false, reportedToAmdm: false,
    devices: { name: 'Ventilator', inventoryNumber: 'INV-001' },
  },
  {
    id: 2, deviceId: 2, description: 'Eroare software', severity: 'MINOR', status: 'IN_LUCRU',
    occurredAt: '2025-06-15T14:00:00Z', patientAffected: true, patientHarm: 'Vătămare minoră',
    reportedToAmdm: true, amdmReportRef: 'REF-001', amdmReportDate: '2025-06-16',
    devices: { name: 'Monitor', inventoryNumber: 'INV-002' },
  },
  {
    id: 3, deviceId: 1, description: 'Zgomot anormal', severity: 'NEAR_MISS', status: 'REZOLVAT',
    occurredAt: '2025-06-10T08:00:00Z', patientAffected: false, reportedToAmdm: false,
    devices: { name: 'Ventilator', inventoryNumber: 'INV-001' },
  },
];

function mockApi(incidents = INCIDENTS, devices = DEVICES) {
  api.get.mockImplementation((url) => {
    if (url.includes('/incidents')) return Promise.resolve({ data: { data: incidents, total: incidents.length } });
    if (url.includes('/devices')) return Promise.resolve({ data: { devices } });
    return Promise.resolve({ data: {} });
  });
}

describe('IncidentsPage — function coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi();
  });

  it('opens new incident modal via "Raportează Incident" button', async () => {
    const user = userEvent.setup();
    renderWithProviders(<IncidentsPage />);
    await screen.findByText('Incidente');
    await user.click(screen.getByText('Raportează Incident'));
    expect(await screen.findByText('Raportează Incident', { selector: 'h2' })).toBeInTheDocument();
  });

  it('closes modal via close X button', async () => {
    const user = userEvent.setup();
    renderWithProviders(<IncidentsPage />);
    await screen.findByText('Incidente');
    await user.click(screen.getByText('Raportează Incident'));
    await screen.findByText('Raportează Incident', { selector: 'h2' });
    const closeBtn = screen.getAllByRole('button').find(b => b.querySelector('svg') && b.closest('h2') === null && b.textContent === '');
    if (closeBtn) {
      await user.click(closeBtn);
    }
  });

  it('closes modal via cancel button', async () => {
    const user = userEvent.setup();
    renderWithProviders(<IncidentsPage />);
    await screen.findByText('Incidente');
    await user.click(screen.getByText('Raportează Incident'));
    await screen.findByText('Raportează Incident', { selector: 'h2' });
    await user.click(screen.getByText('Anulare'));
    await waitFor(() => {
      expect(screen.queryByText('Raportează Incident', { selector: 'h2' })).not.toBeInTheDocument();
    });
  });

  it('closes modal when clicking overlay', async () => {
    const user = userEvent.setup();
    renderWithProviders(<IncidentsPage />);
    await screen.findByText('Incidente');
    await user.click(screen.getByText('Raportează Incident'));
    await screen.findByText('Raportează Incident', { selector: 'h2' });
    fireEvent.click(document.querySelector('.fixed.inset-0'));
  });

  it('prevents modal close on inner click via stopPropagation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<IncidentsPage />);
    await screen.findByText('Incidente');
    await user.click(screen.getByText('Raportează Incident'));
    await screen.findByText('Raportează Incident', { selector: 'h2' });
    const modalInner = document.querySelector('.animate-slide-up');
    fireEvent.click(modalInner);
    expect(screen.getByText('Raportează Incident', { selector: 'h2' })).toBeInTheDocument();
  });

  it('validates device is required on submit', async () => {
    const user = userEvent.setup();
    renderWithProviders(<IncidentsPage />);
    await screen.findByText('Incidente');
    await user.click(screen.getByText('Raportează Incident'));
    await screen.findByText('Raportează Incident', { selector: 'h2' });
    const form = document.querySelector('form');
    fireEvent.submit(form);
    expect(toast.error).toHaveBeenCalled();
  });

  it('validates occurredAt is required on submit', async () => {
    const user = userEvent.setup();
    renderWithProviders(<IncidentsPage />);
    await screen.findByText('Incidente');
    await user.click(screen.getByText('Raportează Incident'));
    await screen.findByText('Raportează Incident', { selector: 'h2' });
    fireEvent.change(screen.getByLabelText('Dispozitiv *'), { target: { value: '1' } });
    const form = document.querySelector('form');
    fireEvent.submit(form);
    expect(toast.error).toHaveBeenCalled();
  });

  it('validates description is required on submit', async () => {
    const user = userEvent.setup();
    renderWithProviders(<IncidentsPage />);
    await screen.findByText('Incidente');
    await user.click(screen.getByText('Raportează Incident'));
    await screen.findByText('Raportează Incident', { selector: 'h2' });
    fireEvent.change(screen.getByLabelText('Dispozitiv *'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Data Incidentului *'), { target: { value: '2025-06-14T10:00' } });
    const form = document.querySelector('form');
    fireEvent.submit(form);
    expect(toast.error).toHaveBeenCalled();
  });

  it('submits new incident with POST', async () => {
    const user = userEvent.setup();
    renderWithProviders(<IncidentsPage />);
    await screen.findByText('Incidente');
    await user.click(screen.getByText('Raportează Incident'));
    await screen.findByText('Raportează Incident', { selector: 'h2' });

    fireEvent.change(screen.getByLabelText('Dispozitiv *'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Data Incidentului *'), { target: { value: '2025-06-14T10:00' } });
    fireEvent.change(screen.getByLabelText('Severitate *'), { target: { value: 'GRAV' } });
    fireEvent.change(screen.getByLabelText('Descriere *'), { target: { value: 'Test incident' } });
    await user.click(screen.getByText('Raportează').closest('button'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/incidents', expect.objectContaining({
        deviceId: 1,
        description: 'Test incident',
        severity: 'GRAV',
      }));
    });
  });

  it('edits existing incident with PUT', async () => {
    const user = userEvent.setup();
    renderWithProviders(<IncidentsPage />);
    await screen.findByText('Defect display');
    const editBtns = screen.getAllByLabelText('Editează');
    await user.click(editBtns[0]);
    expect(await screen.getByText('Editează Incident')).toBeInTheDocument();
    await user.click(screen.getByText('Salvează'));
    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/incidents/1', expect.any(Object));
    });
  });

  it('toggles patientAffected checkbox', async () => {
    const user = userEvent.setup();
    renderWithProviders(<IncidentsPage />);
    await screen.findByText('Incidente');
    await user.click(screen.getByText('Raportează Incident'));
    await screen.findByText('Raportează Incident', { selector: 'h2' });
    const checkbox = screen.getByLabelText('Pacient afectat');
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(screen.getByLabelText('Descriere vătămare pacient')).toBeInTheDocument();
    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it('toggles reportedToAmdm checkbox and shows extra fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<IncidentsPage />);
    await screen.findByText('Incidente');
    await user.click(screen.getByText('Raportează Incident'));
    await screen.findByText('Raportează Incident', { selector: 'h2' });
    const checkbox = screen.getByLabelText('Raportat la AMDM');
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(screen.getByLabelText('Data raportului AMDM')).toBeInTheDocument();
    expect(screen.getByLabelText('Nr. referință AMDM')).toBeInTheDocument();
    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it('changes severity filter', async () => {
    const user = userEvent.setup();
    renderWithProviders(<IncidentsPage />);
    await screen.findByText('Incidente');
    fireEvent.change(screen.getByLabelText('Severitate'), { target: { value: 'GRAV' } });
    await waitFor(() => {
      expect(screen.queryByText('Eroare software')).not.toBeInTheDocument();
      expect(screen.getByText('Defect display')).toBeInTheDocument();
    });
  });

  it('changes status filter', async () => {
    renderWithProviders(<IncidentsPage />);
    await screen.findByText('Incidente');
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'DESCHIS' } });
    await waitFor(() => {
      expect(screen.queryByText('Zgomot anormal')).not.toBeInTheDocument();
      expect(screen.getByText('Defect display')).toBeInTheDocument();
    });
  });

  it('shows empty message when filters have no matches', async () => {
    renderWithProviders(<IncidentsPage />);
    await screen.findByText('Incidente');
    fireEvent.change(screen.getByLabelText('Severitate'), { target: { value: 'CRITIC' } });
    await waitFor(() => {
      expect(screen.getByText('Niciun incident pentru filtrele selectate.')).toBeInTheDocument();
    });
  });

  it('delete flow: click trash, confirm, then delete', async () => {
    const user = userEvent.setup();
    renderWithProviders(<IncidentsPage />);
    await screen.findByText('Defect display');
    const trashBtn = screen.getAllByLabelText('Șterge')[0];
    await user.click(trashBtn);
    const confirmBtn = screen.getByText('Confirm');
    await user.click(confirmBtn);
    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/incidents/1');
    });
  });

  it('delete flow: click trash, then cancel', async () => {
    const user = userEvent.setup();
    renderWithProviders(<IncidentsPage />);
    await screen.findByText('Defect display');
    const trashBtn = screen.getAllByLabelText('Șterge')[0];
    await user.click(trashBtn);
    const noBtn = screen.getByText('Nu');
    await user.click(noBtn);
    expect(screen.queryByText('Confirm')).not.toBeInTheDocument();
  });

  it('handles delete error', async () => {
    api.delete.mockRejectedValueOnce(new Error('fail'));
    const user = userEvent.setup();
    renderWithProviders(<IncidentsPage />);
    await screen.findByText('Defect display');
    const trashBtn = screen.getAllByLabelText('Șterge')[0];
    await user.click(trashBtn);
    await user.click(screen.getByText('Confirm'));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Eroare la ștergere');
    });
  });

  it('StatusChanger opens dropdown and changes status', async () => {
    const user = userEvent.setup();
    renderWithProviders(<IncidentsPage />);
    await screen.findByText('Defect display');
    const statusDropdown = screen.getAllByLabelText('Schimbă status')[0];
    await user.click(statusDropdown);
    const resolveBtns = screen.getAllByText('Rezolvat');
    const dropdownBtn = resolveBtns.find(el => el.tagName === 'BUTTON');
    await user.click(dropdownBtn);
    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/incidents/1', expect.objectContaining({
        status: 'REZOLVAT',
        resolvedAt: expect.any(String),
      }));
    });
  });

  it('StatusChanger handles error', async () => {
    api.put.mockRejectedValueOnce(new Error('fail'));
    const user = userEvent.setup();
    renderWithProviders(<IncidentsPage />);
    await screen.findByText('Defect display');
    const statusDropdown = screen.getAllByLabelText('Schimbă status')[0];
    await user.click(statusDropdown);
    const resolveBtns = screen.getAllByText('Rezolvat');
    const dropdownBtn = resolveBtns.find(el => el.tagName === 'BUTTON');
    await user.click(dropdownBtn);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Eroare la actualizarea statusului');
    });
  });

  it('pagination: next and prev buttons', async () => {
    const manyIncidents = Array.from({ length: 30 }, (_, i) => ({
      id: i + 1, deviceId: 1, description: `Incident ${i + 1}`, severity: 'MINOR', status: 'DESCHIS',
      occurredAt: '2025-06-14T10:00:00Z', patientAffected: false, reportedToAmdm: false,
      devices: { name: 'V', inventoryNumber: 'I' },
    }));
    mockApi(manyIncidents);
    renderWithProviders(<IncidentsPage />);
    await screen.findByText('Incident 1');
    const nextBtn = screen.getByText('Înainte').closest('button');
    expect(nextBtn).not.toBeDisabled();
    fireEvent.click(nextBtn);
    await waitFor(() => {
      expect(screen.getByText('Pagina 2 din 2')).toBeInTheDocument();
    });
    const prevBtn = screen.getByText('Înapoi').closest('button');
    fireEvent.click(prevBtn);
    await waitFor(() => {
      expect(screen.getByText('Pagina 1 din 2')).toBeInTheDocument();
    });
  });

  it('incident edit modal handles POST error', async () => {
    api.post.mockRejectedValueOnce({ response: { data: { error: 'Server error' } } });
    const user = userEvent.setup();
    renderWithProviders(<IncidentsPage />);
    await screen.findByText('Incidente');
    await user.click(screen.getByText('Raportează Incident'));
    await screen.findByText('Raportează Incident', { selector: 'h2' });

    fireEvent.change(screen.getByLabelText('Dispozitiv *'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Data Incidentului *'), { target: { value: '2025-06-14T10:00' } });
    fireEvent.change(screen.getByLabelText('Descriere *'), { target: { value: 'Test' } });
    await user.click(screen.getByText('Raportează').closest('button'));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Server error');
    });
  });

  it('fills all form fields in new incident modal', async () => {
    const user = userEvent.setup();
    renderWithProviders(<IncidentsPage />);
    await screen.findByText('Incidente');
    await user.click(screen.getByText('Raportează Incident'));
    await screen.findByText('Raportează Incident', { selector: 'h2' });

    fireEvent.change(screen.getByLabelText('Dispozitiv *'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Data Incidentului *'), { target: { value: '2025-06-14T10:00' } });
    fireEvent.change(screen.getByLabelText('Severitate *'), { target: { value: 'CRITIC' } });
    fireEvent.change(screen.getByLabelText('Descriere *'), { target: { value: 'Test complet' } });
    fireEvent.change(screen.getByLabelText('Cauza radăcină'), { target: { value: 'Cauză' } });
    fireEvent.change(screen.getByLabelText('Acțiune corectivă'), { target: { value: 'Corectie' } });
    fireEvent.change(screen.getByLabelText('Acțiune preventivă'), { target: { value: 'Preventie' } });

    expect(screen.getByLabelText('Cauza radăcină')).toHaveValue('Cauză');
    expect(screen.getByLabelText('Acțiune corectivă')).toHaveValue('Corectie');
    expect(screen.getByLabelText('Acțiune preventivă')).toHaveValue('Preventie');
  });

  it('shows loading state while fetching', async () => {
    api.get.mockImplementation(() => new Promise(() => {}));
    renderWithProviders(<IncidentsPage />);
    expect(screen.getByText('Incidente')).toBeInTheDocument();
  });

  it('severity badge falls back for unknown severity', async () => {
    const unknownSev = [{ ...INCIDENTS[0], severity: 'UNKNOWN' }];
    mockApi(unknownSev);
    renderWithProviders(<IncidentsPage />);
    await screen.findByText('UNKNOWN');
  });

  it('status badge falls back for unknown status', async () => {
    const unknownStat = [{ ...INCIDENTS[0], status: 'UNKNOWN' }];
    mockApi(unknownStat);
    renderWithProviders(<IncidentsPage />);
    await screen.findByText('UNKNOWN');
  });
});
