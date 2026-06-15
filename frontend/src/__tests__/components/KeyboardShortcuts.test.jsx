import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import KeyboardShortcuts from '../../components/KeyboardShortcuts';

describe('KeyboardShortcuts', () => {
  it('renders nothing initially', () => {
    render(<KeyboardShortcuts />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows dialog on Ctrl+/', () => {
    render(<KeyboardShortcuts />);
    fireEvent.keyDown(window, { key: '/', ctrlKey: true });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Scurtături Tastatură')).toBeInTheDocument();
  });

  it('hides dialog on Escape', () => {
    render(<KeyboardShortcuts />);
    fireEvent.keyDown(window, { key: '/', ctrlKey: true });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('navigates to new device on Ctrl+N', () => {
    render(<KeyboardShortcuts />);
    fireEvent.keyDown(window, { key: 'n', ctrlKey: true });
    expect(mockNavigate).toHaveBeenCalledWith('/devices/new');
  });

  it('navigates to maintenance calendar on Ctrl+M', () => {
    render(<KeyboardShortcuts />);
    fireEvent.keyDown(window, { key: 'm', ctrlKey: true });
    expect(mockNavigate).toHaveBeenCalledWith('/maintenance/calendar');
  });

  it('lists all shortcuts', () => {
    render(<KeyboardShortcuts />);
    fireEvent.keyDown(window, { key: '/', ctrlKey: true });
    expect(screen.getByText('Căutare rapidă')).toBeInTheDocument();
    expect(screen.getByText('Dispozitiv nou')).toBeInTheDocument();
    expect(screen.getByText('Mentenanță')).toBeInTheDocument();
    expect(screen.getByText('Ajutor scurtături')).toBeInTheDocument();
    expect(screen.getByText('Închide modal / Anulează')).toBeInTheDocument();
  });

  it('closes on overlay click', () => {
    render(<KeyboardShortcuts />);
    fireEvent.keyDown(window, { key: '/', ctrlKey: true });
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not close when clicking content area', () => {
    render(<KeyboardShortcuts />);
    fireEvent.keyDown(window, { key: '/', ctrlKey: true });
    const content = screen.getByText('Scurtături Tastatură').closest('div');
    fireEvent.click(content);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
