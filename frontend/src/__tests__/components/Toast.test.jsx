import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Toast from '../../components/Toast';

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders message', () => {
    render(<Toast message="Test toast" />);
    expect(screen.getByText('Test toast')).toBeInTheDocument();
  });

  it('has status role and aria-live', () => {
    render(<Toast message="Alert" />);
    const toast = screen.getByRole('status');
    expect(toast).toHaveAttribute('aria-live', 'polite');
  });

  it('renders dismiss button with accessible label', () => {
    render(<Toast message="Test" />);
    expect(screen.getByRole('button', { name: /închide/i })).toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    const onDismiss = vi.fn();
    render(<Toast message="Click to close" onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole('button', { name: /închide/i }));
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(onDismiss).toHaveBeenCalled();
  });

  it('auto-dismisses success toast after 3s', () => {
    const onDismiss = vi.fn();
    render(<Toast type="success" message="Saved" onDismiss={onDismiss} />);
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(onDismiss).toHaveBeenCalled();
  });

  it('auto-dismisses info toast after 3s', () => {
    const onDismiss = vi.fn();
    render(<Toast type="info" message="Info" onDismiss={onDismiss} />);
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(onDismiss).toHaveBeenCalled();
  });

  it('auto-dismisses warning toast after 5s', () => {
    const onDismiss = vi.fn();
    render(<Toast type="warning" message="Warning" onDismiss={onDismiss} />);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(onDismiss).toHaveBeenCalled();
  });

  it('does not auto-dismiss error toast', () => {
    const onDismiss = vi.fn();
    render(<Toast type="error" message="Error" onDismiss={onDismiss} />);
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('respects custom duration', () => {
    const onDismiss = vi.fn();
    render(<Toast message="Custom" duration={1000} onDismiss={onDismiss} />);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(onDismiss).toHaveBeenCalled();
  });

  it('applies custom className', () => {
    const { container } = render(<Toast message="Styled" className="my-toast" />);
    expect(container.firstChild.className).toContain('my-toast');
  });

  it('falls back to info config for unknown type', () => {
    render(<Toast type="unknown" message="Fallback" />);
    expect(screen.getByText('Fallback')).toBeInTheDocument();
  });
});
