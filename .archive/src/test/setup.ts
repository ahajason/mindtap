import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// jsdom 没有 Tauri runtime,@tauri-apps/api/core 的 invoke 是 undefined。
// 所有 tauri-bridge 的 api.* 在测试中走 (undefined)(...) → TypeError。
// hook 层(例 useActiveTask)已有 try/catch 兜底,但新增的 useEffect 直接调
// api.* 时,sync TypeError 抛到 React 会被当 unhandled error 算 1 fail。
// 这里把 invoke mock 成返回 undefined 的函数,所有 api.* 静默走 .then(undefined),
// useEffect / event handler 内部的 .catch 不会触发,App 测试不再被无关 IPC 失败污染。
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn().mockResolvedValue(() => {}),
  emit: vi.fn(),
}));