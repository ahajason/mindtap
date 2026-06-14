import { useEffect, useState } from "react";

/** 每秒触发一次（前端 setInterval） */
export function useTick() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  return now;
}
