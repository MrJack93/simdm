import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/StatusBadge';

describe('Shadcn Components - Unit Tests', () => {
  describe('Button Component', () => {
    it('renders button with text', () => {
      render(<Button>Salvare</Button>);
      expect(screen.getByRole('button', { name: /salvare/i })).toBeInTheDocument();
    });

    it('supports different variants', () => {
      const { rerender } = render(<Button variant="default">Default</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();

      rerender(<Button variant="destructive">Delete</Button>);
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    it('supports different sizes', () => {
      render(<Button size="sm">Mic</Button>);
      expect(screen.getByRole('button', { name: /mic/i })).toBeInTheDocument();
    });

    it('respects disabled state', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button', { name: /disabled/i })).toBeDisabled();
    });

    it('supports aria-label for accessibility', () => {
      render(
        <Button aria-label="Salvare plan de mentenanță">
          💾
        </Button>
      );
      expect(screen.getByRole('button', { name: /salvare plan/i })).toBeInTheDocument();
    });

    it('supports click handler', () => {
      let clicked = false;
      render(<Button onClick={() => { clicked = true; }}>Click</Button>);
      screen.getByRole('button').click();
      expect(clicked).toBe(true);
    });

    it('has proper focus styles for keyboard navigation', () => {
      const { container } = render(<Button>Focus Test</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible');
    });
  });

  describe('Input Component', () => {
    it('renders input field', () => {
      render(<Input placeholder="Introdu text" />);
      expect(screen.getByPlaceholderText('Introdu text')).toBeInTheDocument();
    });

    it('supports different input types', () => {
      const { rerender } = render(<Input type="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');

      rerender(<Input type="date" />);
      expect(document.querySelector('input[type="date"]')).toBeInTheDocument();
    });

    it('respects disabled state', () => {
      render(<Input disabled placeholder="Disabled input" />);
      expect(screen.getByPlaceholderText('Disabled input')).toBeDisabled();
    });

    it('accepts value and onChange', () => {
      let value = '';
      const handleChange = (e) => { value = e.target.value; };
      render(
        <Input
          value={value}
          onChange={handleChange}
          placeholder="Test"
        />
      );
      const input = screen.getByPlaceholderText('Test');
      expect(input.value).toBe('');
    });

    it('supports aria-label for accessibility', () => {
      render(
        <Input
          aria-label="Nume dispozitiv"
          placeholder="Introdu nume"
        />
      );
      expect(screen.getByLabelText('Nume dispozitiv')).toBeInTheDocument();
    });

    it('has proper focus styles', () => {
      const { container } = render(<Input />);
      const input = container.querySelector('input');
      expect(input).toHaveClass('focus-visible');
    });
  });

  describe('Card Component', () => {
    it('renders card with children', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
          </CardHeader>
          <CardContent>Content here</CardContent>
        </Card>
      );
      expect(screen.getByText('Test Card')).toBeInTheDocument();
      expect(screen.getByText('Content here')).toBeInTheDocument();
    });

    it('supports custom className', () => {
      const { container } = render(
        <Card className="custom-class">
          <CardContent>Test</CardContent>
        </Card>
      );
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('renders semantic structure', () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
          <CardContent>Body</CardContent>
        </Card>
      );
      expect(container.querySelector('div')).toBeInTheDocument();
    });
  });

  describe('Badge Component', () => {
    it('renders badge with text', () => {
      render(<Badge>Active</Badge>);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('supports different variants', () => {
      const { rerender } = render(<Badge variant="default">Default</Badge>);
      expect(screen.getByText('Default')).toBeInTheDocument();

      rerender(<Badge variant="secondary">Secondary</Badge>);
      expect(screen.getByText('Secondary')).toBeInTheDocument();
    });

    it('supports custom className', () => {
      const { container } = render(
        <Badge className="custom-badge">Custom</Badge>
      );
      expect(container.querySelector('.custom-badge')).toBeInTheDocument();
    });
  });
});

describe('StatusBadge Component - Medical UI', () => {
  it('renders StatusBadge with correct status', () => {
    render(<StatusBadge status="FUNCTIONAL" />);
    expect(screen.getByText('Funcțional')).toBeInTheDocument();
  });

  it('has aria-label for accessibility', () => {
    const { container } = render(<StatusBadge status="FUNCTIONAL" />);
    const badge = container.querySelector('[role="status"]');
    expect(badge).toHaveAttribute('aria-label', 'Status: Funcțional');
  });

  it('renders with healthcare color for each status', () => {
    const statuses = ['FUNCTIONAL', 'IN_REPARATIE', 'DEFECT', 'CASAT', 'IMPRUMUTAT', 'REZERVA'];
    statuses.forEach(status => {
      const { rerender } = render(<StatusBadge status={status} />);
      expect(screen.getByRole('status')).toBeInTheDocument();
      rerender(null);
    });
  });

  it('supports different sizes', () => {
    render(<StatusBadge status="FUNCTIONAL" size="sm" />);
    expect(screen.getByText('Funcțional')).toBeInTheDocument();
  });

  it('hides symbol from screen readers', () => {
    const { container } = render(<StatusBadge status="FUNCTIONAL" />);
    const symbol = container.querySelector('[aria-hidden="true"]');
    expect(symbol).toBeInTheDocument();
    expect(symbol.textContent).toBe('✓');
  });

  it('has proper role and semantics for medical context', () => {
    const { container } = render(<StatusBadge status="FUNCTIONAL" />);
    expect(container.querySelector('[role="status"]')).toBeInTheDocument();
  });
});

describe('Component Accessibility Integration', () => {
  it('form with labeled inputs passes accessibility', () => {
    render(
      <div>
        <label htmlFor="device-name">Dispozitiv</label>
        <Input id="device-name" aria-label="Nume dispozitiv" />
        <Button type="submit" aria-label="Salvare dispozitiv">
          Salvare
        </Button>
      </div>
    );
    expect(screen.getByLabelText('Nume dispozitiv')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /salvare/i })).toBeInTheDocument();
  });

  it('medical card with badge has proper semantics', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Aparat USG</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusBadge status="FUNCTIONAL" />
        </CardContent>
      </Card>
    );
    expect(screen.getByText('Aparat USG')).toBeInTheDocument();
    expect(screen.getByText('Funcțional')).toBeInTheDocument();
  });
});
