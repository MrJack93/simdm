import { screen, fireEvent, waitFor } from '@testing-library/react';
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
    cost: 500, externalService: false, partsReplaced: 'Filtru', consumablesUsed: 'Ulei',
    result: 'OK', notes: 'Notă test', serviceProvider: '',
    devices: { name: 'Ventilator', inventoryNumber: 'INV-001' },
  },
  {
    id: 2, deviceId: 2, type: 'CORECTIVA', executedDate: '2025-06-15T10:00:00Z',
    description: 'Reparație externă', cost: 2000, externalService: true,
    serviceProvider: 'ServTech', scheduledDate: null,
    devices: { name: 'Scaner', inventoryNumber: 'INV-002' },
  },
  {
    id: 3, deviceId: 3, type: 'VERIFICARE', executedDate: '2025-06-16T10:00:00Z',
    description: 'Verificare anuală', cost: 0, externalService: false,
    scheduledDate: '2025-06-15T10:00:00Z',
    devices: { name: 'Monitor', inventoryNumber: 'INV-003' },
  },
  {
    id: 4, deviceId: 4, type: 'CALIBRARE', executedDate: '2025-06-17T10:00:00Z',
    description: 'Calibrare precizie', cost: 1200, externalService: false,
    scheduledDate: '2025-06-16T10:00:00Z',
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

describe('MaintenancePage — coverage2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi();
  });

  it('shows hub tab links', () => {
    renderWithProviders(<MaintenancePage />);
    expect(screen.getByText('Planificare & Calendar MPP')).toBeInTheDocument();
    expect(screen.getByText('Execuție MPP')).toBeInTheDocument();
    expect(screen.getByText('Bilete de Reparație')).toBeInTheDocument();
  });

  it('records tab shows all columns', async () => {
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => {
      expect(screen.getByText('Dispozitiv')).toBeInTheDocument();
      expect(screen.getByText('Tip')).toBeInTheDocument();
      expect(screen.getByText('Data Execuției')).toBeInTheDocument();
      expect(screen.getByText('Descriere')).toBeInTheDocument();
      expect(screen.getByText('Cost')).toBeInTheDocument();
      expect(screen.getByText('Serviciu Extern')).toBeInTheDocument();
      expect(screen.getByText('Acțiuni')).toBeInTheDocument();
    });
  });

  it('edit record opens modal pre-filled', async () => {
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => { expect(screen.getByText('Schimb ulei')).toBeInTheDocument(); });
    fireEvent.click(screen.getAllByLabelText('Editează')[0]);
    await waitFor(() => {
      expect(screen.getByText('Editează Înregistrare')).toBeInTheDocument();
      expect(screen.getByLabelText('Dispozitiv *')).toHaveValue('1');
    });
  });

  it('all form fields are editable', async () => {
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => { expect(screen.getByText('Schimb ulei')).toBeInTheDocument(); });
    fireEvent.click(screen.getByText('Adaugă Înregistrare'));
    await waitFor(() => { expect(screen.getByLabelText('Dispozitiv *')).toBeInTheDocument(); });

    fireEvent.change(screen.getByLabelText('Dispozitiv *'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Tip *'), { target: { value: 'VERIFICARE' } });
    fireEvent.change(screen.getByLabelText('Data Execuției *'), { target: { value: '2025-07-01' } });
    fireEvent.change(screen.getByLabelText('Data Planificată'), { target: { value: '2025-06-30' } });
    fireEvent.change(screen.getByLabelText('Durată (ore)'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('Descriere *'), { target: { value: 'Verificare completă' } });
    fireEvent.change(screen.getByLabelText('Piese înlocuite'), { target: { value: 'Filtru nou' } });
    fireEvent.change(screen.getByLabelText('Consumabile folosite'), { target: { value: 'Alcool izopropilic' } });
    fireEvent.change(screen.getByLabelText('Rezultat'), { target: { value: 'Conform' } });
    fireEvent.change(screen.getByLabelText('Cost (MDL)'), { target: { value: '750' } });
    fireEvent.change(screen.getByLabelText('Note'), { target: { value: 'Test note' } });

    expect(screen.getByLabelText('Descriere *')).toHaveValue('Verificare completă');
  });

  it('submit new record with all fields', async () => {
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => { expect(screen.getByText('Adaugă Înregistrare')).toBeInTheDocument(); });
    fireEvent.click(screen.getByText('Adaugă Înregistrare'));
    await waitFor(() => { expect(screen.getByLabelText('Dispozitiv *')).toBeInTheDocument(); });

    fireEvent.change(screen.getByLabelText('Dispozitiv *'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Tip *'), { target: { value: 'CALIBRARE' } });
    fireEvent.change(screen.getByLabelText('Data Execuției *'), { target: { value: '2025-07-01' } });
    fireEvent.change(screen.getByLabelText('Descriere *'), { target: { value: 'Calibrare nouă' } });
    fireEvent.change(screen.getByLabelText('Durată (ore)'), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText('Cost (MDL)'), { target: { value: '3000' } });

    fireEvent.click(screen.getByText('Adaugă').closest('button[type="submit"]'));
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/maintenance', expect.objectContaining({
        deviceId: 1,
        type: 'CALIBRARE',
        description: 'Calibrare nouă',
      }));
    });
  });

  it('submit new record with external service', async () => {
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => { expect(screen.getByText('Adaugă Înregistrare')).toBeInTheDocument(); });
    fireEvent.click(screen.getByText('Adaugă Înregistrare'));
    await waitFor(() => { expect(screen.getByLabelText('Dispozitiv *')).toBeInTheDocument(); });

    fireEvent.change(screen.getByLabelText('Dispozitiv *'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Data Execuției *'), { target: { value: '2025-07-01' } });
    fireEvent.change(screen.getByLabelText('Descriere *'), { target: { value: 'Service extern' } });
    fireEvent.click(screen.getByLabelText('Serviciu extern'));
    fireEvent.change(screen.getByLabelText('Furnizor serviciu'), { target: { value: 'TechService SRL' } });

    fireEvent.click(screen.getByText('Adaugă').closest('button[type="submit"]'));
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/maintenance', expect.objectContaining({
        externalService: true,
        serviceProvider: 'TechService SRL',
      }));
    });
  });

  it('handles POST error with no response error', async () => {
    api.post.mockRejectedValueOnce(new Error('Network error'));
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => { expect(screen.getByText('Adaugă Înregistrare')).toBeInTheDocument(); });
    fireEvent.click(screen.getByText('Adaugă Înregistrare'));
    await waitFor(() => { expect(screen.getByLabelText('Dispozitiv *')).toBeInTheDocument(); });

    fireEvent.change(screen.getByLabelText('Dispozitiv *'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Data Execuției *'), { target: { value: '2025-07-01' } });
    fireEvent.change(screen.getByLabelText('Descriere *'), { target: { value: 'Test' } });
    fireEvent.click(screen.getByText('Adaugă').closest('button[type="submit"]'));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it('handles PUT error for edit', async () => {
    api.put.mockRejectedValueOnce({ response: { data: { error: 'Server error' } } });
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => { expect(screen.getByText('Schimb ulei')).toBeInTheDocument(); });
    fireEvent.click(screen.getAllByLabelText('Editează')[0]);
    await waitFor(() => { expect(screen.getByText('Editează Înregistrare')).toBeInTheDocument(); });
    fireEvent.click(screen.getByText('Salvează'));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Server error');
    });
  });

  it('pagination works forward and back', async () => {
    const manyRecords = Array.from({ length: 30 }, (_, i) => ({
      ...RECORDS[0], id: i + 1, description: `Record ${i + 1}`,
    }));
    mockApi(manyRecords);
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => { expect(screen.getByText('Record 1')).toBeInTheDocument(); });

    expect(screen.getByText('Pagina 1 din 2')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Înainte'));
    await waitFor(() => {
      expect(screen.getByText('Pagina 2 din 2')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Înapoi'));
    await waitFor(() => {
      expect(screen.getByText('Pagina 1 din 2')).toBeInTheDocument();
    });
  });

  it('loading state shows skeletons', () => {
    api.get.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    const skeletons = document.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('edit form fields are all editable', async () => {
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => { expect(screen.getByText('Schimb ulei')).toBeInTheDocument(); });
    fireEvent.click(screen.getAllByLabelText('Editează')[0]);
    await waitFor(() => { expect(screen.getByText('Editează Înregistrare')).toBeInTheDocument(); });

    fireEvent.change(screen.getByLabelText('Dispozitiv *'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Tip *'), { target: { value: 'CORECTIVA' } });
    fireEvent.change(screen.getByLabelText('Data Execuției *'), { target: { value: '2025-08-01' } });
    fireEvent.change(screen.getByLabelText('Descriere *'), { target: { value: 'Actualizare' } });
    fireEvent.change(screen.getByLabelText('Cost (MDL)'), { target: { value: '999' } });
    fireEvent.change(screen.getByLabelText('Durată (ore)'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Piese înlocuite'), { target: { value: 'Motor' } });
    fireEvent.change(screen.getByLabelText('Consumabile folosite'), { target: { value: 'Grăsime' } });
    fireEvent.change(screen.getByLabelText('Rezultat'), { target: { value: 'Finalizat' } });
    fireEvent.change(screen.getByLabelText('Note'), { target: { value: 'Actualizat complet' } });
    fireEvent.click(screen.getByLabelText('Serviciu extern'));
    fireEvent.change(screen.getByLabelText('Furnizor serviciu'), { target: { value: 'NewProvider' } });

    fireEvent.click(screen.getByText('Salvează'));
    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/maintenance/1', expect.objectContaining({
        deviceId: 2,
        description: 'Actualizare',
      }));
    });
  });

  it('delete confirm mutation success', async () => {
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => { expect(screen.getByText('Schimb ulei')).toBeInTheDocument(); });
    fireEvent.click(screen.getAllByLabelText('Șterge')[0]);
    fireEvent.click(screen.getByText('Confirm'));
    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/maintenance/1');
      expect(toast.success).toHaveBeenCalledWith('Înregistrare ștearsă');
    });
  });

  it('cancel button closes add modal', async () => {
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => { expect(screen.getByText('Adaugă Înregistrare')).toBeInTheDocument(); });
    fireEvent.click(screen.getByText('Adaugă Înregistrare'));
    await waitFor(() => { expect(screen.getByText('Adaugă Înregistrare Mentenanță')).toBeInTheDocument(); });
    fireEvent.click(screen.getByText('Anulare'));
    await waitFor(() => {
      expect(screen.queryByText('Adaugă Înregistrare Mentenanță')).not.toBeInTheDocument();
    });
  });

  it('external service unchecked hides provider field', async () => {
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => { expect(screen.getByText('Adaugă Înregistrare')).toBeInTheDocument(); });
    fireEvent.click(screen.getByText('Adaugă Înregistrare'));
    await waitFor(() => { expect(screen.getByLabelText('Serviciu extern')).toBeInTheDocument(); });
    fireEvent.click(screen.getByLabelText('Serviciu extern'));
    expect(screen.getByLabelText('Furnizor serviciu')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Serviciu extern'));
    expect(screen.queryByLabelText('Furnizor serviciu')).not.toBeInTheDocument();
  });
});
