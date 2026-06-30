import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CalendarWeekView } from '../../components/ui/calendar-week-view';

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

describe('CalendarWeekView — T4 ora reală', () => {
  it('poziționează evenimentul la ora UTC reală (14:30)', () => {
    const dateKey = '2026-06-15';
    const occurrencesByDate = { [dateKey]: [makeOcc(14, 30)] };
    render(
      <CalendarWeekView
        selectedDate={baseDate}
        occurrencesByDate={occurrencesByDate}
      />
    );
    const event = screen.getByRole('button', { name: /14:30/ });
    expect(event).toBeInTheDocument();
    expect(event).toHaveAttribute('aria-label', expect.stringContaining('14:30'));
  });

  it('ora 09:00 → slot 9', () => {
    const dateKey = '2026-06-15';
    const occurrencesByDate = { [dateKey]: [makeOcc(9, 0)] };
    render(
      <CalendarWeekView
        selectedDate={baseDate}
        occurrencesByDate={occurrencesByDate}
      />
    );
    expect(screen.getByText('09:00')).toBeInTheDocument();
  });

  it('clamp: ora 07:00 → clamp la 08:00', () => {
    const dateKey = '2026-06-15';
    const occurrencesByDate = { [dateKey]: [makeOcc(7, 0)] };
    render(
      <CalendarWeekView
        selectedDate={baseDate}
        occurrencesByDate={occurrencesByDate}
      />
    );
    expect(screen.getByText('08:00')).toBeInTheDocument();
  });

  it('clamp: ora 18:00 → clamp la 17:00', () => {
    const dateKey = '2026-06-15';
    const occurrencesByDate = { [dateKey]: [makeOcc(18, 0)] };
    render(
      <CalendarWeekView
        selectedDate={baseDate}
        occurrencesByDate={occurrencesByDate}
      />
    );
    expect(screen.getByText('17:00')).toBeInTheDocument();
  });

  it('aria-label conține ora UTC corectă', () => {
    const dateKey = '2026-06-15';
    const occurrencesByDate = { [dateKey]: [makeOcc(14, 30)] };
    render(
      <CalendarWeekView
        selectedDate={baseDate}
        occurrencesByDate={occurrencesByDate}
      />
    );
    const event = screen.getByRole('button', { name: /14:30/ });
    expect(event).toHaveAttribute('aria-label', expect.stringContaining('14:30'));
  });

  it('afișează header-ul săptămânii', () => {
    render(
      <CalendarWeekView
        selectedDate={baseDate}
        occurrencesByDate={{}}
      />
    );
    expect(screen.getByText(/Săptămâna:/)).toBeInTheDocument();
  });

  it('afișează zilele săptămânii în română', () => {
    render(
      <CalendarWeekView
        selectedDate={baseDate}
        occurrencesByDate={{}}
      />
    );
    expect(screen.getByText('Lun')).toBeInTheDocument();
    expect(screen.getByText('Mar')).toBeInTheDocument();
    expect(screen.getByText('Mie')).toBeInTheDocument();
  });

  it('returnează empty state când selectedDate e null', () => {
    render(
      <CalendarWeekView
        selectedDate={null}
        occurrencesByDate={{}}
      />
    );
    expect(screen.getByText(/Selectați o săptămână/)).toBeInTheDocument();
  });
});
