import { useEffect, useState } from "react";
import { api, type Record } from "../../lib/tauri-bridge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Repeat } from "lucide-react";

const ghostIconBtn =
  "inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50 size-8";

export function SwitchDropdown({ onCollapse }: { onCollapse?: () => void } = {}) {
  const [list, setList] = useState<Record[]>([]);

  useEffect(() => {
    api.recordListSwitchable().then(setList).catch(console.error);
  }, []);

  return (
    <DropdownMenu onOpenChange={o => { if (o) api.recordListSwitchable().then(setList).catch(console.error) }}>
      <DropdownMenuTrigger className={ghostIconBtn} title="切换 Focus">
        <Repeat className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-l2 min-w-64">
        <DropdownMenuLabel>切换到</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {list.length === 0 && (
          <div className="px-2 py-3 text-xs text-muted-foreground text-center">
            没有可切换的任务
          </div>
        )}
        {list.map(r => (
          <DropdownMenuItem
            key={r.id}
            onSelect={() => {
              api.taskSwitch(r.source_id)
                .then(() => onCollapse?.())
                .catch(e => console.error("taskSwitch failed", e));
            }}
            className="flex items-start gap-2"
          >
            <span className={r.status === "paused" ? "text-amber-500 text-xs shrink-0 mt-0.5" : "text-blue-500 text-xs shrink-0 mt-0.5"}>
              {r.status === "paused" ? "暂停" : "未开始"}
            </span>
            <span className="flex-1 truncate">{r.content}</span>
            <span className="text-xs text-muted-foreground">⏵</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
