import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Skeleton from '../../components/Skeleton';

describe('Skeleton', () => {
  it('renders with role status', () => {
    render(<Skeleton />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has aria-label for accessibility', () => {
    render(<Skeleton />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Se încarcă');
  });

  it('renders screen reader text', () => {
    render(<Skeleton />);
    expect(screen.getByText('Se încarcă...')).toBeInTheDocument();
  });

  it('renders text variant by default', () => {
    const { container } = render(<Skeleton />);
    expect(container.querySelectorAll('.skeleton-text').length).toBeGreaterThan(0);
  });

  it('renders specified number of text lines', () => {
    const { container } = render(<Skeleton lines={5} variant="text" />);
    const textElements = container.querySelectorAll('.skeleton-text');
    expect(textElements.length).toBe(5);
  });

  it('renders last text line with 60% width', () => {
    const { container } = render(<Skeleton lines={3} variant="text" />);
    const textElements = container.querySelectorAll('.skeleton-text');
    expect(textElements[textElements.length - 1]).toHaveStyle({ width: '60%' });
  });

  it('renders card variant', () => {
    const { container } = render(<Skeleton variant="card" />);
    expect(container.querySelector('.card-base')).toBeInTheDocument();
    expect(container.querySelector('.skeleton-heading')).toBeInTheDocument();
  });

  it('renders table variant', () => {
    const { container } = render(<Skeleton variant="table" />);
    const rows = container.querySelectorAll('.skeleton-row');
    expect(rows.length).toBeGreaterThan(0);
  });

  it('renders table variant with specified rows', () => {
    const { container } = render(<Skeleton variant="table" lines={4} />);
    const rows = container.querySelectorAll('.skeleton-row');
    // 1 header row + 4 data rows
    expect(rows.length).toBe(5);
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="custom-skeleton" />);
    expect(container.firstChild.className).toContain('custom-skeleton');
  });

  it('falls back to text variant for unknown variant', () => {
    const { container } = render(<Skeleton variant="unknown" />);
    expect(container.querySelectorAll('.skeleton-text').length).toBeGreaterThan(0);
  });
});
