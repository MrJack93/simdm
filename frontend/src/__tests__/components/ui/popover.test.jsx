import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

describe('Popover components', () => {
  describe('Popover', () => {
    it('renders children wrapper', () => {
      render(
        <Popover>
          <span>inner content</span>
        </Popover>
      );
      expect(screen.getByText('inner content')).toBeInTheDocument();
    });
  });

  describe('PopoverTrigger', () => {
    it('renders a button by default', () => {
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );
      expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument();
    });

    it('passes extra props to button', () => {
      render(
        <Popover>
          <PopoverTrigger data-testid="trigger-btn" aria-label="Open popover">Open</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );
      expect(screen.getByTestId('trigger-btn')).toBeInTheDocument();
    });

    it('renders children directly when asChild with element child', () => {
      render(
        <Popover>
          <PopoverTrigger asChild>
            <button data-testid="custom-trigger">Custom</button>
          </PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );
      expect(screen.getByTestId('custom-trigger')).toBeInTheDocument();
    });
  });

  describe('PopoverContent', () => {
    it('toggles open/close on its internal trigger (?) button click', () => {
      render(
        <Popover>
          <PopoverContent>Popover body</PopoverContent>
        </Popover>
      );
      expect(screen.queryByText('Popover body')).not.toBeInTheDocument();
      fireEvent.click(screen.getByText('?'));
      expect(screen.getByText('Popover body')).toBeInTheDocument();
      fireEvent.click(screen.getByText('?'));
      expect(screen.queryByText('Popover body')).not.toBeInTheDocument();
    });

    it('opens and shows side classes - top', () => {
      render(
        <Popover>
          <PopoverContent side="top">Top content</PopoverContent>
        </Popover>
      );
      fireEvent.click(screen.getByText('?'));
      const content = screen.getByText('Top content');
      expect(content.className).toContain('bottom-full');
    });

    it('opens and shows side classes - left', () => {
      render(
        <Popover>
          <PopoverContent side="left">Left content</PopoverContent>
        </Popover>
      );
      fireEvent.click(screen.getByText('?'));
      const content = screen.getByText('Left content');
      expect(content.className).toContain('right-full');
    });

    it('opens and shows side classes - right', () => {
      render(
        <Popover>
          <PopoverContent side="right">Right content</PopoverContent>
        </Popover>
      );
      fireEvent.click(screen.getByText('?'));
      const content = screen.getByText('Right content');
      expect(content.className).toContain('left-full');
    });

    it('applies custom className to content', () => {
      render(
        <Popover>
          <PopoverContent className="custom-popover">Content</PopoverContent>
        </Popover>
      );
      fireEvent.click(screen.getByText('?'));
      const content = screen.getByText('Content');
      expect(content.className).toContain('custom-popover');
    });

    it('closes when clicking outside', () => {
      render(
        <div>
          <Popover>
            <PopoverContent>Inner</PopoverContent>
          </Popover>
          <div data-testid="outside">Outside</div>
        </div>
      );
      fireEvent.click(screen.getByText('?'));
      expect(screen.getByText('Inner')).toBeInTheDocument();
      fireEvent.mouseDown(screen.getByTestId('outside'));
      expect(screen.queryByText('Inner')).not.toBeInTheDocument();
    });

    it('default side is bottom', () => {
      render(
        <Popover>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );
      fireEvent.click(screen.getByText('?'));
      const content = screen.getByText('Content');
      expect(content.className).toContain('top-full');
    });

    it('does not render content when closed', () => {
      render(
        <Popover>
          <PopoverContent>Hidden</PopoverContent>
        </Popover>
      );
      expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
    });
  });
});
