import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Card } from './card';

describe('Card', () => {
  it('renders with default tier (l1)', () => {
    render(<Card>content</Card>);
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('renders with all 3 tiers', () => {
    const { rerender } = render(<Card tier="l1">x</Card>);
    rerender(<Card tier="l2">x</Card>);
    rerender(<Card tier="l3">x</Card>);
    expect(screen.getByText('x')).toBeInTheDocument();
  });

  it('accepts className override', () => {
    render(<Card className="custom">x</Card>);
    expect(screen.getByText('x')).toHaveClass('custom');
  });
});
