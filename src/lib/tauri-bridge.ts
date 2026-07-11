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

export type TaskTitleRec = {
  task_title: string;
  last_used: number;
};

async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  return tauriInvoke<T>(cmd, args);
}

export const api = {
  app: {
    exit: () => invoke<void>("app_exit"),
    showMainWindow: () => invoke<void>("app_show_main_window"),
  },
  timerSession: {
    getActive: () => invoke<TimerSession | null>("timer_session_get_active"),
    create: (taskTitle: string) =>
      invoke<TimerSession>("timer_session_create", { taskTitle }),
    updateFocusMs: (id: number, focusMs: number) =>
      invoke<void>("timer_session_update_focus_ms", { id, focusMs }),
    pause: (id: number) => invoke<TimerSession>("timer_session_pause", { id }),
    resume: (id: number) => invoke<TimerSession>("timer_session_resume", { id }),
    complete: (id: number) => invoke<TimerSession>("timer_session_complete", { id }),
    listRecentTaskTitles: (limit?: number) =>
      invoke<TaskTitleRec[]>("timer_session_list_recent_task_titles", {
        limit: limit ?? 5,
      }),
  },
};
