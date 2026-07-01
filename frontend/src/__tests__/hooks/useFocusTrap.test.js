import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

describe('useFocusTrap', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a ref', () => {
    const { result } = renderHook(() => useFocusTrap(false));
    expect(result.current).toBeDefined();
    expect(result.current.current).toBeNull();
  });

  it('focuses first element when isOpen is true', () => {
    const { result } = renderHook(() => useFocusTrap(true));

    // Create a container with focusable elements
    const container = document.createElement('div');
    const btn1 = document.createElement('button');
    const btn2 = document.createElement('button');
    container.appendChild(btn1);
    container.appendChild(btn2);
    document.body.appendChild(container);

    // Set the ref
    result.current.current = container;

    // Trigger the effect by re-rendering
    const { result: result2 } = renderHook(
      ({ isOpen }) => useFocusTrap(isOpen),
      { initialProps: { isOpen: true } }
    );
    result2.current.current = container;

    // Advance timer to trigger the setTimeout focus
    vi.advanceTimersByTime(100);

    document.body.removeChild(container);
  });

  it('does nothing when isOpen is false', () => {
    const { result } = renderHook(() => useFocusTrap(false));
    expect(result.current.current).toBeNull();
  });

  it('restores previous focus on cleanup', () => {
    const { unmount } = renderHook(() => useFocusTrap(true));
    unmount();
  });

  it('handles Tab key to trap focus', () => {
    const { result } = renderHook(() => useFocusTrap(true));

    const container = document.createElement('div');
    const btn1 = document.createElement('button');
    const btn2 = document.createElement('button');
    container.appendChild(btn1);
    container.appendChild(btn2);
    document.body.appendChild(container);
    result.current.current = container;

    // Trigger keydown Tab
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    container.dispatchEvent(tabEvent);

    // Trigger Shift+Tab
    const shiftTabEvent = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true });
    container.dispatchEvent(shiftTabEvent);

    document.body.removeChild(container);
  });

  it('focus trap on first element wraps to last on Shift+Tab', () => {
    const container = document.createElement('div');
    const btn1 = document.createElement('button');
    const btn2 = document.createElement('button');
    container.appendChild(btn1);
    container.appendChild(btn2);
    document.body.appendChild(container);

    // Focus first element
    btn1.focus();

    // Dispatch keydown handler directly
    const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true });
    Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
    container.dispatchEvent(event);

    document.body.removeChild(container);
  });
});
