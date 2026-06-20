import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from './badge';

describe('Badge', () => {
  it('renders with default variant', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('renders all 4 variants', () => {
    const { rerender } = render(<Badge variant="default">x</Badge>);
    rerender(<Badge variant="success">x</Badge>);
    rerender(<Badge variant="inactive">x</Badge>);
    rerender(<Badge variant="warning">x</Badge>);
    expect(screen.getByText('x')).toBeInTheDocument();
  });
});