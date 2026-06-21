import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DialogWrapper } from './dialog';

describe('Dialog', () => {
  it('renders title and description when open', () => {
    render(
      <DialogWrapper
        open
        onOpenChange={() => {}}
        title="Confirm"
        description="Are you sure?"
      >
        body
      </DialogWrapper>
    );
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    expect(screen.getByText('body')).toBeInTheDocument();
  });
});
