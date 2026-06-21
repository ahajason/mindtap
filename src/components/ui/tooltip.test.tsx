import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TooltipProvider, TooltipWrapper } from './tooltip';

describe('Tooltip', () => {
  it('renders trigger', () => {
    render(
      <TooltipProvider>
        <TooltipWrapper content="Hint">
          <button>Trigger</button>
        </TooltipWrapper>
      </TooltipProvider>
    );
    expect(screen.getByRole('button', { name: 'Trigger' })).toBeInTheDocument();
  });
});
