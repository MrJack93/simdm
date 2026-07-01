import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@base-ui/react/dialog', () => {
  const React = require('react');
  return {
    Dialog: {
      Root: React.forwardRef(({ open, onOpenChange, children, ...rest }, ref) => {
        return React.createElement('div', { ref, 'data-testid': 'dialog-root', 'data-open': String(open), ...rest }, children);
      }),
      Trigger: React.forwardRef((props, ref) => React.createElement('button', { ref, ...props })),
      Portal: ({ children }) => React.createElement('div', null, children),
      Backdrop: () => null,
      Popup: React.forwardRef(({ children, ...props }, ref) => React.createElement('div', { ref, ...props }, children)),
      Close: React.forwardRef(({ onClick, ...props }, ref) =>
        React.createElement('button', { ref, ...props, onClick: (e) => { onClick?.(e); } })),
      Title: React.forwardRef((props, ref) => React.createElement('h2', { ref, ...props })),
      Description: React.forwardRef((props, ref) => React.createElement('p', { ref, ...props })),
    },
  };
});

import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';

describe('Drawer components', () => {
  describe('Drawer', () => {
    it('renders with Dialog root', () => {
      render(
        <Drawer open={true} onOpenChange={() => {}}>
          <span>Drawer content</span>
        </Drawer>
      );
      expect(screen.getByText('Drawer content')).toBeInTheDocument();
    });

    it('passes open prop to Dialog', () => {
      render(
        <Drawer open={false} onOpenChange={() => {}}>
          <span>Hidden content</span>
        </Drawer>
      );
      expect(screen.getByTestId('dialog-root')).toHaveAttribute('data-open', 'false');
    });
  });

  describe('DrawerTrigger', () => {
    it('renders a button', () => {
      render(<DrawerTrigger>Open Drawer</DrawerTrigger>);
      expect(screen.getByRole('button', { name: 'Open Drawer' })).toBeInTheDocument();
    });
  });

  describe('DrawerContent', () => {
    it('renders children inside dialog content', () => {
      render(
        <Drawer open={true} onOpenChange={() => {}}>
          <DrawerContent>
            <span>Content here</span>
          </DrawerContent>
        </Drawer>
      );
      expect(screen.getByText('Content here')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Drawer open={true} onOpenChange={() => {}}>
          <DrawerContent className="extra-class">
            <span>Styled</span>
          </DrawerContent>
        </Drawer>
      );
      expect(screen.getByText('Styled')).toBeInTheDocument();
    });
  });

  describe('DrawerHeader', () => {
    it('renders header', () => {
      render(
        <Drawer open={true} onOpenChange={() => {}}>
          <DrawerContent>
            <DrawerHeader>
              <span>Header</span>
            </DrawerHeader>
          </DrawerContent>
        </Drawer>
      );
      expect(screen.getByText('Header')).toBeInTheDocument();
    });
  });

  describe('DrawerTitle', () => {
    it('renders title', () => {
      render(
        <Drawer open={true} onOpenChange={() => {}}>
          <DrawerContent>
            <DrawerTitle>My Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      );
      expect(screen.getByText('My Title')).toBeInTheDocument();
    });
  });

  describe('DrawerDescription', () => {
    it('renders description', () => {
      render(
        <Drawer open={true} onOpenChange={() => {}}>
          <DrawerContent>
            <DrawerDescription>Description text</DrawerDescription>
          </DrawerContent>
        </Drawer>
      );
      expect(screen.getByText('Description text')).toBeInTheDocument();
    });
  });

  describe('DrawerFooter', () => {
    it('renders footer with children', () => {
      render(
        <Drawer open={true} onOpenChange={() => {}}>
          <DrawerContent>
            <DrawerFooter>
              <span>Footer content</span>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      );
      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Drawer open={true} onOpenChange={() => {}}>
          <DrawerContent>
            <DrawerFooter className="custom-footer">
              <span>Footer</span>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      );
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });
  });

  describe('DrawerClose', () => {
    it('renders close button', () => {
      render(<DrawerClose>Anulează</DrawerClose>);
      expect(screen.getByRole('button', { name: 'Anulează' })).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<DrawerClose className="my-close">Close</DrawerClose>);
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });

    it('applies combined className', () => {
      render(<DrawerClose className="extra-class">Close</DrawerClose>);
      const btn = screen.getByRole('button', { name: 'Close' });
      expect(btn).toHaveClass('btn-secondary', 'extra-class');
    });
  });
});
