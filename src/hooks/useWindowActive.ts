import { useEffect, useState } from 'react';

/**
 * useWindowActive — 检测 webview 窗口是否 active
 *
 * 监听 focus / blur / visibilitychange 三事件,同步写入
 * <html data-window-active> 属性,CSS 据此切换玻璃 vibrance。
 *
 * spec: 1-design/10-focus-state-spec.md §十
 * 关联: 2-issues/P1-active-inactive/00-focus-state-chaos.md 路径 F2
 *
 * @returns 当前窗口 active 状态
 */
export function useWindowActive(): boolean {
  const [active, setActive] = useState(() =>
    typeof document !== 'undefined' ? document.hasFocus() : true
  );

  useEffect(() => {
    const sync = () => {
      const next = !document.hidden && document.hasFocus();
      setActive(next);
      document.documentElement.dataset.windowActive = String(next);
    };

    window.addEventListener('focus', sync);
    window.addEventListener('blur', sync);
    document.addEventListener('visibilitychange', sync);

    // 初始同步
    sync();

    return () => {
      window.removeEventListener('focus', sync);
      window.removeEventListener('blur', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);

  return active;
}