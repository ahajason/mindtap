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

describe('Textarea cursor & focus state', () => {
  it('默认带 cursor-text 类', () => {
    const { container } = render(<Textarea aria-label="test" />);
    const ta = container.querySelector('textarea');
    expect(ta?.className).toMatch(/cursor-text/);
  });

  it('带 focus-visible:ring-2 ring-primary 类', () => {
    const { container } = render(<Textarea aria-label="test" />);
    const ta = container.querySelector('textarea');
    expect(ta?.className).toMatch(/focus-visible:ring-2/);
    expect(ta?.className).toMatch(/ring-primary/);
  });

  it('disabled 时带 cursor-not-allowed', () => {
    const { container } = render(<Textarea aria-label="test" disabled />);
    const ta = container.querySelector('textarea');
    expect(ta?.className).toMatch(/disabled:cursor-not-allowed/);
  });

  it('readOnly 时保留 cursor-text', () => {
    const { container } = render(<Textarea aria-label="test" readOnly />);
    const ta = container.querySelector('textarea');
    expect(ta?.className).toMatch(/read-only:cursor-text/);
  });
});
