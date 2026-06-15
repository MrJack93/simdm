import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';

describe('Tooltip UI Components', () => {
  it('renders TooltipProvider without errors', () => {
    const { container } = render(
      <TooltipProvider><div>content</div></TooltipProvider>
    );
    expect(container).toBeInTheDocument();
  });

  it('renders TooltipProvider with delay prop', () => {
    const { container } = render(
      <TooltipProvider delay={500}><div>content</div></TooltipProvider>
    );
    expect(container).toBeInTheDocument();
  });

  it('renders Tooltip root without errors', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger render={<button />}>Hover me</TooltipTrigger>
          <TooltipContent>Help text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    expect(screen.getByRole('button', { name: /hover me/i })).toBeInTheDocument();
  });

  it('renders TooltipTrigger', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger render={<button />}>Trigger</TooltipTrigger>
          <TooltipContent>Content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    expect(screen.getByRole('button', { name: /trigger/i })).toBeInTheDocument();
  });

  it('renders TooltipContent when open', () => {
    render(
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger render={<button />}>Trigger</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    expect(screen.getByText('Tooltip text')).toBeInTheDocument();
  });

  it('renders content in portal with data-slot', () => {
    render(
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger render={<button />}>Trigger</TooltipTrigger>
          <TooltipContent>Info</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    const tooltipContent = document.querySelector('[data-slot="tooltip-content"]');
    expect(tooltipContent).toBeInTheDocument();
  });
});
