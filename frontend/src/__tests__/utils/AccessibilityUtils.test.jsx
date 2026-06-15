import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  focusStyles,
  SkipLink,
  useKeyboardNavigation,
  checkContrast,
  LiveRegion,
  AccessibleModalBackdrop,
  AccessibleAlert,
  getAccessibleErrorMessage,
} from '../../utils/AccessibilityUtils';

function TestKeyboardNav({ items }) {
  const { focusedIndex, handleKeyDown } = useKeyboardNavigation(items, vi.fn());
  return (
    <div onKeyDown={handleKeyDown} data-testid="nav-container">
      <span data-testid="focused-index">{focusedIndex}</span>
    </div>
  );
}

describe('AccessibilityUtils', () => {
  describe('focusStyles', () => {
    it('exports ring and ringDanger styles', () => {
      expect(focusStyles.ring).toBeDefined();
      expect(focusStyles.ringDanger).toBeDefined();
    });
  });

  describe('SkipLink', () => {
    it('renders skip link with href #main', () => {
      render(<SkipLink />);
      expect(screen.getByRole('link')).toHaveAttribute('href', '#main');
    });

    it('has sr-only class', () => {
      render(<SkipLink />);
      expect(screen.getByRole('link').className).toContain('sr-only');
    });
  });

  describe('checkContrast', () => {
    it('calculates contrast ratio', () => {
      const ratio = checkContrast('#ffffff', '#000000');
      expect(parseFloat(ratio)).toBeGreaterThan(10);
    });

    it('returns low ratio for similar colors', () => {
      const ratio = checkContrast('#ffffff', '#f0f0f0');
      expect(parseFloat(ratio)).toBeLessThan(2);
    });
  });

  describe('LiveRegion', () => {
    it('renders with role and aria-live', () => {
      render(<LiveRegion message="Test message" />);
      const el = screen.getByRole('status');
      expect(el).toHaveAttribute('aria-live', 'polite');
      expect(el).toHaveTextContent('Test message');
    });

    it('supports assertive level', () => {
      render(<LiveRegion message="Alert" level="assertive" role="alert" />);
      const el = screen.getByRole('alert');
      expect(el).toHaveAttribute('aria-live', 'assertive');
    });
  });

  describe('AccessibleAlert', () => {
    it('renders error alert', () => {
      render(<AccessibleAlert type="error" message="Error occurred" />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Error occurred')).toBeInTheDocument();
    });

    it('renders success alert', () => {
      render(<AccessibleAlert type="success" message="Success" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('renders title when provided', () => {
      render(<AccessibleAlert type="info" title="Info Title" message="Info message" />);
      expect(screen.getByText('Info Title')).toBeInTheDocument();
    });

    it('renders dismiss button when onDismiss provided', () => {
      const onDismiss = vi.fn();
      render(<AccessibleAlert type="info" message="Test" onDismiss={onDismiss} />);
      expect(screen.getByRole('button', { name: /închide/i })).toBeInTheDocument();
    });

    it('calls onDismiss when button clicked', () => {
      const onDismiss = vi.fn();
      render(<AccessibleAlert type="info" message="Test" onDismiss={onDismiss} />);
      fireEvent.click(screen.getByRole('button', { name: /închide/i }));
      expect(onDismiss).toHaveBeenCalled();
    });

    it('does not render dismiss button without onDismiss', () => {
      render(<AccessibleAlert type="info" message="Test" />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('getAccessibleErrorMessage', () => {
    it('returns required message', () => {
      expect(getAccessibleErrorMessage('Nume', 'required')).toBe('Nume este obligatoriu');
    });

    it('returns email message', () => {
      expect(getAccessibleErrorMessage('Email', 'email')).toBe('Introduceți o adresă de e-mail validă');
    });

    it('returns minLength message', () => {
      expect(getAccessibleErrorMessage('Parola', 'minLength')).toBe('Parola este prea scurt');
    });

    it('returns fallback for unknown type', () => {
      expect(getAccessibleErrorMessage('Test', 'unknown')).toBe('Format invalid');
    });
  });

  describe('AccessibleModalBackdrop', () => {
    it('renders nothing when not open', () => {
      const { container } = render(
        <AccessibleModalBackdrop isOpen={false} onClose={vi.fn()}>
          <div>Content</div>
        </AccessibleModalBackdrop>
      );
      expect(container.innerHTML).toBe('');
    });

    it('renders dialog when open', () => {
      render(
        <AccessibleModalBackdrop isOpen={true} onClose={vi.fn()}>
          <div>Modal Content</div>
        </AccessibleModalBackdrop>
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });

    it('calls onClose when backdrop clicked', () => {
      const onClose = vi.fn();
      render(
        <AccessibleModalBackdrop isOpen={true} onClose={onClose}>
          <div>Content</div>
        </AccessibleModalBackdrop>
      );
      fireEvent.click(screen.getByRole('presentation'));
      expect(onClose).toHaveBeenCalled();
    });

    it('does not close when content clicked', () => {
      const onClose = vi.fn();
      render(
        <AccessibleModalBackdrop isOpen={true} onClose={onClose}>
          <div>Content</div>
        </AccessibleModalBackdrop>
      );
      fireEvent.click(screen.getByText('Content'));
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('useKeyboardNavigation', () => {
    it('starts with focusedIndex 0', () => {
      render(<TestKeyboardNav items={['a', 'b', 'c']} />);
      expect(screen.getByTestId('focused-index')).toHaveTextContent('0');
    });
  });
});
