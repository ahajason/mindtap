import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CodeBlock from './CodeBlock';

describe('CodeBlock copy button (V0.1.4 A+D 修复)', () => {
  it('Copy 按钮带 cursor-pointer 类(防御性显式声明,NSWindow drag 副作用下仍有效)', () => {
    render(<CodeBlock code="<Button />" />);
    const btn = screen.getByRole('button', { name: /复制代码/ });
    expect(btn.className).toMatch(/cursor-pointer/);
  });
});