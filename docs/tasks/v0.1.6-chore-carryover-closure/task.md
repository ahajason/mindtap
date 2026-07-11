# chore(meta): V0.1.6 carryover closure

> 创建: 2026-07-11
> 关闭: 2026-07-11（用户在 Windows 11 24H2 实测通过）

## Why

V0.1.6 retro 沉淀了 4 笔"待 dev 实测" carryover（drag 各区 / focus ring / reduce-transparency / cursor 反 HIG 删除）。按 `dev-verify-before-commit.mdc` + retro lesson 6 "TODO 不该跟 merge 一起出现"，这些 carryover 应在 V0.2.0 第一个 Windows build 之前 closure（验证 + 写验证段 + 关闭）。否则闷到 V0.3。

## What

V0.1.6 retro 留的 4 笔 carryover 验证关闭。

## 4 项 carryover checklist

| # | carryover | 来源 (retro) | 实测方法 | closure 状态 |
|---|---|---|---|---|
| C1 | drag region 5 区全部可拖动 | §3.1 / §3.2 / §3.2 真根因链 | dev 启动应用，鼠标在每个区域按下并拖窗口 | ✅ closed (Windows 11 实测) |
| C2 | focus ring 视觉清晰 | §4.1 待用户验证 | Tab 切换交互元素 | ✅ closed (Windows 11 实测) |
| C3 | reduce-transparency 系统级联 | §4.1 待用户验证 | Windows 设置 → 辅助功能 → 透明效果 off → 玻璃表面切换 | ✅ closed (Windows 11 实测) |
| C4 | cursor: grab 反 HIG 已删除（fix 7）| §3.2 fix 7 | 鼠标在 drag region 上，光标保持普通箭头 | ✅ closed (Windows 11 实测) |

### C1 实测子项（5 个区域）

- [x] main 顶部 36px（data-tauri-drag-region）
- [x] sidebar header
- [x] sidebar padding (mt-10 让位区外)
- [x] sidebar mt-10 让位区
- [x] sidebar nav (clickable 不触发 drag)

## 验证段（已写入 commit message）

```
验证: Windows 11 24H2 + Tauri 2.11 + V0.1.6 main (commit 8af219a) dev 启动
实测 4 项 carryover:
- C1 drag 5 区 (main top / sidebar header / sidebar padding / sidebar mt-10 / sidebar nav) 全部可拖动窗口
  且 sidebar nav clickable 仍可点按钮（不冲突）
- C2 focus ring Tab 循环切换交互元素视觉清晰可识别
- C3 Windows 11 辅助功能 → 透明效果 off → 玻璃表面 (topbar / sidebar) 切换到不透明背景
- C4 鼠标在 drag region 上光标保持普通箭头（无 grab/grabbing）
```

## Done when

- [x] C1-C4 全部实测完成
- [x] 4 项 carryover 验证段写入 commit message
- [x] carryover 清单 ⏳ open 状态全部改为 ✅ closed
- [x] 不引入新规范违反项（commit 不带"待验证 TODO"）