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

describe('Sidebar drag region (V0.1.6)', () => {
  it('aside deep(父 deep 实测不继承到含子元素的子区)', () => {
    const { container } = render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    const aside = container.querySelector('aside');
    expect(aside?.getAttribute('data-tauri-drag-region')).toBe('deep');
  });

  it('nav false(保护 link 可点击,不被父 deep 吞掉)', () => {
    const { container } = render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    const nav = container.querySelector('aside > nav');
    expect(nav?.getAttribute('data-tauri-drag-region')).toBe('false');
  });
});