import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CalendarDayView } from '../../components/ui/calendar-day-view';

const baseDate = new Date('2026-06-15T00:00:00.000Z');

function makeOcc(hour, min = 0, overrides = {}) {
  const iso = new Date(Date.UTC(2026, 5, 15, hour, min, 0, 0)).toISOString();
  return {
    id: `occ-${hour}-${min}`,
    scheduledDate: iso,
    status: 'PROGRAMAT',
    deviceName: `Device ${hour}:${String(min).padStart(2, '0')}`,
    ...overrides,
  };
}

describe('CalendarDayView — T3 ora reală', () => {
  it('poziționează evenimentul la ora UTC reală (14:30 → slot 14)', () => {
    const occurrences = [makeOcc(14, 30)];
    render(<CalendarDayView selectedDate={baseDate} occurrences={occurrences} />);
    expect(screen.getByText('14:30')).toBeInTheDocument();
  });

  it('ora 09:00 → slot 9', () => {
    const occurrences = [makeOcc(9, 0)];
    render(<CalendarDayView selectedDate={baseDate} occurrences={occurrences} />);
    const times = screen.getAllByText('09:00');
    expect(times.length).toBeGreaterThanOrEqual(2);
  });

  it('clamp: ora 07:00 (sub fereastra vizibilă) → clamp la 08:00', () => {
    const occurrences = [makeOcc(7, 0)];
    render(<CalendarDayView selectedDate={baseDate} occurrences={occurrences} />);
    expect(screen.getByText('08:00')).toBeInTheDocument();
  });

  it('clamp: ora 18:00 (peste fereastra vizibilă) → clamp la 17:00', () => {
    const occurrences = [makeOcc(18, 0)];
    render(<CalendarDayView selectedDate={baseDate} occurrences={occurrences} />);
    expect(screen.getByText('17:00')).toBeInTheDocument();
  });

  it('aria-label conține ora UTC corectă', () => {
    const occurrences = [makeOcc(14, 30)];
    render(<CalendarDayView selectedDate={baseDate} occurrences={occurrences} />);
    const event = screen.getByRole('button', { name: /14:30/ });
    expect(event).toHaveAttribute('aria-label', expect.stringContaining('14:30'));
  });

  it('afișează header cu data selectată', () => {
    render(<CalendarDayView selectedDate={baseDate} occurrences={[]} />);
    expect(screen.getByText(/15 iunie 2026/)).toBeInTheDocument();
  });

  it('afișează numărul de evenimente', () => {
    const occurrences = [makeOcc(9), makeOcc(10)];
    render(<CalendarDayView selectedDate={baseDate} occurrences={occurrences} />);
    expect(screen.getByText(/2 evenimente/)).toBeInTheDocument();
  });

  it('legendă prezentă când există evenimente', () => {
    const occurrences = [makeOcc(9)];
    render(<CalendarDayView selectedDate={baseDate} occurrences={occurrences} />);
    expect(screen.getByText('Programat')).toBeInTheDocument();
    expect(screen.getByText('Scadent')).toBeInTheDocument();
  });

  it('returnează empty state când selectedDate e null', () => {
    render(<CalendarDayView selectedDate={null} occurrences={[]} />);
    expect(screen.getByText(/Selectați o zi/)).toBeInTheDocument();
  });
});
