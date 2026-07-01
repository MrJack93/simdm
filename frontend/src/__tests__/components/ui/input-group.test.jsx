import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
  InputGroupText,
  InputGroupButton,
} from '@/components/ui/input-group';

describe('InputGroup components', () => {
  describe('InputGroup', () => {
    it('renders with data-slot', () => {
      const { container } = render(<InputGroup />);
      expect(container.querySelector('[data-slot="input-group"]')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<InputGroup className="custom-group" />);
      expect(container.querySelector('.custom-group')).toBeInTheDocument();
    });

    it('renders children', () => {
      render(
        <InputGroup>
          <span>Inner content</span>
        </InputGroup>
      );
      expect(screen.getByText('Inner content')).toBeInTheDocument();
    });
  });

  describe('InputGroupAddon', () => {
    it('renders with data-slot', () => {
      const { container } = render(<InputGroupAddon />);
      expect(container.querySelector('[data-slot="input-group-addon"]')).toBeInTheDocument();
    });

    it('applies align start class', () => {
      const { container } = render(<InputGroupAddon align="start" />);
      const addon = container.querySelector('[data-slot="input-group-addon"]');
      expect(addon.className).toContain('mr-1');
    });

    it('applies align end class', () => {
      const { container } = render(<InputGroupAddon align="end" />);
      const addon = container.querySelector('[data-slot="input-group-addon"]');
      expect(addon.className).toContain('ml-1');
    });

    it('applies custom className', () => {
      const { container } = render(<InputGroupAddon className="extra-addon" />);
      expect(container.querySelector('.extra-addon')).toBeInTheDocument();
    });
  });

  describe('InputGroupInput', () => {
    it('renders input with data-slot', () => {
      const { container } = render(<InputGroupInput />);
      expect(container.querySelector('[data-slot="input-group-input"]')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<InputGroupInput className="custom-input" />);
      expect(container.querySelector('.custom-input')).toBeInTheDocument();
    });

    it('forwards props', () => {
      render(<InputGroupInput placeholder="Type here" />);
      expect(screen.getByPlaceholderText('Type here')).toBeInTheDocument();
    });
  });

  describe('InputGroupTextarea', () => {
    it('renders textarea with data-slot', () => {
      const { container } = render(<InputGroupTextarea />);
      expect(container.querySelector('[data-slot="input-group-textarea"]')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<InputGroupTextarea className="custom-textarea" />);
      expect(container.querySelector('.custom-textarea')).toBeInTheDocument();
    });

    it('forwards props', () => {
      render(<InputGroupTextarea placeholder="Write here" rows={3} />);
      expect(screen.getByPlaceholderText('Write here')).toBeInTheDocument();
    });
  });

  describe('InputGroupText', () => {
    it('renders span with data-slot', () => {
      const { container } = render(<InputGroupText />);
      expect(container.querySelector('[data-slot="input-group-text"]')).toBeInTheDocument();
    });

    it('renders children', () => {
      render(<InputGroupText>Text content</InputGroupText>);
      expect(screen.getByText('Text content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<InputGroupText className="extra-text" />);
      expect(container.querySelector('.extra-text')).toBeInTheDocument();
    });
  });

  describe('InputGroupButton', () => {
    it('renders button with data-slot', () => {
      const { container } = render(<InputGroupButton />);
      expect(container.querySelector('[data-slot="input-group-button"]')).toBeInTheDocument();
    });

    it('default variant is ghost', () => {
      const { container } = render(<InputGroupButton />);
      const btn = container.querySelector('[data-slot="input-group-button"]');
      expect(btn.className).toContain('hover:bg-muted');
    });

    it('default size is icon-sm', () => {
      const { container } = render(<InputGroupButton />);
      const btn = container.querySelector('[data-slot="input-group-button"]');
      expect(btn.className).toContain('h-6 w-6');
    });

    it('applies icon size', () => {
      const { container } = render(<InputGroupButton size="icon" />);
      const btn = container.querySelector('[data-slot="input-group-button"]');
      expect(btn.className).toContain('h-8 w-8');
    });

    it('applies custom className', () => {
      const { container } = render(<InputGroupButton className="my-btn" />);
      expect(container.querySelector('.my-btn')).toBeInTheDocument();
    });

    it('renders children', () => {
      render(<InputGroupButton>Click</InputGroupButton>);
      expect(screen.getByText('Click')).toBeInTheDocument();
    });
  });
});
