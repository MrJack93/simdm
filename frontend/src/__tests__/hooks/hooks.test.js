import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useAccessibility } from '../../hooks/useAccessibility';

describe('usePageTitle', () => {
  afterEach(() => {
    document.title = '';
  });

  it('sets document title with SIMDM suffix', () => {
    renderHook(() => usePageTitle('Dashboard'));
    expect(document.title).toBe('Dashboard — SIMDM');
  });

  it('updates title when title prop changes', () => {
    const { rerender } = renderHook(
      ({ title }) => usePageTitle(title),
      { initialProps: { title: 'Page 1' } }
    );
    expect(document.title).toBe('Page 1 — SIMDM');

    rerender({ title: 'Page 2' });
    expect(document.title).toBe('Page 2 — SIMDM');
  });
});

describe('useAccessibility', () => {
  it('returns announce and trapFocus functions', () => {
    const { result } = renderHook(() => useAccessibility());
    expect(typeof result.current.announce).toBe('function');
    expect(typeof result.current.trapFocus).toBe('function');
  });

  describe('announce', () => {
    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('creates a status element with aria-live', () => {
      const { result } = renderHook(() => useAccessibility());
      act(() => {
        result.current.announce('Test message');
      });

      const el = document.querySelector('[role="status"][aria-live="polite"]');
      expect(el).toBeInTheDocument();
      expect(el.textContent).toBe('Test message');
      expect(el.className).toContain('sr-only');
    });

    it('removes the element after 1 second', () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useAccessibility());
      act(() => {
        result.current.announce('Temp message');
      });

      const el = document.querySelector('[role="status"]');
      expect(el).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(document.querySelector('[role="status"]')).not.toBeInTheDocument();
      vi.useRealTimers();
    });
  });

  describe('trapFocus', () => {
    it('returns cleanup function', () => {
      const { result } = renderHook(() => useAccessibility());
      const containerRef = { current: document.createElement('div') };
      const cleanup = result.current.trapFocus(containerRef);
      expect(typeof cleanup).toBe('function');
    });

    it('does nothing with null ref', () => {
      const { result } = renderHook(() => useAccessibility());
      expect(() => result.current.trapFocus({ current: null })).not.toThrow();
    });

    it('wraps focus from last to first element on Tab', () => {
      const { result } = renderHook(() => useAccessibility());
      const container = document.createElement('div');
      const btn1 = document.createElement('button');
      const btn2 = document.createElement('button');
      container.appendChild(btn1);
      container.appendChild(btn2);
      document.body.appendChild(container);

      const containerRef = { current: container };
      const cleanup = result.current.trapFocus(containerRef);

      btn2.focus();
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      Object.defineProperty(tabEvent, 'preventDefault', { value: vi.fn() });
      container.dispatchEvent(tabEvent);

      expect(tabEvent.preventDefault).toHaveBeenCalled();

      cleanup();
      document.body.removeChild(container);
    });

    it('wraps focus from first to last on Shift+Tab', () => {
      const { result } = renderHook(() => useAccessibility());
      const container = document.createElement('div');
      const btn1 = document.createElement('button');
      const btn2 = document.createElement('button');
      container.appendChild(btn1);
      container.appendChild(btn2);
      document.body.appendChild(container);

      const containerRef = { current: container };
      const cleanup = result.current.trapFocus(containerRef);

      btn1.focus();
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true });
      Object.defineProperty(tabEvent, 'preventDefault', { value: vi.fn() });
      container.dispatchEvent(tabEvent);

      expect(tabEvent.preventDefault).toHaveBeenCalled();

      cleanup();
      document.body.removeChild(container);
    });

    it('does not prevent default for non-Tab keys', () => {
      const { result } = renderHook(() => useAccessibility());
      const container = document.createElement('div');
      const btn1 = document.createElement('button');
      container.appendChild(btn1);
      document.body.appendChild(container);

      const containerRef = { current: container };
      const cleanup = result.current.trapFocus(containerRef);

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      Object.defineProperty(enterEvent, 'preventDefault', { value: vi.fn() });
      container.dispatchEvent(enterEvent);

      expect(enterEvent.preventDefault).not.toHaveBeenCalled();

      cleanup();
      document.body.removeChild(container);
    });
  });
});
