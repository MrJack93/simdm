import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ErrorState from '../../components/ErrorState';

describe('ErrorState', () => {
  it('renders default title', () => {
    render(<ErrorState />);
    expect(screen.getByText('A apărut o eroare')).toBeInTheDocument();
  });

  it('renders custom title', () => {
    render(<ErrorState title="Eroare personalizată" />);
    expect(screen.getByText('Eroare personalizată')).toBeInTheDocument();
  });

  it('renders default error message when no error prop', () => {
    render(<ErrorState />);
    expect(screen.getByText('Nu s-au putut încărca datele. Încearcă din nou.')).toBeInTheDocument();
  });

  it('renders error message from error object', () => {
    render(<ErrorState error={{ message: 'Eroare de rețea' }} />);
    expect(screen.getByText('Eroare de rețea')).toBeInTheDocument();
  });

  it('has alert role', () => {
    render(<ErrorState />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('does not render retry button without onRetry', () => {
    render(<ErrorState />);
    expect(screen.queryByRole('button', { name: /încearcă din nou/i })).not.toBeInTheDocument();
  });

  it('renders retry button when onRetry is provided', () => {
    render(<ErrorState onRetry={vi.fn()} />);
    expect(screen.getByRole('button', { name: /încearcă din nou/i })).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: /încearcă din nou/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    const { container } = render(<ErrorState className="extra-class" />);
    expect(container.firstChild.className).toContain('extra-class');
  });

  it('handles error with undefined message', () => {
    render(<ErrorState error={{}} />);
    expect(screen.getByText('Nu s-au putut încărca datele. Încearcă din nou.')).toBeInTheDocument();
  });
});
