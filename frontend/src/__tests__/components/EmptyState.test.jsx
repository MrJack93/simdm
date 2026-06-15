import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EmptyState from '../../components/EmptyState';

describe('EmptyState', () => {
  it('renders default title and description', () => {
    render(<EmptyState />);
    expect(screen.getByText('Nicio înregistrare')).toBeInTheDocument();
    expect(screen.getByText('Nu există date de afișat.')).toBeInTheDocument();
  });

  it('renders custom title and description', () => {
    render(<EmptyState title="Gol" description="Nimic aici" />);
    expect(screen.getByText('Gol')).toBeInTheDocument();
    expect(screen.getByText('Nimic aici')).toBeInTheDocument();
  });

  it('has status role', () => {
    render(<EmptyState />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('does not render action button without both actionLabel and onAction', () => {
    render(<EmptyState actionLabel="Click" />);
    expect(screen.queryByRole('button', { name: /click/i })).not.toBeInTheDocument();
  });

  it('does not render action button with only onAction', () => {
    render(<EmptyState onAction={vi.fn()} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders action button when both actionLabel and onAction are provided', () => {
    const onAction = vi.fn();
    render(<EmptyState actionLabel="Adaugă" onAction={onAction} />);
    expect(screen.getByRole('button', { name: /adaugă/i })).toBeInTheDocument();
  });

  it('calls onAction when button is clicked', () => {
    const onAction = vi.fn();
    render(<EmptyState actionLabel="Adaugă" onAction={onAction} />);
    fireEvent.click(screen.getByRole('button', { name: /adaugă/i }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    const { container } = render(<EmptyState className="my-class" />);
    expect(container.firstChild.className).toContain('my-class');
  });
});
