import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CalendarEventIndicator } from '@/components/ui/calendar-slot';

describe('CalendarEventIndicator', () => {
  it('renders with default props (programat)', () => {
    render(<CalendarEventIndicator />);
    expect(screen.getByText('○')).toBeInTheDocument();
    expect(screen.getByText('Event')).toBeInTheDocument();
  });

  it('renders scadent status icon', () => {
    render(<CalendarEventIndicator status="scadent" />);
    expect(screen.getByText('⏰')).toBeInTheDocument();
  });

  it('renders depasit status icon', () => {
    render(<CalendarEventIndicator status="depasit" />);
    expect(screen.getByText('⚠')).toBeInTheDocument();
  });

  it('renders efectuat status icon', () => {
    render(<CalendarEventIndicator status="efectuat" />);
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('renders default fallback icon for unknown status', () => {
    render(<CalendarEventIndicator status="unknown" />);
    expect(screen.getByText('●')).toBeInTheDocument();
  });

  it('applies status class', () => {
    render(<CalendarEventIndicator status="programat" />);
    const indicator = screen.getByRole('status');
    expect(indicator.className).toContain('status-programat');
  });

  it('applies custom deviceName', () => {
    render(<CalendarEventIndicator deviceName="USG Device" />);
    expect(screen.getByText('USG Device')).toBeInTheDocument();
  });

  it('has correct aria-label', () => {
    render(<CalendarEventIndicator status="efectuat" deviceName="Ventilator" />);
    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      'Ventilator — Status: efectuat'
    );
  });

  it('has title attribute', () => {
    render(<CalendarEventIndicator status="scadent" deviceName="Pulsioximetru" />);
    expect(screen.getByRole('status')).toHaveAttribute(
      'title',
      'Pulsioximetru (scadent)'
    );
  });

  it('status icon span is hidden from screen readers', () => {
    render(<CalendarEventIndicator status="programat" />);
    const iconSpan = screen.getByText('○');
    expect(iconSpan).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders quantity prop', () => {
    render(<CalendarEventIndicator quantity={5} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders showExtra prop', () => {
    render(<CalendarEventIndicator showExtra={true} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('case-insensitive status handling', () => {
    render(<CalendarEventIndicator status="EFECTUAT" />);
    expect(screen.getByText('✓')).toBeInTheDocument();
  });
});
