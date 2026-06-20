// src/floating/capability.test.ts
// 2026-06-20 浮窗缺失 bug 验证:
//   Tauri 2 capability 系统是 mandatory — 每个 webview window 必须被某
//   个 capability `windows: [...]` 列出,否则 webview 拒绝加载资源 / IPC。
//   V1.0 initial commit 只建了 default.json (覆盖 main),floating 窗口
//   从脚手架起就无 capability 覆盖 — 启动后浮窗不渲染或白屏。
//
// CLAUDE.md 第 87 行明确警告过此坑,但从未被遵守。
//
// 此测试断言 src-tauri/capabilities/floating.json 存在并正确覆盖
// floating 窗口 + 包含所需权限。
import { describe, it, expect } from 'vitest'
import floatingCapRaw from '../../src-tauri/capabilities/floating.json?raw'

describe('src-tauri/capabilities/floating.json · 浮窗 capability 契约', () => {
  // Step 1:文件存在 + 是合法 JSON(red: 文件不存在 → import 失败)
  it('文件存在且能解析为合法 JSON', () => {
    expect(() => JSON.parse(floatingCapRaw)).not.toThrow()
    const cap = JSON.parse(floatingCapRaw)
    expect(cap).toBeTruthy()
    expect(typeof cap).toBe('object')
  })

  // Step 2:windows 数组必须包含 "floating"(red: windows 字段缺失)
  it('windows 数组包含 "floating"', () => {
    const cap = JSON.parse(floatingCapRaw)
    expect(Array.isArray(cap.windows)).toBe(true)
    expect(cap.windows).toContain('floating')
  })

  // Step 3:有 permissions 数组(red: permissions 缺失)
  it('包含 permissions 数组', () => {
    const cap = JSON.parse(floatingCapRaw)
    expect(Array.isArray(cap.permissions)).toBe(true)
    expect(cap.permissions.length).toBeGreaterThan(0)
  })

  // Step 4:至少包含 core:default(red: 权限不全,IPC 不通)
  it('permissions 至少包含 core:default', () => {
    const cap = JSON.parse(floatingCapRaw)
    expect(cap.permissions).toContain('core:default')
  })

  // Step 5:identifier 唯一(red: 复用 default 的 identifier 会冲突)
  it('identifier 非空且不等于 "default"', () => {
    const cap = JSON.parse(floatingCapRaw)
    expect(typeof cap.identifier).toBe('string')
    expect(cap.identifier.length).toBeGreaterThan(0)
    expect(cap.identifier).not.toBe('default')
  })
})