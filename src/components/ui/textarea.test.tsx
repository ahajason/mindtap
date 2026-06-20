import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Textarea } from './textarea';

describe('Textarea', () => {
  it('renders with default size', () => {
    render(<Textarea placeholder="Write" />);
    expect(screen.getByPlaceholderText('Write')).toBeInTheDocument();
  });

  it('renders sm and md sizes', () => {
    const { rerender } = render(<Textarea size="sm" placeholder="x" />);
    rerender(<Textarea size="md" placeholder="x" />);
    expect(screen.getByPlaceholderText('x')).toBeInTheDocument();
  });
});
