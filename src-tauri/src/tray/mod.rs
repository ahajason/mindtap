// src-tauri/src/tray/mod.rs
//
// V1.4 托盘管理（spec 已在 git e253f41）的预创建模块。
// 本迭代只用到 menu.rs（浮窗右键菜单）；tray 图标本体的注册与 click 处理
// 等 V1.4 实施时补全（见 V1.4 spec §4.1 / §5.2）。

pub mod confirm;
pub mod menu;
