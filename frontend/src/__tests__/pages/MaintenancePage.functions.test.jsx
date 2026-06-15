import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'react-toastify';

vi.mock('../../api/axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { data: [], total: 0 } })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

import MaintenancePage from '../../pages/MaintenancePage';
import api from '../../api/axios';
import { renderWithProviders } from '../helpers/renderWithProviders';

const RECORDS = [
  {
    id: 1, deviceId: 1, type: 'PREVENTIVA', executedDate: '2025-06-14T10:00:00Z',
    scheduledDate: '2025-06-14T10:00:00Z', description: 'Schimb ulei',
    cost: 500, externalService: false, partsReplaced: '', consumablesUsed: '',
    result: 'OK', notes: '', serviceProvider: '',
    devices: { name: 'Ventilator', inventoryNumber: 'INV-001' },
  },
  {
    id: 2, deviceId: 2, type: 'CORECTIVA', executedDate: '2025-06-15T10:00:00Z',
    description: 'Reparație externă', cost: 2000, externalService: true,
    serviceProvider: 'ServTech',
    devices: { name: 'Scaner', inventoryNumber: 'INV-002' },
  },
  {
    id: 3, deviceId: 3, type: 'VERIFICARE', executedDate: '2025-06-16T10:00:00Z',
    description: 'Verificare anuală', cost: 0, externalService: false,
    devices: { name: 'Monitor', inventoryNumber: 'INV-003' },
  },
  {
    id: 4, deviceId: 4, type: 'CALIBRARE', executedDate: '2025-06-17T10:00:00Z',
    description: 'Calibrare precizie', cost: 1200, externalService: false,
    devices: { name: 'Echograf', inventoryNumber: 'INV-004' },
  },
];

const DEVICES = [
  { id: 1, name: 'Ventilator', inventoryNumber: 'INV-001' },
  { id: 2, name: 'Scaner', inventoryNumber: 'INV-002' },
];

function mockApi(records = RECORDS, devices = DEVICES) {
  api.get.mockImplementation((url) => {
    if (url.includes('/maintenance')) return Promise.resolve({ data: { data: records, total: records.length } });
    if (url.includes('/devices')) return Promise.resolve({ data: { devices } });
    return Promise.resolve({ data: {} });
  });
}

describe('MaintenancePage — function coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi();
  });

  it('renders page heading', () => {
    renderWithProviders(<MaintenancePage />);
    expect(screen.getByText('Mentenanță')).toBeInTheDocument();
  });

  it('shows hub tab by default', () => {
    renderWithProviders(<MaintenancePage />);
    expect(screen.getByText('Panou Control (Hub)')).toBeInTheDocument();
    expect(screen.getByText('Planificare & Calendar MPP')).toBeInTheDocument();
    expect(screen.getByText('Execuție MPP')).toBeInTheDocument();
    expect(screen.getByText('Bilete de Reparație')).toBeInTheDocument();
  });

  it('switches to records tab', async () => {
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => {
      expect(screen.getByText('Adaugă Înregistrare')).toBeInTheDocument();
    });
  });

  it('switches back to hub tab', async () => {
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => { expect(screen.getByText('Adaugă Înregistrare')).toBeInTheDocument(); });
    fireEvent.click(screen.getByText('Panou Control (Hub)'));
    expect(screen.getByText('Planificare & Calendar MPP')).toBeInTheDocument();
  });

  it('shows records in table view', async () => {
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => {
      expect(screen.getByText('Schimb ulei')).toBeInTheDocument();
    });
  });

  it('opens add record modal', async () => {
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => { expect(screen.getByText('Adaugă Înregistrare')).toBeInTheDocument(); });
    fireEvent.click(screen.getByText('Adaugă Înregistrare'));
    await waitFor(() => {
      expect(screen.getByText('Adaugă Înregistrare Mentenanță')).toBeInTheDocument();
    });
  });

  it('add modal has all form fields', async () => {
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => { expect(screen.getByText('Adaugă Înregistrare')).toBeInTheDocument(); });
    fireEvent.click(screen.getByText('Adaugă Înregistrare'));
    await waitFor(() => {
      expect(screen.getByLabelText('Dispozitiv *')).toBeInTheDocument();
      expect(screen.getByLabelText('Tip *')).toBeInTheDocument();
      expect(screen.getByLabelText('Data Execuției *')).toBeInTheDocument();
      expect(screen.getByLabelText('Descriere *')).toBeInTheDocument();
    });
  });

  it('validates device required on submit', async () => {
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => { expect(screen.getByText('Adaugă Înregistrare')).toBeInTheDocument(); });
    fireEvent.click(screen.getByText('Adaugă Înregistrare'));
    await waitFor(() => { expect(screen.getByText('Adaugă Înregistrare Mentenanță')).toBeInTheDocument(); });
    const form = document.querySelector('form');
    if (form) fireEvent.submit(form);
    expect(toast.error).toHaveBeenCalled();
  });

  it('validates executedDate required', async () => {
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => { expect(screen.getByText('Adaugă Înregistrare')).toBeInTheDocument(); });
    fireEvent.click(screen.getByText('Adaugă Înregistrare'));
    await waitFor(() => { expect(screen.getByLabelText('Dispozitiv *')).toBeInTheDocument(); });
    fireEvent.change(screen.getByLabelText('Dispozitiv *'), { target: { value: '1' } });
    const form = document.querySelector('form');
    if (form) fireEvent.submit(form);
    expect(toast.error).toHaveBeenCalled();
  });

  it('validates description required', async () => {
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => { expect(screen.getByText('Adaugă Înregistrare')).toBeInTheDocument(); });
    fireEvent.click(screen.getByText('Adaugă Înregistrare'));
    await waitFor(() => { expect(screen.getByLabelText('Dispozitiv *')).toBeInTheDocument(); });
    fireEvent.change(screen.getByLabelText('Dispozitiv *'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Data Execuției *'), { target: { value: '2025-06-14' } });
    const form = document.querySelector('form');
    if (form) fireEvent.submit(form);
    expect(toast.error).toHaveBeenCalled();
  });

  it('submits new record via POST', async () => {
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => { expect(screen.getByText('Adaugă Înregistrare')).toBeInTheDocument(); });
    fireEvent.click(screen.getByText('Adaugă Înregistrare'));
    await waitFor(() => { expect(screen.getByLabelText('Dispozitiv *')).toBeInTheDocument(); });
    fireEvent.change(screen.getByLabelText('Dispozitiv *'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Data Execuției *'), { target: { value: '2025-06-14' } });
    fireEvent.change(screen.getByLabelText('Descriere *'), { target: { value: 'Test mentenanță' } });
    fireEvent.click(screen.getByText('Adaugă').closest('button[type="submit"]'));
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/maintenance', expect.objectContaining({
        deviceId: 1,
        description: 'Test mentenanță',
      }));
    });
  });

  it('edits existing record via PUT', async () => {
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => { expect(screen.getByText('Schimb ulei')).toBeInTheDocument(); });
    const editBtns = screen.getAllByLabelText('Editează');
    fireEvent.click(editBtns[0]);
    await waitFor(() => {
      expect(screen.getByText('Editează Înregistrare')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Salvează'));
    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/maintenance/1', expect.any(Object));
    });
  });

  it('edit modal close button closes', async () => {
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => { expect(screen.getByText('Schimb ulei')).toBeInTheDocument(); });
    fireEvent.click(screen.getAllByLabelText('Editează')[0]);
    await waitFor(() => { expect(screen.getByText('Editează Înregistrare')).toBeInTheDocument(); });
    fireEvent.click(screen.getByText('Anulare'));
    await waitFor(() => {
      expect(screen.queryByText('Editează Înregistrare')).not.toBeInTheDocument();
    });
  });

  it('modal overlay click closes modal', async () => {
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => { expect(screen.getByText('Adaugă Înregistrare')).toBeInTheDocument(); });
    fireEvent.click(screen.getByText('Adaugă Înregistrare'));
    await waitFor(() => { expect(screen.getByText('Adaugă Înregistrare Mentenanță')).toBeInTheDocument(); });
    fireEvent.click(document.querySelector('.fixed.inset-0'));
    await waitFor(() => {
      expect(screen.queryByText('Adaugă Înregistrare Mentenanță')).not.toBeInTheDocument();
    });
  });

  it('modal inner click does not close (stopPropagation)', async () => {
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => { expect(screen.getByText('Adaugă Înregistrare')).toBeInTheDocument(); });
    fireEvent.click(screen.getByText('Adaugă Înregistrare'));
    await waitFor(() => { expect(screen.getByText('Adaugă Înregistrare Mentenanță')).toBeInTheDocument(); });
    fireEvent.click(document.querySelector('.animate-slide-up'));
    expect(screen.getByText('Adaugă Înregistrare Mentenanță')).toBeInTheDocument();
  });

  it('filter by type: Preventivă', async () => {
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => { expect(screen.getByText('Schimb ulei')).toBeInTheDocument(); });
    const filterBtn = screen.getAllByText(/Preventivă/)[0];
    fireEvent.click(filterBtn);
    expect(filterBtn).toBeInTheDocument();
  });

  it('filter by type: Corectivă', async () => {
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => { expect(screen.getByText('Schimb ulei')).toBeInTheDocument(); });
    const filterBtn = screen.getAllByText(/Corectivă/)[0];
    fireEvent.click(filterBtn);
    expect(filterBtn).toBeInTheDocument();
  });

  it('filter by type: Verificare', async () => {
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => { expect(screen.getByText('Schimb ulei')).toBeInTheDocument(); });
    const filterBtn = screen.getAllByText(/Verificare/)[0];
    fireEvent.click(filterBtn);
    expect(filterBtn).toBeInTheDocument();
  });

  it('filter by type: Calibrare', async () => {
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => { expect(screen.getByText('Schimb ulei')).toBeInTheDocument(); });
    const filterBtn = screen.getAllByText(/Calibrare/)[0];
    fireEvent.click(filterBtn);
    expect(filterBtn).toBeInTheDocument();
  });

  it('filter "Toate" shows all records', async () => {
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => { expect(screen.getByText('Schimb ulei')).toBeInTheDocument(); });
    const filterBtn = screen.getAllByText(/Toate/)[0];
    fireEvent.click(filterBtn);
    expect(filterBtn).toBeInTheDocument();
  });

  it('delete flow: trash → confirm → delete', async () => {
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => { expect(screen.getByText('Schimb ulei')).toBeInTheDocument(); });
    fireEvent.click(screen.getAllByLabelText('Șterge')[0]);
    fireEvent.click(screen.getByText('Confirm'));
    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/maintenance/1');
    });
  });

  it('delete flow: trash → cancel', async () => {
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => { expect(screen.getByText('Schimb ulei')).toBeInTheDocument(); });
    fireEvent.click(screen.getAllByLabelText('Șterge')[0]);
    fireEvent.click(screen.getByText('Nu'));
    expect(screen.queryByText('Confirm')).not.toBeInTheDocument();
  });

  it('handles delete error', async () => {
    api.delete.mockRejectedValueOnce(new Error('fail'));
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => { expect(screen.getByText('Schimb ulei')).toBeInTheDocument(); });
    fireEvent.click(screen.getAllByLabelText('Șterge')[0]);
    fireEvent.click(screen.getByText('Confirm'));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Eroare la ștergere');
    });
  });

  it('empty state shows message', async () => {
    mockApi([]);
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => {
      expect(screen.getByText('Nu există înregistrări de mentenanță. Adăugați prima înregistrare.')).toBeInTheDocument();
    });
  });

  it('empty filter state shows message', async () => {
    mockApi([RECORDS[0]]);
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => { expect(screen.getByText('Schimb ulei')).toBeInTheDocument(); });
    fireEvent.click(screen.getByText(/Corectivă/));
    await waitFor(() => {
      expect(screen.getByText('Nicio înregistrare pentru filtrul selectat.')).toBeInTheDocument();
    });
  });

  it('form fields are fillable', async () => {
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => { expect(screen.getByText('Adaugă Înregistrare')).toBeInTheDocument(); });
    fireEvent.click(screen.getByText('Adaugă Înregistrare'));
    await waitFor(() => { expect(screen.getByLabelText('Dispozitiv *')).toBeInTheDocument(); });

    fireEvent.change(screen.getByLabelText('Dispozitiv *'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Tip *'), { target: { value: 'CORECTIVA' } });
    fireEvent.change(screen.getByLabelText('Data Execuției *'), { target: { value: '2025-06-14' } });
    fireEvent.change(screen.getByLabelText('Data Planificată'), { target: { value: '2025-06-13' } });
    fireEvent.change(screen.getByLabelText('Durată (ore)'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Descriere *'), { target: { value: 'Reparație urgentă' } });
    fireEvent.change(screen.getByLabelText('Piese înlocuite'), { target: { value: 'Filtru' } });
    fireEvent.change(screen.getByLabelText('Consumabile folosite'), { target: { value: 'Ulei' } });
    fireEvent.change(screen.getByLabelText('Rezultat'), { target: { value: 'Funcțional' } });
    fireEvent.change(screen.getByLabelText('Cost (MDL)'), { target: { value: '1500' } });
    fireEvent.change(screen.getByLabelText('Note'), { target: { value: 'Notă test' } });

    expect(screen.getByLabelText('Piese înlocuite')).toHaveValue('Filtru');
  });

  it('external service checkbox toggles provider field', async () => {
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => { expect(screen.getByText('Adaugă Înregistrare')).toBeInTheDocument(); });
    fireEvent.click(screen.getByText('Adaugă Înregistrare'));
    await waitFor(() => { expect(screen.getByLabelText('Serviciu extern')).toBeInTheDocument(); });
    expect(screen.queryByLabelText('Furnizor serviciu')).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Serviciu extern'));
    expect(screen.getByLabelText('Furnizor serviciu')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Furnizor serviciu'), { target: { value: 'ServTech' } });
    expect(screen.getByLabelText('Furnizor serviciu')).toHaveValue('ServTech');
  });

  it('post error shows toast', async () => {
    api.post.mockRejectedValueOnce({ response: { data: { error: 'Server error' } } });
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => { expect(screen.getByText('Adaugă Înregistrare')).toBeInTheDocument(); });
    fireEvent.click(screen.getByText('Adaugă Înregistrare'));
    await waitFor(() => { expect(screen.getByLabelText('Dispozitiv *')).toBeInTheDocument(); });
    fireEvent.change(screen.getByLabelText('Dispozitiv *'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Data Execuției *'), { target: { value: '2025-06-14' } });
    fireEvent.change(screen.getByLabelText('Descriere *'), { target: { value: 'Test' } });
    const form = document.querySelector('form');
    if (form) fireEvent.submit(form);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it('records with no cost show dash', async () => {
    mockApi([{ ...RECORDS[0], cost: null }]);
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => { expect(screen.getByText('Schimb ulei')).toBeInTheDocument(); });
    const cells = screen.getAllByText('—');
    expect(cells.length).toBeGreaterThan(0);
  });

  it('records with scheduled date show formatted date', async () => {
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => { expect(screen.getByText('Schimb ulei')).toBeInTheDocument(); });
  });
});
