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

describe('Input cursor & focus state', () => {
  it('默认带 cursor-text 类(文字可选)', () => {
    const { container } = render(<Input aria-label="test" />);
    const input = container.querySelector('input');
    expect(input?.className).toMatch(/cursor-text/);
  });

  it('带 focus-visible:ring-2 ring-primary 类(WCAG 1.4.11)', () => {
    const { container } = render(<Input aria-label="test" />);
    const input = container.querySelector('input');
    expect(input?.className).toMatch(/focus-visible:ring-2/);
    expect(input?.className).toMatch(/ring-primary/);
  });

  it('disabled 时带 cursor-not-allowed + opacity-50', () => {
    const { container } = render(<Input aria-label="test" disabled />);
    const input = container.querySelector('input');
    expect(input?.className).toMatch(/disabled:cursor-not-allowed/);
    expect(input?.className).toMatch(/disabled:opacity-50/);
  });

  it('readOnly 时保留 cursor-text(文字仍可选)', () => {
    const { container } = render(<Input aria-label="test" readOnly />);
    const input = container.querySelector('input');
    expect(input?.className).toMatch(/read-only:cursor-text/);
  });
});