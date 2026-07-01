import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

describe('UI Components', () => {
  describe('Table', () => {
    it('renders table with data-slot', () => {
      const { container } = render(<Table />);
      expect(container.querySelector('[data-slot="table"]')).toBeInTheDocument();
    });

    it('renders table inside container', () => {
      const { container } = render(<Table />);
      expect(container.querySelector('[data-slot="table-container"]')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<Table className="custom-table" />);
      expect(container.querySelector('.custom-table')).toBeInTheDocument();
    });

    it('renders TableHeader', () => {
      const { container } = render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );
      expect(container.querySelector('[data-slot="table-header"]')).toBeInTheDocument();
    });

    it('renders TableBody', () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(container.querySelector('[data-slot="table-body"]')).toBeInTheDocument();
    });

    it('renders TableFooter', () => {
      const { container } = render(
        <Table>
          <TableFooter>
            <TableRow>
              <TableCell>Footer</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      );
      expect(container.querySelector('[data-slot="table-footer"]')).toBeInTheDocument();
    });

    it('renders TableHead', () => {
      const { container } = render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Header Cell</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );
      expect(container.querySelector('[data-slot="table-head"]')).toBeInTheDocument();
    });

    it('renders TableRow', () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow data-testid="row">
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(container.querySelector('[data-slot="table-row"]')).toBeInTheDocument();
    });

    it('renders TableCell', () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Cell Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(container.querySelector('[data-slot="table-cell"]')).toBeInTheDocument();
      expect(screen.getByText('Cell Content')).toBeInTheDocument();
    });

    it('renders TableCaption', () => {
      const { container } = render(
        <Table>
          <TableCaption>A list of items</TableCaption>
        </Table>
      );
      expect(container.querySelector('[data-slot="table-caption"]')).toBeInTheDocument();
      expect(screen.getByText('A list of items')).toBeInTheDocument();
    });

    it('renders full table structure', () => {
      render(
        <Table>
          <TableCaption>Test table</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Item 1</TableCell>
              <TableCell>100</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Item 2</TableCell>
              <TableCell>200</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>Total</TableCell>
              <TableCell>300</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      );
      expect(screen.getByText('Test table')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('300')).toBeInTheDocument();
    });
  });

  describe('Tabs', () => {
    it('renders tabs container with data-slot', () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );
      expect(container.querySelector('[data-slot="tabs"]')).toBeInTheDocument();
    });

    it('renders tabs list', () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );
      expect(container.querySelector('[data-slot="tabs-list"]')).toBeInTheDocument();
    });

    it('renders tab triggers', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">First</TabsTrigger>
            <TabsTrigger value="tab2">Second</TabsTrigger>
          </TabsList>
        </Tabs>
      );
      expect(screen.getByRole('tab', { name: /first/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /second/i })).toBeInTheDocument();
    });

    it('renders tabs content', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>
      );
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      const { container } = render(
        <Tabs defaultValue="tab1" className="custom-tabs">
          <TabsList>
            <TabsTrigger value="tab1">Tab</TabsTrigger>
          </TabsList>
        </Tabs>
      );
      expect(container.querySelector('.custom-tabs')).toBeInTheDocument();
    });
  });

  describe('Button', () => {
    it('renders with data-slot', () => {
      const { container } = render(<Button>Click</Button>);
      expect(container.querySelector('[data-slot="button"]')).toBeInTheDocument();
    });

    it('supports variant prop', () => {
      render(<Button variant="destructive">Delete</Button>);
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    it('supports size prop', () => {
      render(<Button size="lg">Large</Button>);
      expect(screen.getByRole('button', { name: /large/i })).toBeInTheDocument();
    });

    it('renders as disabled', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button', { name: /disabled/i })).toBeDisabled();
    });

    it('applies custom className', () => {
      render(<Button className="my-btn">Styled</Button>);
      expect(screen.getByRole('button', { name: /styled/i })).toHaveClass('my-btn');
    });
  });

  describe('cn utility', () => {
    it('merges class names', () => {
      const result = cn('foo', 'bar');
      expect(result).toBe('foo bar');
    });

    it('deduplicates classes', () => {
      const result = cn('foo', 'foo', 'bar');
      expect(result).toContain('foo');
      expect(result).toContain('bar');
    });

    it('handles conditional classes', () => {
      const show = false;
      const result = cn('base', show && 'hidden', 'extra');
      expect(result).toContain('base');
      expect(result).toContain('extra');
      expect(result).not.toContain('hidden');
    });
  });
});
