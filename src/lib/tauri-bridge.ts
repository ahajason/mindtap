// src/lib/tauri-bridge.ts
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { Settings, Diagnostics, LogEntry } from "@/settings/schema";

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

  recordList: (
    kind?: "task" | "idea" | "check_in",
    limit = 50,
    hideArchived = true,
  ) => invoke<Record[]>("record_list", { kind, limit, hideArchived }),
  recordListSwitchable: () => invoke<Record[]>("record_list_switchable"),
  recordGetActive: () => invoke<Record | null>("record_get_active"),
  recordGetActiveTask: () => invoke<Task | null>("record_get_active_task"),

  floatingShow: () => invoke<void>("floating_show"),
  floatingHide: () => invoke<void>("floating_hide"),
  floatingToggle: () => invoke<void>("floating_toggle"),
  floatingSetHeight: (height: number) => invoke<void>("floating_set_height", { height }),
  getPlatform: () => invoke<string>("get_platform"),
  showFloatingContextMenu: () => invoke<void>("show_floating_context_menu"),
};

export const events = {
  onFocusChanged: (cb: (task: Task) => void): Promise<UnlistenFn> =>
    listen<Task>("focus-changed", (e) => cb(e.payload)),
  onRecordUpdated: (cb: () => void): Promise<UnlistenFn> =>
    listen("record-updated", () => cb()),
  onTick: (cb: (now: number) => void): Promise<UnlistenFn> =>
    listen<number>("tick", (e) => cb(e.payload)),
  settingsChanged: <T>(cb: (s: T) => void) =>
    listen<T>("settings-changed", (e) => cb(e.payload)),
};

export const settings = {
  get: () => invoke<Settings>("settings_get"),
  set: (new_: Settings) => invoke<Settings>("settings_set", { new: new_ }),
  reset: () => invoke<Settings>("settings_reset"),
};

export const accessibility = {
  status: () => invoke<boolean>("accessibility_status"),
  requestPrompt: () => invoke<void>("accessibility_request_prompt"),
  openSettings: () => invoke<void>("open_ax_settings"),
};

export const diagnostics = {
  get: () => invoke<Diagnostics>("diagnostics_get"),
  recentLogs: () => invoke<LogEntry[]>("diagnostics_recent_logs"),
};
