import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ErrorBoundary, useErrorHandler } from '../../components/ErrorBoundary';

function ThrowingComponent({ shouldThrow }) {
  if (shouldThrow) throw new Error('Test error');
  return <div>Normal content</div>;
}

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  it('renders fallback UI when child throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('A apărut o eroare')).toBeInTheDocument();
    expect(screen.getByText('Încearcă din nou')).toBeInTheDocument();
    expect(screen.getByText('Mergi la start')).toBeInTheDocument();
    spy.mockRestore();
  });

  it('calls onReset when reset button is clicked', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onReset = vi.fn();
    render(
      <ErrorBoundary onReset={onReset}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    fireEvent.click(screen.getByText('Încearcă din nou'));
    expect(onReset).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('shows error ID', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText(/ID eroare:/)).toBeInTheDocument();
    spy.mockRestore();
  });

  it('links to home page', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByRole('link', { name: /mergi la start/i })).toHaveAttribute('href', '/');
    spy.mockRestore();
  });

  it('increments errorCount on multiple errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { unmount } = render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('A apărut o eroare')).toBeInTheDocument();
    unmount();

    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('A apărut o eroare')).toBeInTheDocument();
    spy.mockRestore();
  });
});

describe('useErrorHandler', () => {
  it('returns a function that rethrows errors', () => {
    function TestComponent({ onError }) {
      const errorHandler = useErrorHandler();
      return (
        <button onClick={() => {
          try {
            errorHandler(new Error('handled'));
          } catch (e) {
            onError(e);
          }
        }}>
          Trigger
        </button>
      );
    }

    const onError = vi.fn();
    render(<TestComponent onError={onError} />);
    fireEvent.click(screen.getByRole('button', { name: /trigger/i }));
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'handled' }));
  });
});
