// src/floating/App.tsx
import { useEffect, useState } from "react";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { FocusBlock } from "./components/FocusBlock";
import { ExpandState } from "./components/ExpandState";

export default function App() {
  const [expanded, setExpanded] = useState(false);
  const win = getCurrentWindow();

  useEffect(() => {
    win.setSize(new LogicalSize(expanded ? 360 : 320, expanded ? 280 : 36));
  }, [expanded, win]);

  if (expanded) return <ExpandState />;

  return (
    <div onClick={() => setExpanded(true)}>
      <FocusBlock />
    </div>
  );
}
