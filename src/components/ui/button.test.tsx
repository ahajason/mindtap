import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Button } from './button';

describe('Button', () => {
  it('renders with default variant (primary)', () => {
    render(<Button>Click</Button>);
    expect(screen.getByRole('button', { name: 'Click' })).toBeInTheDocument();
  });

  it('renders with all 4 variants', () => {
    const { rerender } = render(<Button variant="primary">A</Button>);
    expect(screen.getByText('A')).toBeInTheDocument();
    rerender(<Button variant="secondary">A</Button>);
    rerender(<Button variant="ghost">A</Button>);
    rerender(<Button variant="icon">A</Button>);
  });

  it('renders sm and md sizes', () => {
    const { rerender } = render(<Button size="sm">A</Button>);
    expect(screen.getByText('A')).toBeInTheDocument();
    rerender(<Button size="md">A</Button>);
  });

  it('accepts className override', () => {
    render(<Button className="custom-class">A</Button>);
    expect(screen.getByText('A')).toHaveClass('custom-class');
  });

  it('respects disabled prop', () => {
    render(<Button disabled>A</Button>);
    expect(screen.getByText('A')).toBeDisabled();
  });
});
