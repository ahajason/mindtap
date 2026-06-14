import { api, type Record } from "../../lib/tauri-bridge";
import { SwitchDropdown } from "./SwitchDropdown";

export function ControlRow({
  active,
  onCollapse,
}: {
  active: Record | null;
  onCollapse?: () => void;
}) {
  return (
    <div className="control-row">
      {active && (
        <>
          <button
            className="btn-pause"
            onClick={() => {
              if (active.status === "active") api.taskPause(active.source_id);
              else if (active.status === "paused") api.taskResume(active.source_id);
            }}
          >
            {active.status === "active" ? "⏸ 暂停" : "▶ 继续"}
          </button>
          <button
            className="btn-complete"
            onClick={() =>
              active.status !== "done" && api.taskComplete(active.source_id)
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