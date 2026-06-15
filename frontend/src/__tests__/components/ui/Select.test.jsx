import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

describe('Select UI Components', () => {
  it('renders Select with trigger', () => {
    render(
      <Select defaultValue="a">
        <SelectTrigger>
          <SelectValue placeholder="Choose" />
        </SelectTrigger>
      </Select>
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders SelectTrigger', () => {
    render(
      <Select defaultValue="a">
        <SelectTrigger>
          <SelectValue placeholder="Choose" />
        </SelectTrigger>
      </Select>
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders SelectTrigger with size prop', () => {
    const { container } = render(
      <Select defaultValue="a">
        <SelectTrigger size="sm">
          <SelectValue placeholder="Choose" />
        </SelectTrigger>
      </Select>
    );
    const trigger = container.querySelector('[data-size="sm"]');
    expect(trigger).toBeInTheDocument();
  });

  it('renders SelectValue with placeholder', () => {
    render(
      <Select defaultValue="a">
        <SelectTrigger>
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
      </Select>
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders SelectContent with items when open', () => {
    render(
      <Select defaultValue="a" open>
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
      <Select defaultValue="a" open>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Alpha</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });

  it('renders SelectGroup', () => {
    render(
      <Select defaultValue="a" open>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="a">Alpha</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );
    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });

  it('renders SelectLabel', () => {
    render(
      <Select defaultValue="a" open>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value="a">Alpha</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );
    expect(screen.getByText('Fruits')).toBeInTheDocument();
  });

  it('renders SelectSeparator', () => {
    render(
      <Select defaultValue="a" open>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Alpha</SelectItem>
          <SelectSeparator />
          <SelectItem value="b">Beta</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });
});
