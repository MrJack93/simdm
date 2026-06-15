import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SkipLink from '../../components/SkipLink';

describe('SkipLink', () => {
  it('renders skip link with correct text', () => {
    render(<SkipLink />);
    expect(screen.getByRole('link', { name: /sari la conținut principal/i })).toBeInTheDocument();
  });

  it('has href pointing to #main', () => {
    render(<SkipLink />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '#main');
  });

  it('is invisible by default (not focused)', () => {
    render(<SkipLink />);
    const link = screen.getByRole('link');
    expect(link.className).toContain('invisible');
    expect(link.className).toContain('opacity-0');
  });

  it('becomes visible on focus', () => {
    render(<SkipLink />);
    const link = screen.getByRole('link');
    fireEvent.focus(link);
    expect(link.className).toContain('visible');
    expect(link.className).toContain('opacity-100');
  });

  it('becomes invisible again on blur', () => {
    render(<SkipLink />);
    const link = screen.getByRole('link');
    fireEvent.focus(link);
    fireEvent.blur(link);
    expect(link.className).toContain('invisible');
  });

  it('prevents default and focuses main content', () => {
    const mainDiv = document.createElement('div');
    mainDiv.id = 'main';
    mainDiv.scrollIntoView = vi.fn();
    document.body.appendChild(mainDiv);
    const focusSpy = vi.spyOn(mainDiv, 'focus');

    render(<SkipLink />);
    const link = screen.getByRole('link');
    fireEvent.click(link);

    expect(focusSpy).toHaveBeenCalled();
    document.body.removeChild(mainDiv);
    focusSpy.mockRestore();
  });

  it('scrolls main content into view', () => {
    const mainDiv = document.createElement('div');
    mainDiv.id = 'main';
    mainDiv.scrollIntoView = vi.fn();
    document.body.appendChild(mainDiv);

    render(<SkipLink />);
    fireEvent.click(screen.getByRole('link'));

    expect(mainDiv.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    document.body.removeChild(mainDiv);
  });

  it('handles missing main element gracefully', () => {
    render(<SkipLink />);
    expect(() => fireEvent.click(screen.getByRole('link'))).not.toThrow();
  });
});
