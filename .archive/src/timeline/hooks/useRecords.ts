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
        const data = await api.recordList(
          kind === "all" ? undefined : kind,
          100,
          true,
        );
        setRecords(data);
      } catch (e) {
        console.error(e);
      }
    }
  }, [kind]);

  return records;
}
