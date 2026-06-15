import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent } from '../../components/ui/card';

describe('Card components — coverage', () => {
  it('Card renders with default props', () => {
    render(<Card data-testid="card"><span>Content</span></Card>);
    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('Card renders with custom className', () => {
    render(<Card className="custom-class" data-testid="card" />);
    expect(screen.getByTestId('card').className).toContain('custom-class');
  });

  it('Card renders with sm size', () => {
    render(<Card size="sm" data-testid="card" />);
    expect(screen.getByTestId('card').getAttribute('data-size')).toBe('sm');
  });

  it('Card renders with default size', () => {
    render(<Card data-testid="card" />);
    expect(screen.getByTestId('card').getAttribute('data-size')).toBe('default');
  });

  it('Card passes additional props', () => {
    render(<Card data-testid="card" role="region" aria-label="Test Card" />);
    expect(screen.getByTestId('card')).toHaveAttribute('role', 'region');
    expect(screen.getByTestId('card')).toHaveAttribute('aria-label', 'Test Card');
  });

  it('CardHeader renders', () => {
    render(<CardHeader data-testid="header"><span>Header</span></CardHeader>);
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByText('Header')).toBeInTheDocument();
  });

  it('CardHeader with custom className', () => {
    render(<CardHeader className="header-custom" data-testid="header" />);
    expect(screen.getByTestId('header').className).toContain('header-custom');
  });

  it('CardTitle renders', () => {
    render(<CardTitle data-testid="title">My Title</CardTitle>);
    expect(screen.getByTestId('title')).toBeInTheDocument();
    expect(screen.getByText('My Title')).toBeInTheDocument();
  });

  it('CardTitle with custom className', () => {
    render(<CardTitle className="title-custom" data-testid="title" />);
    expect(screen.getByTestId('title').className).toContain('title-custom');
  });

  it('CardDescription renders', () => {
    render(<CardDescription data-testid="desc">Description text</CardDescription>);
    expect(screen.getByTestId('desc')).toBeInTheDocument();
    expect(screen.getByText('Description text')).toBeInTheDocument();
  });

  it('CardDescription with custom className', () => {
    render(<CardDescription className="desc-custom" data-testid="desc" />);
    expect(screen.getByTestId('desc').className).toContain('desc-custom');
  });

  it('CardAction renders', () => {
    render(<CardAction data-testid="action"><button>Action</button></CardAction>);
    expect(screen.getByTestId('action')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('CardAction with custom className', () => {
    render(<CardAction className="action-custom" data-testid="action" />);
    expect(screen.getByTestId('action').className).toContain('action-custom');
  });

  it('CardContent renders', () => {
    render(<CardContent data-testid="content"><p>Body</p></CardContent>);
    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('CardContent with custom className', () => {
    render(<CardContent className="content-custom" data-testid="content" />);
    expect(screen.getByTestId('content').className).toContain('content-custom');
  });

  it('CardFooter renders', () => {
    render(<CardFooter data-testid="footer"><button>Submit</button></CardFooter>);
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  it('CardFooter with custom className', () => {
    render(<CardFooter className="footer-custom" data-testid="footer" />);
    expect(screen.getByTestId('footer').className).toContain('footer-custom');
  });

  it('Card composition renders all subcomponents', () => {
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

  it('Card renders with children of various types', () => {
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
