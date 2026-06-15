import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogOverlay,
  DialogPortal,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

describe('Dialog UI Components', () => {
  it('renders Dialog root without errors', () => {
    const { container } = render(
      <Dialog><div>content</div></Dialog>
    );
    expect(container).toBeInTheDocument();
  });

  it('renders DialogTrigger button', () => {
    render(
      <Dialog>
        <DialogTrigger render={<Button />}>Open</DialogTrigger>
      </Dialog>
    );
    expect(screen.getByRole('button', { name: /open/i })).toBeInTheDocument();
  });

  it('renders DialogContent when open', () => {
    render(
      <Dialog open>
        <DialogContent>
          <p>Dialog body text</p>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByText('Dialog body text')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders DialogHeader with title', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
  });

  it('renders DialogTitle text', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>My Dialog</DialogTitle>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByText('My Dialog')).toBeInTheDocument();
  });

  it('renders DialogDescription', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogDescription>Some description</DialogDescription>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByText('Some description')).toBeInTheDocument();
  });

  it('renders DialogFooter with children', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogFooter>
            <Button>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByRole('button', { name: /ok/i })).toBeInTheDocument();
  });

  it('renders DialogOverlay', () => {
    const { container } = render(
      <Dialog open><DialogOverlay /></Dialog>
    );
    expect(container).toBeInTheDocument();
  });

  it('renders DialogPortal', () => {
    const { container } = render(
      <Dialog open>
        <DialogPortal>
          <div>Portaled content</div>
        </DialogPortal>
      </Dialog>
    );
    expect(container).toBeInTheDocument();
  });

  it('renders DialogClose button', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogClose render={<Button />}>Close Me</DialogClose>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByText('Close Me')).toBeInTheDocument();
  });
});
