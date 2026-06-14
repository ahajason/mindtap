import { useEffect, useState } from "react";
import { api, events, type Record } from "../../lib/tauri-bridge";

export type KindFilter = "all" | "task" | "idea" | "check_in";

export function useRecords(kind: KindFilter = "all") {
  const [records, setRecords] = useState<Record[]>([]);

  useEffect(() => {
    refresh();
    const unlisten = events.onRecordUpdated(() => refresh());
    return () => {
      unlisten.then((u) => u());
    };

    async function refresh() {
      try {
        let data: Record[];
        if (kind === "all") {
          data = await api.recordList(100, true);
        } else {
          data = await api.recordListByKind(kind, 100);
        }
        setRecords(data);
      } catch (e) {
        console.error(e);
      }
    }
  }, [kind]);

  return records;
}
