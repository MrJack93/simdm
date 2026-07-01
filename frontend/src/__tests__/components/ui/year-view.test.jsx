import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CalendarYearView } from '@/components/ui/calendar-year-view';

vi.mock('react-day-picker', () => {
  return {
    DayPicker: ({ month, onSelect }) => (
      <div data-testid="daypicker" data-month={month?.getMonth()}>
        <button onClick={() => onSelect && onSelect(new Date(2025, 0, 15))}>Pick</button>
      </div>
    ),
  };
});

describe('CalendarYearView', () => {
  it('renders with default year', () => {
    render(<CalendarYearView />);
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`Anul ${currentYear}`))).toBeInTheDocument();
  });

  it('renders with custom year', () => {
    render(<CalendarYearView selectedYear={2026} />);
    expect(screen.getByText(/Anul 2026/)).toBeInTheDocument();
  });

  it('renders 12 month cards', () => {
    const { container } = render(<CalendarYearView selectedYear={2025} />);
    const monthCards = container.querySelectorAll('.year-month-card');
    expect(monthCards.length).toBe(12);
  });

  it('displays total events count', () => {
    const occurrences = {
      '2025-01-15': [{ scheduledDate: '2025-01-15', status: 'programat' }],
      '2025-03-10': [{ scheduledDate: '2025-03-10', status: 'scadent' }],
    };
    render(<CalendarYearView selectedYear={2025} occurrencesByDate={occurrences} />);
    const subtitle = document.querySelector('.calendar-year-subtitle');
    expect(subtitle.textContent).toContain('Total evenimente');
    expect(subtitle.textContent).toContain('2');
  });

  it('displays zero events', () => {
    render(<CalendarYearView selectedYear={2025} occurrencesByDate={{}} />);
    const subtitle = document.querySelector('.calendar-year-subtitle');
    expect(subtitle.textContent).toContain('Total evenimente');
    expect(subtitle.textContent).toContain('0');
  });

  it('filters occurrences by year and month', () => {
    const occurrences = {
      '2025-01-15': [{ scheduledDate: '2025-01-15', status: 'programat' }],
      '2026-01-15': [{ scheduledDate: '2026-01-15', status: 'scadent' }],
    };
    render(<CalendarYearView selectedYear={2025} occurrencesByDate={occurrences} />);
    expect(screen.getByText(/Total evenimente/)).toBeInTheDocument();
  });

  it('shows events in month card when occurrences exist', () => {
    const occurrences = {
      '2025-01-15': [{ scheduledDate: '2025-01-15', status: 'programat', deviceName: 'USG' }],
    };
    render(<CalendarYearView selectedYear={2025} occurrencesByDate={occurrences} />);
    expect(screen.getByText('Evenimente programate')).toBeInTheDocument();
  });

  it('shows event day and count', () => {
    const occurrences = {
      '2025-01-15': [
        { scheduledDate: '2025-01-15', status: 'programat', deviceName: 'USG' },
      ],
    };
    render(<CalendarYearView selectedYear={2025} occurrencesByDate={occurrences} />);
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText(/1 eveniment/)).toBeInTheDocument();
  });

  it('shows plural for multiple events on same day', () => {
    const occurrences = {
      '2025-01-15': [
        { scheduledDate: '2025-01-15', status: 'programat', deviceName: 'USG' },
        { scheduledDate: '2025-01-15', status: 'scadent', deviceName: 'Ventilator' },
      ],
    };
    render(<CalendarYearView selectedYear={2025} occurrencesByDate={occurrences} />);
    expect(screen.getByText(/2 evenimente/)).toBeInTheDocument();
  });

  it('shows "+N more" when more than 3 event days', () => {
    const occurrences = {
      '2025-01-05': [{ scheduledDate: '2025-01-05', status: 'programat' }],
      '2025-01-10': [{ scheduledDate: '2025-01-10', status: 'programat' }],
      '2025-01-15': [{ scheduledDate: '2025-01-15', status: 'programat' }],
      '2025-01-20': [{ scheduledDate: '2025-01-20', status: 'programat' }],
    };
    render(<CalendarYearView selectedYear={2025} occurrencesByDate={occurrences} />);
    expect(screen.getByText(/\+1 mai multe/)).toBeInTheDocument();
  });

  it('uses rescheduledTo for event date when available', () => {
    const occurrences = {
      '2025-01-20': [
        { scheduledDate: '2025-01-15', rescheduledTo: '2025-01-20', status: 'programat' },
      ],
    };
    render(<CalendarYearView selectedYear={2025} occurrencesByDate={occurrences} />);
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('renders legend items', () => {
    render(<CalendarYearView selectedYear={2025} />);
    expect(screen.getByText('Programat')).toBeInTheDocument();
    expect(screen.getByText('Scadent')).toBeInTheDocument();
    expect(screen.getByText('Depășit')).toBeInTheDocument();
    expect(screen.getByText('Efectuat')).toBeInTheDocument();
  });

  it('renders with empty occurrencesByDate', () => {
    render(<CalendarYearView selectedYear={2025} occurrencesByDate={{}} />);
    expect(screen.getByText(/Anul 2025/)).toBeInTheDocument();
  });
});
