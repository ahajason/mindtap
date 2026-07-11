import { useEffect } from 'react';

/**
 * useWindowActive — 副作用: 同步 <html data-window-active> 属性供 CSS 玻璃降 vibrance 使用。
 * 返回 void: 唯一 caller StyleGuideLayout 只在乎副作用, 不读返回值。
 * spec: 1-design/10-focus-state-spec.md §三 + §九
 */
export function useWindowActive(): void {
  useEffect(() => {
    const sync = () => {
      const next = !document.hidden && document.hasFocus();
      document.documentElement.dataset.windowActive = String(next);
    };
    window.addEventListener('focus', sync);
    window.addEventListener('blur', sync);
    document.addEventListener('visibilitychange', sync);
    sync();
    return () => {
      window.removeEventListener('focus', sync);
      window.removeEventListener('blur', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);
}
