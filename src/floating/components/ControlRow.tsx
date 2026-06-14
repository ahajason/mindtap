import { api, type Task } from "../../lib/tauri-bridge";
import { SwitchDropdown } from "./SwitchDropdown";

export function ControlRow({
  active,
  onCollapse,
}: {
  active: Task | null;
  onCollapse?: () => void;
}) {
  return (
    <div className="control-row">
      {active && (
        <>
          <button
            className="btn-pause"
            onClick={() => {
              if (active.status === "active") api.taskPause(active.id);
              else if (active.status === "paused") api.taskResume(active.id);
            }}
          >
            {active.status === "active" ? "⏸ 暂停" : "▶ 继续"}
          </button>
          <button
            className="btn-complete"
            onClick={() =>
              active.status !== "done" && api.taskComplete(active.id)
            }
          >
            ✓ 完成
          </button>
        </>
      )}
      <SwitchDropdown onCollapse={onCollapse} />
    </div>
  );
}