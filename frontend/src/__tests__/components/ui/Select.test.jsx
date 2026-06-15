import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

describe('Select UI Components', () => {
  it('renders Select with trigger', () => {
    render(
      <Select value="a" onValueChange={() => {}}>
        <SelectTrigger>
          <SelectValue placeholder="Choose" />
        </SelectTrigger>
      </Select>
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders SelectTrigger', () => {
    render(
      <Select value="a" onValueChange={() => {}}>
        <SelectTrigger>
          <SelectValue placeholder="Choose" />
        </SelectTrigger>
      </Select>
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders SelectValue with placeholder', () => {
    render(
      <Select value="a" onValueChange={() => {}}>
        <SelectTrigger>
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
      </Select>
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders SelectContent with items when open', () => {
    render(
      <Select value="a" onValueChange={() => {}}>
        <SelectTrigger>
          <SelectValue placeholder="Choose" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Alpha</SelectItem>
          <SelectItem value="b">Beta</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('renders SelectItem with accessible text', () => {
    render(
      <Select value="a" onValueChange={() => {}}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Alpha</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });
});
