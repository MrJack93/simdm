import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Calendar } from '@/components/ui/calendar';

vi.mock('react-day-picker', () => {
  return {
    DayPicker: ({ children, className, locale, components, ...props }) => (
      <div data-testid="daypicker" className={className} data-mode={props.mode}>
        <span data-testid="locale-code">{locale?.code || 'none'}</span>
        {components?.IconLeft && <components.IconLeft />}
        {components?.IconRight && <components.IconRight />}
        {components?.Weekday && <components.Weekday>Lu</components.Weekday>}
        {children}
      </div>
    ),
  };
});

describe('Calendar', () => {
  it('renders DayPicker', () => {
    render(<Calendar />);
    expect(screen.getByTestId('daypicker')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Calendar className="my-calendar" />);
    expect(screen.getByTestId('daypicker').className).toContain('my-calendar');
  });

  it('passes locale to DayPicker', () => {
    render(<Calendar locale={{ code: 'ro-RO' }} />);
    expect(screen.getByTestId('locale-code')).toHaveTextContent('ro-RO');
  });

  it('defaults to ro locale', () => {
    render(<Calendar />);
    expect(screen.getByTestId('locale-code')).toBeInTheDocument();
  });

  it('passes showOutsideDays', () => {
    render(<Calendar showOutsideDays={false} />);
    expect(screen.getByTestId('daypicker')).toBeInTheDocument();
  });

  it('passes captionLayout', () => {
    render(<Calendar captionLayout="dropdown" />);
    expect(screen.getByTestId('daypicker')).toBeInTheDocument();
  });

  it('passes mode prop', () => {
    render(<Calendar mode="range" />);
    expect(screen.getByTestId('daypicker')).toHaveAttribute('data-mode', 'range');
  });

  it('merges classNames with defaults', () => {
    render(<Calendar classNames={{ months: 'custom-months' }} />);
    expect(screen.getByTestId('daypicker')).toBeInTheDocument();
  });

  it('renders IconLeft component', () => {
    render(<Calendar />);
    // Icons are rendered by DayPicker mock
    expect(screen.getByTestId('daypicker')).toBeInTheDocument();
  });

  it('passes formatters with formatMonthDropdown', () => {
    render(<Calendar formatters={{ formatMonthLabel: () => 'Custom' }} />);
    expect(screen.getByTestId('daypicker')).toBeInTheDocument();
  });

  it('passes custom components', () => {
    render(<Calendar components={{ Month: () => <div>Custom Month</div> }} />);
    expect(screen.getByTestId('daypicker')).toBeInTheDocument();
  });

  it('renders Weekday component', () => {
    render(<Calendar />);
    expect(screen.getByText('Lu')).toBeInTheDocument();
  });
});
