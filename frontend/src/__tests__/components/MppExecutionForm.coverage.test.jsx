import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../api/consumables', () => ({
  getConsumables: vi.fn(() =>
    Promise.resolve([
      { id: 1, name: 'Bandă ECG', quantity: 10, currentQuantity: 10 },
      { id: 2, name: 'Gel USG', quantity: 5, currentQuantity: 5 },
    ])
  ),
}));

vi.mock('../../api/mppExecutions', () => ({
  executeMpp: vi.fn(() => Promise.resolve({ formularPdfUrl: '/files/formular6-custom.pdf' })),
}));

import MppExecutionForm from '../../components/MppExecutionForm';
import { getConsumables } from '../../api/consumables';
import { executeMpp } from '../../api/mppExecutions';

function renderForm(occurrenceId = 1) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MppExecutionForm occurrenceId={occurrenceId} />
    </QueryClientProvider>
  );
}

describe('MppExecutionForm — branch coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the form title', () => {
    renderForm();
    expect(screen.getByText('Execuție Mentenanță')).toBeInTheDocument();
  });

  it('renders checklist items', () => {
    renderForm();
    expect(screen.getByLabelText('Verificare componentă')).toBeInTheDocument();
    expect(screen.getByLabelText('Curățare')).toBeInTheDocument();
    expect(screen.getByLabelText('Lubrifiere')).toBeInTheDocument();
  });

  it('toggles checklist item', () => {
    renderForm();
    const checkbox = screen.getByLabelText('Verificare componentă');
    expect(checkbox.checked).toBe(false);
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);
  });

  it('renders consumable select and quantity input after data loads', async () => {
    renderForm();
    await waitFor(() => {
      expect(screen.getByLabelText('Consumabil')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Cantitate')).toBeInTheDocument();
  });

  it('adds a consumable when button clicked', async () => {
    renderForm();
    await waitFor(() => {
      expect(screen.getByText('Bandă ECG')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText('Consumabil'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Cantitate'), { target: { value: '2' } });
    fireEvent.click(screen.getByText('+ Adaugă'));
    await waitFor(() => {
      expect(screen.getByText(/×2/)).toBeInTheDocument();
    });
  });

  it('does not add consumable when none selected', async () => {
    renderForm();
    await waitFor(() => {
      expect(screen.getByLabelText('Consumabil')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('+ Adaugă'));
    expect(screen.queryByText(/×/)).not.toBeInTheDocument();
  });

  it('shows stock error when quantity exceeds available', async () => {
    renderForm();
    await waitFor(() => {
      expect(screen.getByText('Bandă ECG')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText('Consumabil'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Cantitate'), { target: { value: '100' } });
    fireEvent.click(screen.getByText('+ Adaugă'));
    await waitFor(() => {
      expect(screen.getByText('Stoc insuficient pentru cantitatea solicitată')).toBeInTheDocument();
    });
  });

  it('removes an added consumable', async () => {
    renderForm();
    await waitFor(() => {
      expect(screen.getByText('Bandă ECG')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText('Consumabil'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Cantitate'), { target: { value: '1' } });
    fireEvent.click(screen.getByText('+ Adaugă'));
    await waitFor(() => {
      expect(screen.getByText(/×1/)).toBeInTheDocument();
    });
    // The delete button has aria-label="Șterge Bandă ECG"
    fireEvent.click(screen.getByLabelText('Șterge Bandă ECG'));
    await waitFor(() => {
      expect(screen.queryByText(/×1/)).not.toBeInTheDocument();
    });
  });

  it('handles before photo upload', () => {
    renderForm();
    const fileInput = screen.getByLabelText('Fotografie Înainte (Opțional)');
    const file = new File(['test'], 'photo.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(screen.getByAltText('Preview Înainte de reparație')).toBeInTheDocument();
  });

  it('handles after photo upload', () => {
    renderForm();
    const fileInput = screen.getByLabelText('Fotografie După (Opțional)');
    const file = new File(['test'], 'photo.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(screen.getByAltText('Preview După reparație')).toBeInTheDocument();
  });

  it('does not set photo when no file selected', () => {
    renderForm();
    const fileInput = screen.getByLabelText('Fotografie Înainte (Opțional)');
    fireEvent.change(fileInput, { target: { files: [] } });
    expect(screen.queryByAltText('Preview Înainte de reparație')).not.toBeInTheDocument();
  });

  it('renders observations textarea', () => {
    renderForm();
    expect(screen.getByPlaceholderText(/Adaugă observații/)).toBeInTheDocument();
  });

  it('truncates observations to MAX_OBSERVATIONS', () => {
    renderForm();
    const textarea = screen.getByPlaceholderText(/Adaugă observații/);
    const longText = 'x'.repeat(600);
    fireEvent.change(textarea, { target: { value: longText } });
    expect(textarea.value.length).toBeLessThanOrEqual(500);
  });

  it('shows observations length counter', () => {
    renderForm();
    expect(screen.getByText('0/500')).toBeInTheDocument();
    const textarea = screen.getByPlaceholderText(/Adaugă observații/);
    fireEvent.change(textarea, { target: { value: 'test' } });
    expect(screen.getByText('4/500')).toBeInTheDocument();
  });

  it('clicking engineer signature box sets signed', () => {
    renderForm();
    const sigBoxes = screen.getAllByText('Click pentru semnătură');
    fireEvent.click(sigBoxes[0]);
    const signedTexts = screen.getAllByText('✓ Semnat');
    expect(signedTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('clears engineer signature', () => {
    renderForm();
    const sigBoxes = screen.getAllByText('Click pentru semnătură');
    fireEvent.click(sigBoxes[0]);
    const clearBtns = screen.getAllByText('Curăță');
    fireEvent.click(clearBtns[0]);
    expect(screen.getAllByText('Click pentru semnătură').length).toBeGreaterThanOrEqual(1);
  });

  it('shows error when submitting without signatures', async () => {
    renderForm();
    fireEvent.click(screen.getByText('Salvare'));
    await waitFor(() => {
      expect(screen.getByText('Semnătură obligatorie pentru inginer și manager')).toBeInTheDocument();
    });
  });

  it('submits successfully with both signatures', async () => {
    renderForm();
    // Click engineer signature - find the first "Click pentru semnătură" span
    const sigBoxes = screen.getAllByText('Click pentru semnătură');
    fireEvent.click(sigBoxes[0]);
    // After clicking first, the second "Click pentru semnătură" is now index 0
    const remaining = screen.getAllByText('Click pentru semnătură');
    if (remaining.length > 0) {
      fireEvent.click(remaining[0]);
    }

    fireEvent.click(screen.getByText('Salvare'));
    await waitFor(() => {
      expect(screen.getByText('Mentenanță executată cu succes')).toBeInTheDocument();
    });
  });

  it('handles submit error with response data', async () => {
    executeMpp.mockRejectedValueOnce({
      response: { data: { error: 'Server error' } },
    });
    renderForm();
    const sigBoxes = screen.getAllByText('Click pentru semnătură');
    fireEvent.click(sigBoxes[0]);
    const remaining = screen.getAllByText('Click pentru semnătură');
    if (remaining.length > 0) fireEvent.click(remaining[0]);

    fireEvent.click(screen.getByText('Salvare'));
    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('handles submit error without response data', async () => {
    executeMpp.mockRejectedValueOnce(new Error('network'));
    renderForm();
    const sigBoxes = screen.getAllByText('Click pentru semnătură');
    fireEvent.click(sigBoxes[0]);
    const remaining = screen.getAllByText('Click pentru semnătură');
    if (remaining.length > 0) fireEvent.click(remaining[0]);

    fireEvent.click(screen.getByText('Salvare'));
    await waitFor(() => {
      expect(screen.getByText('Eroare la salvare')).toBeInTheDocument();
    });
  });

  it('shows PDF link after successful submit', async () => {
    renderForm();
    const sigBoxes = screen.getAllByText('Click pentru semnătură');
    fireEvent.click(sigBoxes[0]);
    const remaining = screen.getAllByText('Click pentru semnătură');
    if (remaining.length > 0) fireEvent.click(remaining[0]);

    fireEvent.click(screen.getByText('Salvare'));
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Descarcă Formular' })).toHaveAttribute(
        'href',
        '/files/formular6-custom.pdf'
      );
    });
  });

  it('shows default PDF URL when result has no formularPdfUrl', async () => {
    executeMpp.mockResolvedValueOnce({});
    renderForm();
    const sigBoxes = screen.getAllByText('Click pentru semnătură');
    fireEvent.click(sigBoxes[0]);
    const remaining = screen.getAllByText('Click pentru semnătură');
    if (remaining.length > 0) fireEvent.click(remaining[0]);

    fireEvent.click(screen.getByText('Salvare'));
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Descarcă Formular' })).toHaveAttribute(
        'href',
        '/files/formular6.pdf'
      );
    });
  });

  it('consumables from consumables.data path', async () => {
    getConsumables.mockResolvedValueOnce({ data: [{ id: 3, name: 'Mască oxigen', quantity: 20 }] });
    renderForm();
    await waitFor(() => {
      expect(screen.getByText('Mască oxigen')).toBeInTheDocument();
    });
  });

  it('consumables from consumables array path', async () => {
    getConsumables.mockResolvedValueOnce([{ id: 4, name: 'Seringă', quantity: 50 }]);
    renderForm();
    await waitFor(() => {
      expect(screen.getByText('Seringă')).toBeInTheDocument();
    });
  });

  it('handleAddConsumable returns early if consumable not found', async () => {
    renderForm();
    await waitFor(() => {
      expect(screen.getByLabelText('Consumabil')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText('Consumabil'), { target: { value: '999' } });
    fireEvent.change(screen.getByLabelText('Cantitate'), { target: { value: '1' } });
    fireEvent.click(screen.getByText('+ Adaugă'));
    expect(screen.queryByText(/×/)).not.toBeInTheDocument();
  });

  it('consumable with currentQuantity fallback', async () => {
    getConsumables.mockResolvedValueOnce([
      { id: 5, name: 'Mănuși', currentQuantity: 3 },
    ]);
    renderForm();
    await waitFor(() => {
      expect(screen.getByText('Mănuși')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText('Consumabil'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Cantitate'), { target: { value: '4' } });
    fireEvent.click(screen.getByText('+ Adaugă'));
    await waitFor(() => {
      expect(screen.getByText('Stoc insuficient pentru cantitatea solicitată')).toBeInTheDocument();
    });
  });

  it('submit button shows loading state', async () => {
    executeMpp.mockImplementation(() => new Promise(() => {}));
    renderForm();
    const sigBoxes = screen.getAllByText('Click pentru semnătură');
    fireEvent.click(sigBoxes[0]);
    const remaining = screen.getAllByText('Click pentru semnătură');
    if (remaining.length > 0) fireEvent.click(remaining[0]);

    fireEvent.click(screen.getByText('Salvare'));
    await waitFor(() => {
      expect(screen.getByText('Se salvează...')).toBeInTheDocument();
    });
  });
});
