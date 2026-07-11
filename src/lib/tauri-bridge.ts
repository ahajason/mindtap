import { invoke as tauriInvoke } from "@tauri-apps/api/core";

export type TimerSession = {
  id: number;
  task_title: string;
  status: "active" | "paused" | "completed";
  started_at: number | null;
  paused_at: number | null;
  completed_at: number | null;
  focus_ms: number;
  created_at: number;
  updated_at: number;
};

async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  return tauriInvoke<T>(cmd, args);
}

export const api = {
  timerSession: {
    getActive: () =>
      invoke<TimerSession | null>("timer_session_get_active"),
    getById: (id: number) =>
      invoke<TimerSession | null>("timer_session_get_by_id", { id }),
    create: (taskTitle: string) =>
      invoke<TimerSession>("timer_session_create", { taskTitle }),
    updateFocusMs: (id: number, focusMs: number) =>
      invoke<void>("timer_session_update_focus_ms", { id, focusMs }),
    pause: (id: number) =>
      invoke<TimerSession>("timer_session_pause", { id }),
    resume: (id: number) =>
      invoke<TimerSession>("timer_session_resume", { id }),
    complete: (id: number) =>
      invoke<TimerSession>("timer_session_complete", { id }),
  },
};