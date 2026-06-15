import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('react-signature-canvas', () => {
  const React = require('react');
  return {
    default: React.forwardRef((props, ref) => {
      React.useImperativeHandle(ref, () => ({
        clear: vi.fn(),
        isEmpty: () => true,
        toDataURL: () => 'data:image/png;base64,mock',
      }));
      return React.createElement('canvas', { 'data-testid': 'signature-canvas', ...props.canvasProps });
    }),
  };
});

import api from '../../api/axios';
import MppExecutionForm from '../../pages/MppExecutionForm';

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter><MppExecutionForm /></MemoryRouter>
    </QueryClientProvider>
  );
}

describe('MppExecutionForm — functions2', () => {
  beforeEach(() => {
    api.get.mockImplementation((url) => {
      if (url.includes('/devices')) return Promise.resolve({ data: { devices: [] } });
      if (url.includes('/maintenance-plans/calendar')) return Promise.resolve({ data: { data: [] } });
      if (url.includes('/checklist-template')) return Promise.resolve({ data: { checklist: [] } });
      if (url.includes('/consumables')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: {} });
    });
    api.post.mockResolvedValue({ data: {} });
  });

  it('renders', async () => {
    renderPage();
    expect(await screen.findByText('Formular Execuție MPP')).toBeInTheDocument();
  });

  it('changes date', async () => {
    renderPage();
    await screen.findByText('Formular Execuție MPP');
    const dateInput = screen.getByDisplayValue(new Date().toISOString().split('T')[0]);
    fireEvent.change(dateInput, { target: { value: '2026-07-15' } });
    expect(dateInput.value).toBe('2026-07-15');
  });

  it('changes duration', async () => {
    renderPage();
    await screen.findByText('Formular Execuție MPP');
    fireEvent.change(screen.getByPlaceholderText('45'), { target: { value: '30' } });
    expect(screen.getByPlaceholderText('45').value).toBe('30');
  });

  it('changes result to DEFECT shows warning', async () => {
    renderPage();
    await screen.findByText('Formular Execuție MPP');
    fireEvent.change(screen.getAllByRole('combobox')[2], { target: { value: 'DEFECT' } });
    await waitFor(() => expect(screen.getByText(/Defect detectat/)).toBeInTheDocument());
  });

  it('changes engineer name', async () => {
    renderPage();
    await screen.findByText('Formular Execuție MPP');
    const input = screen.getByPlaceholderText('Ing. Ion Popescu');
    fireEvent.change(input, { target: { value: 'Ing. Test' } });
    expect(input.value).toBe('Ing. Test');
  });

  it('changes notes', async () => {
    renderPage();
    await screen.findByText('Formular Execuție MPP');
    const ta = screen.getByPlaceholderText(/Observații/);
    fireEvent.change(ta, { target: { value: 'Test' } });
    expect(ta.value).toBe('Test');
  });

  it('add remove consumable', async () => {
    renderPage();
    await screen.findByText('Formular Execuție MPP');
    fireEvent.click(screen.getByText('+ Adaugă consumabil'));
    await waitFor(() => expect(screen.getByText('Șterge')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Șterge'));
    await waitFor(() => expect(screen.queryByText('Șterge')).not.toBeInTheDocument());
  });

  it('update consumable qty', async () => {
    renderPage();
    await screen.findByText('Formular Execuție MPP');
    fireEvent.click(screen.getByText('+ Adaugă consumabil'));
    await waitFor(() => expect(screen.getByText('Șterge')).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText('Cantitate'), { target: { value: '3' } });
    expect(screen.getByPlaceholderText('Cantitate').value).toBe('3');
  });

  it('validates empty device', async () => {
    renderPage();
    await screen.findByText('Formular Execuție MPP');
    fireEvent.submit(screen.getByRole('button', { name: /Salvează/ }));
    await waitFor(() => expect(screen.getByText('Selectează dispozitivul')).toBeInTheDocument());
  });

  it('navigate cancel', async () => {
    renderPage();
    await screen.findByText('Formular Execuție MPP');
    fireEvent.click(screen.getByText('Anulează'));
    expect(mockNavigate).toHaveBeenCalledWith('/maintenance/calendar');
  });

  it('clear signatures', async () => {
    renderPage();
    await screen.findByText('Formular Execuție MPP');
    const btns = screen.getAllByText('Șterge semnătură');
    expect(btns.length).toBe(2);
    fireEvent.click(btns[0]);
    fireEvent.click(btns[1]);
  });

  it('result FUNCTIONAL does not show warning', async () => {
    renderPage();
    await screen.findByText('Formular Execuție MPP');
    fireEvent.change(screen.getAllByRole('combobox')[2], { target: { value: 'FUNCTIONAL' } });
    await waitFor(() => expect(screen.queryByText(/Defect detectat/)).not.toBeInTheDocument());
  });
});
