// src/floating/hooks/usePlatform.ts
import { useEffect, useState } from "react";
import { api } from "../../lib/tauri-bridge";

export type Platform = "macos" | "windows" | "linux";

/**
 * 一次性获取运行平台（编译期 cfg! 决定，前端无运行时探测开销）
 * 失败时保守返回 linux（键名走文字版，最不"出戏"）
 */
export function usePlatform(): Platform {
  const [platform, setPlatform] = useState<Platform>("linux");
  useEffect(() => {
    api
      .getPlatform()
      .then((p) => setPlatform(p as Platform))
      .catch(() => setPlatform("linux"));
  }, []);
  return platform;
}

/** 把 Platform 映射到键名字符串（macOS 用符号，其他用文字） */
export function shortcutLabel(platform: Platform): string {
  return platform === "macos" ? "⌘⇧Space" : "Ctrl+Shift+Space";
}
