# chore(meta): V0.1.6 carryover closure

> 创建: 2026-07-11

## Why

V0.1.6 retro 沉淀了 4 笔"待 dev 实测" carryover（drag 各区 / focus ring / reduce-transparency / cursor 反 HIG 删除）。按 `dev-verify-before-commit.mdc` + retro lesson 6 "TODO 不该跟 merge 一起出现"，这些 carryover 应在 V0.2.0 第一个 Windows build 之前 closure（验证 + 写验证段 + 关闭）。否则闷到 V0.3。

## What

V0.1.6 retro 留的 4 笔 carryover 验证关闭清单 + 验证段 commit message 模板。

## 4 项 carryover checklist

| # | carryover | 来源 (retro) | 实测方法 | closure 状态 |
|---|---|---|---|---|
| C1 | drag region 5 区全部可拖动 | §3.1 / §3.2 / §3.2 真根因链 | dev 启动应用，鼠标在每个区域按下并拖窗口 | ⏳ open |
| C2 | focus ring 视觉清晰 | §4.1 待用户验证 | Tab 切换交互元素 | ⏳ open |
| C3 | reduce-transparency 系统级联 | §4.1 待用户验证 | Windows 设置 → 辅助功能 → 透明效果 off → 玻璃表面切换 | ⏳ open |
| C4 | cursor: grab 反 HIG 已删除（fix 7）| §3.2 fix 7 | 鼠标在 drag region 上，光标保持普通箭头 | ⏳ open |

### C1 实测子项（5 个区域）

- [ ] main 顶部 36px（data-tauri-drag-region）
- [ ] sidebar header
- [ ] sidebar padding (mt-10 让位区外)
- [ ] sidebar mt-10 让位区
- [ ] sidebar nav (clickable 是否被 false 排除)

### Commit message 验证段模板

```
fix(drag): V0.1.6 drag region "fix 6" carryover closure

- 业务痛点: V0.1.6 retro §3.2 留的 drag "fix 6"（mt-10 让位区独立 drag strip）未实测
- 边界条件: 5 个区域（main top / sidebar header / sidebar padding / sidebar mt-10 / sidebar nav）
- 不这样改会怎样: 拖动债闷到 V0.3

验证: Windows 11 24H2 + Tauri 2.11 dev 启动，5 个区域 drag 实测全部生效，
窗口位置变化符合预期；sidebar nav clickable 不触发 drag（按钮可点）。
```

## Done when

- [ ] C1-C4 全部实测完成
- [ ] 4 个 commit 含"验证: ..."段（参考上面模板）
- [ ] carryover 清单 ⏳ open 状态全部改为 ✅ closed
- [ ] 不引入新规范违反项（commit 不带"待验证 TODO"）