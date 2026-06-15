import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Spinner from '../../components/Spinner';

describe('Spinner', () => {
  it('renders with role status', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has aria-label for accessibility', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Se încarcă');
  });

  it('renders screen reader text', () => {
    render(<Spinner />);
    expect(screen.getByText('Se încarcă...')).toBeInTheDocument();
  });

  it('applies default md size class', () => {
    render(<Spinner />);
    expect(screen.getByRole('status').className).toContain('w-5');
  });

  it('applies sm size class', () => {
    render(<Spinner size="sm" />);
    expect(screen.getByRole('status').className).toContain('w-4');
  });

  it('applies lg size class', () => {
    render(<Spinner size="lg" />);
    expect(screen.getByRole('status').className).toContain('w-8');
  });

  it('falls back to md for unknown size', () => {
    render(<Spinner size="xl" />);
    expect(screen.getByRole('status').className).toContain('w-5');
  });

  it('applies custom className', () => {
    const { container } = render(<Spinner className="custom-spinner" />);
    expect(container.firstChild.className).toContain('custom-spinner');
  });

  it('always includes loading-spinner class', () => {
    render(<Spinner size="sm" />);
    expect(screen.getByRole('status').className).toContain('loading-spinner');
  });
});
