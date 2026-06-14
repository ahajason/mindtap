// src/lib/tauri-bridge.ts
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export type Task = {
  id: number;
  content: string;
  status: "pending" | "active" | "paused" | "done";
  duration_ms: number;
  first_focused_at: number | null;
  focus_started_at: number | null;
  paused_at: number | null;
  focused_count: number;
  due_at: number | null;
  created_at: number;
  updated_at: number;
  archived_at: number | null;
};

export type Record = {
  id: number;
  kind: "task" | "idea" | "check_in";
  source_id: number;
  content: string;
  status: "pending" | "active" | "paused" | "done" | null;
  created_at: number;
};

export const api = {
  taskCreate: (content: string, dueAt?: number) =>
    invoke<Task>("task_create", { content, dueAt }),
  taskStartTimer: (id: number) => invoke<Task>("task_start_timer", { id }),
  taskPause: (id: number) => invoke<Task>("task_pause", { id }),
  taskResume: (id: number) => invoke<Task>("task_resume", { id }),
  taskComplete: (id: number) => invoke<Task>("task_complete", { id }),
  taskUndo: (id: number) => invoke<Task>("task_undo", { id }),
  taskSwitch: (id: number) => invoke<Task>("task_switch", { id }),
  taskArchive: (id: number) => invoke<Task>("task_archive", { id }),

  ideaCreate: (content: string) => invoke<number>("idea_create", { content }),
  checkInCreate: (habit: string, note?: string) =>
    invoke<number>("check_in_create", { habit, note }),

  recordList: (limit = 50, hideArchived = true) =>
    invoke<Record[]>("record_list", { limit, hideArchived }),
  recordListByKind: (kind: "task" | "idea" | "check_in", limit = 50) =>
    invoke<Record[]>("record_list_by_kind", { kind, limit }),
  recordListSwitchable: () => invoke<Record[]>("record_list_switchable"),
  recordGetActive: () => invoke<Record | null>("record_get_active"),
  recordGetActiveTask: () => invoke<Task | null>("record_get_active_task"),

  floatingShow: () => invoke<void>("floating_show"),
  floatingHide: () => invoke<void>("floating_hide"),
  floatingToggle: () => invoke<void>("floating_toggle"),
  getPlatform: () => invoke<string>("get_platform"),
};

export const events = {
  onFocusChanged: (cb: (task: Task) => void): Promise<UnlistenFn> =>
    listen<Task>("focus-changed", (e) => cb(e.payload)),
  onRecordUpdated: (cb: () => void): Promise<UnlistenFn> =>
    listen("record-updated", () => cb()),
  onTick: (cb: (now: number) => void): Promise<UnlistenFn> =>
    listen<number>("tick", (e) => cb(e.payload)),
};
