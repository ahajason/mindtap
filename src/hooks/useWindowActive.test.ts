import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWindowActive } from './useWindowActive';

describe('useWindowActive', () => {
  beforeEach(() => {
    document.documentElement.dataset.windowActive = undefined;
  });

  it('初始同步 <html data-window-active>', () => {
    document.hasFocus = vi.fn(() => true);
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    renderHook(() => useWindowActive());
    expect(document.documentElement.dataset.windowActive).toBe('true');
  });

  it('blur 事件触发后 <html data-window-active> = "false"', () => {
    document.hasFocus = vi.fn(() => true);
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    renderHook(() => useWindowActive());
    expect(document.documentElement.dataset.windowActive).toBe('true');

    document.hasFocus = vi.fn(() => false);

    act(() => {
      window.dispatchEvent(new Event('blur'));
    });

    expect(document.documentElement.dataset.windowActive).toBe('false');
  });

  it('focus 事件触发后 <html data-window-active> = "true"', () => {
    document.hasFocus = vi.fn(() => false);
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    renderHook(() => useWindowActive());
    expect(document.documentElement.dataset.windowActive).toBe('false');

    document.hasFocus = vi.fn(() => true);

    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    expect(document.documentElement.dataset.windowActive).toBe('true');
  });

  it('visibilitychange 事件触发后 <html data-window-active> 同步', () => {
    document.hasFocus = vi.fn(() => true);
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    renderHook(() => useWindowActive());

    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(document.documentElement.dataset.windowActive).toBe('false');
  });
});