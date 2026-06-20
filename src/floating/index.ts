// src/floating/index.ts — barrel export
// 业务域内部文件禁止 import 其它业务域内部; 外部必须走本 barrel.

export { default as App } from './App';
export { FloatShell } from './FloatShell';
export { OuterShell } from './OuterShell';
export { useTick } from './hooks/useTick';
export { useActiveTask } from './hooks/useActiveTask';
export { useWindowPosition } from './hooks/useWindowPosition';
export { usePlatform, shortcutLabel } from './hooks/usePlatform';
export type { Platform } from './hooks/usePlatform';
export { useDragLongPress } from './hooks/useDragLongPress';
