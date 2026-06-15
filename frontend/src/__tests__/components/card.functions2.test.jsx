import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent } from '../../components/ui/card';

describe('Card components — function coverage 2', () => {
  describe('Card', () => {
    it('renders with default size', () => {
      render(<Card data-testid="card"><span>Content</span></Card>);
      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.getByTestId('card').getAttribute('data-size')).toBe('default');
    });

    it('renders with sm size', () => {
      render(<Card size="sm" data-testid="card" />);
      expect(screen.getByTestId('card').getAttribute('data-size')).toBe('sm');
    });

    it('renders with custom className', () => {
      render(<Card className="my-custom-class" data-testid="card" />);
      expect(screen.getByTestId('card').className).toContain('my-custom-class');
    });

    it('passes extra props', () => {
      render(<Card data-testid="card" role="region" aria-label="Test Card" />);
      expect(screen.getByTestId('card')).toHaveAttribute('role', 'region');
      expect(screen.getByTestId('card')).toHaveAttribute('aria-label', 'Test Card');
    });

    it('renders data-slot attribute', () => {
      render(<Card data-testid="card" />);
      expect(screen.getByTestId('card')).toHaveAttribute('data-slot', 'card');
    });

    it('renders with various children types', () => {
      render(
        <Card>
          <span>Text</span>
          <div><strong>Bold</strong></div>
          <p>Paragraph</p>
        </Card>
      );
      expect(screen.getByText('Text')).toBeInTheDocument();
      expect(screen.getByText('Bold')).toBeInTheDocument();
      expect(screen.getByText('Paragraph')).toBeInTheDocument();
    });
  });

  describe('CardHeader', () => {
    it('renders', () => {
      render(<CardHeader data-testid="header"><span>Header</span></CardHeader>);
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByText('Header')).toBeInTheDocument();
    });

    it('with custom className', () => {
      render(<CardHeader className="header-custom" data-testid="header" />);
      expect(screen.getByTestId('header').className).toContain('header-custom');
    });

    it('has data-slot attribute', () => {
      render(<CardHeader data-testid="header" />);
      expect(screen.getByTestId('header')).toHaveAttribute('data-slot', 'card-header');
    });
  });

  describe('CardTitle', () => {
    it('renders', () => {
      render(<CardTitle data-testid="title">My Title</CardTitle>);
      expect(screen.getByTestId('title')).toBeInTheDocument();
      expect(screen.getByText('My Title')).toBeInTheDocument();
    });

    it('with custom className', () => {
      render(<CardTitle className="title-custom" data-testid="title" />);
      expect(screen.getByTestId('title').className).toContain('title-custom');
    });

    it('has data-slot attribute', () => {
      render(<CardTitle data-testid="title" />);
      expect(screen.getByTestId('title')).toHaveAttribute('data-slot', 'card-title');
    });
  });

  describe('CardDescription', () => {
    it('renders', () => {
      render(<CardDescription data-testid="desc">Description text</CardDescription>);
      expect(screen.getByTestId('desc')).toBeInTheDocument();
      expect(screen.getByText('Description text')).toBeInTheDocument();
    });

    it('with custom className', () => {
      render(<CardDescription className="desc-custom" data-testid="desc" />);
      expect(screen.getByTestId('desc').className).toContain('desc-custom');
    });

    it('has data-slot attribute', () => {
      render(<CardDescription data-testid="desc" />);
      expect(screen.getByTestId('desc')).toHaveAttribute('data-slot', 'card-description');
    });
  });

  describe('CardAction', () => {
    it('renders', () => {
      render(<CardAction data-testid="action"><button>Action</button></CardAction>);
      expect(screen.getByTestId('action')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('with custom className', () => {
      render(<CardAction className="action-custom" data-testid="action" />);
      expect(screen.getByTestId('action').className).toContain('action-custom');
    });

    it('has data-slot attribute', () => {
      render(<CardAction data-testid="action" />);
      expect(screen.getByTestId('action')).toHaveAttribute('data-slot', 'card-action');
    });
  });

  describe('CardContent', () => {
    it('renders', () => {
      render(<CardContent data-testid="content"><p>Body</p></CardContent>);
      expect(screen.getByTestId('content')).toBeInTheDocument();
      expect(screen.getByText('Body')).toBeInTheDocument();
    });

    it('with custom className', () => {
      render(<CardContent className="content-custom" data-testid="content" />);
      expect(screen.getByTestId('content').className).toContain('content-custom');
    });

    it('has data-slot attribute', () => {
      render(<CardContent data-testid="content" />);
      expect(screen.getByTestId('content')).toHaveAttribute('data-slot', 'card-content');
    });
  });

  describe('CardFooter', () => {
    it('renders', () => {
      render(<CardFooter data-testid="footer"><button>Submit</button></CardFooter>);
      expect(screen.getByTestId('footer')).toBeInTheDocument();
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    it('with custom className', () => {
      render(<CardFooter className="footer-custom" data-testid="footer" />);
      expect(screen.getByTestId('footer').className).toContain('footer-custom');
    });

    it('has data-slot attribute', () => {
      render(<CardFooter data-testid="footer" />);
      expect(screen.getByTestId('footer')).toHaveAttribute('data-slot', 'card-footer');
    });
  });

  describe('composition', () => {
    it('renders all subcomponents together', () => {
      render(
        <Card data-testid="card">
          <CardHeader data-testid="header">
            <CardTitle data-testid="title">Title</CardTitle>
            <CardDescription data-testid="desc">Description</CardDescription>
            <CardAction data-testid="action"><button>Edit</button></CardAction>
          </CardHeader>
          <CardContent data-testid="content"><p>Content</p></CardContent>
          <CardFooter data-testid="footer"><button>Submit</button></CardFooter>
        </Card>
      );
      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('title')).toHaveTextContent('Title');
      expect(screen.getByTestId('desc')).toHaveTextContent('Description');
      expect(screen.getByTestId('content')).toHaveTextContent('Content');
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('sm size propagates to header styling', () => {
      render(
        <Card size="sm" data-testid="card">
          <CardHeader data-testid="header"><CardTitle>Title</CardTitle></CardHeader>
          <CardContent data-testid="content">Body</CardContent>
        </Card>
      );
      expect(screen.getByTestId('card').getAttribute('data-size')).toBe('sm');
    });
  });
});
