import { invoke as tauriInvoke } from "@tauri-apps/api/core";

// V0.2.1: Item 统一实体取代 TimerSession(ADR-0011)。
// 三态状态机:todo/active/archived(2026-08-02 决策——收件箱并入待办、完成并入归档)。
// 计时后端主导:focus_ms 存已结算值,实时时长由前端按 (now - last_active_at) 推导,不写库(决策 9)。

export type ItemStatus = "todo" | "active" | "archived";

export type Item = {
  id: number;
  content: string;
  type: string; // 'task'(远期多族)
  status: ItemStatus;
  focus_ms: number; // 已结算投入(只增不减)
  last_active_at: number | null; // 最近活跃(冷却/跨天派生源)
  progress_note: string | null;
  source: string; // 'manual'(远期 suggested/hook)
  pending_ms: number | null; // 待确认失真窗口毫秒(ADR-0012)
  created_at: number;
  updated_at: number;
};

export type StartResult = {
  item: Item;
  switched_from: number[]; // 因切换退回待办的原进行中卡 id
};

export type PauseResult = {
  item: Item;
  pending_ms: number | null; // 失真窗口毫秒(若非主动暂停)
};

export type DormantPayload = {
  id: number;
  content: string;
  pending_ms: number;
};

// V0.2.1 3.3: 激活日志明细(一次 start → 结算)。ended_at null = 进行中。
export type FocusInterval = {
  id: number;
  item_id: number;
  started_at: number;
  ended_at: number | null;
};

export type TitleRec = {
  content: string;
  last_used: number;
};

async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  return tauriInvoke<T>(cmd, args);
}

export const api = {
  app: {
    exit: () => invoke<void>("app_exit"),
    showMainWindow: () => invoke<void>("app_show_main_window"),
    // V0.2.0.12 PATCH: 浮窗右键调 Rust 原生 Menu IPC (popup_menu + OS HMENU, 独立浮窗外窗口)
    // V0.2.6 / V0.2.0.11 误用 HTML React 组件 (./components/ContextMenu) 物理上不可能"独立窗口"
    showFloatingContextMenu: () => invoke<void>("show_floating_context_menu"),
  },
  item: {
    create: (content: string) => invoke<Item>("item_create", { content }),
    getActive: () => invoke<Item[]>("item_get_active"),
    getInbox: () => invoke<Item[]>("item_get_inbox"),
    getTodo: () => invoke<Item[]>("item_get_todo"),
    start: (id: number) => invoke<StartResult>("item_start", { id }),
    pause: (id: number, pendingMs?: number | null) =>
      invoke<PauseResult>("item_pause", { id, pendingMs }),
    complete: (id: number) => invoke<Item>("item_complete", { id }),
    confirmPending: (id: number, keep: boolean) =>
      invoke<Item>("item_confirm_pending", { id, keep }),
    checkDormant: () => invoke<DormantPayload[]>("item_check_dormant"),
    listDuplicate: (content: string) =>
      invoke<Item[]>("item_list_duplicate", { content }),
    getHistoryTitles: (limit?: number) =>
      invoke<TitleRec[]>("item_get_history_titles", { limit: limit ?? 5 }),
    // V0.2.1 三态:整理动作 —— triageToTodo 仅 active→todo 兜底;triageArchive 待办直接归档。
    triageToTodo: (id: number) => invoke<Item>("item_triage_todo", { id }),
    triageArchive: (id: number) => invoke<Item>("item_triage_archive", { id }),
    softDelete: (id: number) => invoke<Item>("item_soft_delete", { id }),
    reactivate: (id: number) => invoke<Item>("item_reactivate", { id }),
    undoDelete: (id: number) => invoke<Item>("item_undo_delete", { id }),
    // V0.2.1 1.4 收进:空闲检测(当前是否有 active 卡空闲超自动暂停阈值,供前端显示"自动暂停"标识)。
    getIdle: () => invoke<boolean>("item_get_idle"),
    // V0.2.1 3.3: 某卡的激活明细。
    listIntervals: (itemId: number) =>
      invoke<FocusInterval[]>("item_list_intervals", { itemId }),
  },
};
