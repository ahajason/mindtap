import { useActiveTask } from "./hooks/useActiveTask";
import { useFocusTicker } from "./hooks/useFocusTicker";
import { useTick } from "./hooks/useTick";
import { FoldedBar } from "./components/FoldedBar";

export function FloatingApp() {
  const { session } = useActiveTask();
  useTick(1000);
  useFocusTicker(session?.id ?? null, 1000);

  if (!session) {
    return <FoldedBar taskTitle="" focusMs={0} status="empty" />;
  }

  return (
    <FoldedBar
      taskTitle={session.task_title}
      focusMs={session.focus_ms}
      status={session.status}
    />
  );
}