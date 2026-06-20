import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Toaster } from './sonner';

describe('Toaster (sonner re-export)', () => {
  it('renders without crashing', () => {
    render(<Toaster />);
    // sonner 渲染到 portal,这里只验证 mount 不报错
    expect(document.body).toBeInTheDocument();
  });
});
