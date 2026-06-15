import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Alert from '../../components/Alert';

describe('Alert', () => {
  it('renders children content', () => {
    render(<Alert>Test message</Alert>);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('applies correct role for info type', () => {
    render(<Alert type="info">Info</Alert>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('applies correct role for error type', () => {
    render(<Alert type="error">Error</Alert>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('applies correct role for success type', () => {
    render(<Alert type="success">Success</Alert>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('applies correct role for warning type', () => {
    render(<Alert type="warning">Warning</Alert>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('does not render dismiss button by default', () => {
    render(<Alert>No dismiss</Alert>);
    expect(screen.queryByRole('button', { name: /închide alerta/i })).not.toBeInTheDocument();
  });

  it('renders dismiss button when dismissible is true', () => {
    render(<Alert dismissible onDismiss={vi.fn()}>Dismissible</Alert>);
    expect(screen.getByRole('button', { name: /închide alerta/i })).toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    const onDismiss = vi.fn();
    render(<Alert dismissible onDismiss={onDismiss}>Click me</Alert>);
    fireEvent.click(screen.getByRole('button', { name: /închide alerta/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('falls back to info config for unknown type', () => {
    render(<Alert type="unknown">Unknown type</Alert>);
    expect(screen.getByText('Unknown type')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Alert className="custom-class">Styled</Alert>);
    expect(container.firstChild.className).toContain('custom-class');
  });
});
