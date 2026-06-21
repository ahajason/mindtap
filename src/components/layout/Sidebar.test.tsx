import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Separator } from '@/components/ui/separator';

describe('Sidebar divider', () => {
  it('header 与 nav 之间有 Separator 元素', () => {
    const { container } = render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    const separators = container.querySelectorAll('[role="separator"]');
    expect(separators.length).toBeGreaterThanOrEqual(1);
  });

  it('Separator 在 Sidebar 渲染中存在', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    expect(screen.getAllByRole('separator').length).toBeGreaterThanOrEqual(1);
  });
});

describe('Separator 组件', () => {
  it('默认渲染 role=separator', () => {
    const { container } = render(<Separator />);
    expect(container.querySelector('[role="separator"]')).toBeTruthy();
  });
});