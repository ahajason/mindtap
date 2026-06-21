import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Label } from './label';

describe('Label', () => {
  it('renders children', () => {
    render(<Label>Field</Label>);
    expect(screen.getByText('Field')).toBeInTheDocument();
  });

  it('renders * when required', () => {
    render(<Label required>Field</Label>);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('hides * when not required', () => {
    render(<Label>Field</Label>);
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });
});