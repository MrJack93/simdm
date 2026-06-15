import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Skeleton, SkeletonLines, SkeletonCard, SkeletonTable } from '../../components/ui/skeleton';

describe('Skeleton', () => {
  it('renders with role status', () => {
    render(<Skeleton />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has aria-label for accessibility', () => {
    render(<Skeleton />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Se încarcă...');
  });

  it('renders with data-slot', () => {
    const { container } = render(<Skeleton />);
    expect(container.querySelector('[data-slot="skeleton"]')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="custom-skeleton" />);
    expect(container.firstChild.className).toContain('custom-skeleton');
  });

  it('has animate-pulse class', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild.className).toContain('animate-pulse');
  });
});

describe('SkeletonLines', () => {
  it('renders default 3 lines', () => {
    const { container } = render(<SkeletonLines />);
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBe(3);
  });

  it('renders specified number of lines', () => {
    const { container } = render(<SkeletonLines lines={5} />);
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBe(5);
  });

  it('last line has w-2/3 class', () => {
    const { container } = render(<SkeletonLines lines={3} />);
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons[skeletons.length - 1].className).toContain('w-2/3');
  });
});

describe('SkeletonCard', () => {
  it('renders card with header and lines', () => {
    const { container } = render(<SkeletonCard />);
    expect(container.querySelector('.rounded-lg')).toBeInTheDocument();
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(1);
  });

  it('renders with custom lines', () => {
    const { container } = render(<SkeletonCard lines={5} />);
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBe(6);
  });
});

describe('SkeletonTable', () => {
  it('renders table with default rows', () => {
    const { container } = render(<SkeletonTable />);
    const rows = container.querySelectorAll('.flex.gap-3');
    expect(rows.length).toBe(5);
  });

  it('renders table with specified rows', () => {
    const { container } = render(<SkeletonTable rows={3} />);
    const rows = container.querySelectorAll('.flex.gap-3');
    expect(rows.length).toBe(3);
  });
});
