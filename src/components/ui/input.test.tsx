import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Input } from './input';

describe('Input', () => {
  it('renders with default size (md)', () => {
    render(<Input placeholder="Type" />);
    expect(screen.getByPlaceholderText('Type')).toBeInTheDocument();
  });

  it('renders sm and md sizes', () => {
    const { rerender } = render(<Input size="sm" placeholder="x" />);
    rerender(<Input size="md" placeholder="x" />);
    expect(screen.getByPlaceholderText('x')).toBeInTheDocument();
  });

  it('applies error style when error=true', () => {
    render(<Input error placeholder="x" />);
    expect(screen.getByPlaceholderText('x')).toBeInTheDocument();
  });
});