// 薄 adapter:invoke 参数映射 -> ItemRepo(db::item)调用 -> 返回。
// 状态机逻辑全部在 db::item(深模块),本层只做参数转换与序列化。
// V0.2.2: 写操作 emit "floating:data_changed" 事件,驱动跨窗口实时刷新。

use tauri::{AppHandle, Emitter, Manager, State};

use crate::db::dormant::{self, DormantPayload};
use crate::db::item::{self, FocusInterval, Item, ListStatus, PauseResult, StartResult};
use crate::db::time;
use crate::db::DbState;
use crate::error::AppError;

/// 写操作完成后广播数据变更事件,前端监听后自动刷新。
fn emit_data_changed(app: &AppHandle) {
    let _ = app.emit("floating:data_changed", ());
}

#[tauri::command]
pub fn item_create(
    content: String,
    state: State<DbState>,
    app: AppHandle,
) -> Result<Item, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    let item = item::create(&conn, content)?;
    emit_data_changed(&app);
    Ok(item)
}

#[tauri::command]
pub fn item_get_active(state: State<DbState>) -> Result<Vec<Item>, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    item::list(&conn, ListStatus::Active, None)
}

#[tauri::command]
pub fn item_get_inbox(state: State<DbState>) -> Result<Vec<Item>, AppError> {
    // V0.2.1 三态:收件箱并入待办,此命令保留为「待办」别名(向后兼容前端旧调用)。
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    item::list(&conn, ListStatus::Todo, None)
}

#[tauri::command]
pub fn item_get_todo(state: State<DbState>) -> Result<Vec<Item>, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    item::list(&conn, ListStatus::Todo, None)
}

#[tauri::command]
pub fn item_start(id: i64, state: State<DbState>, app: AppHandle) -> Result<StartResult, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    let result = item::start(&conn, id)?;
    emit_data_changed(&app);
    Ok(result)
}

#[tauri::command]
pub fn item_pause(
    id: i64,
    pending_ms: Option<i64>,
    state: State<DbState>,
    app: AppHandle,
) -> Result<PauseResult, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    let result = item::pause(&conn, id, pending_ms)?;
    emit_data_changed(&app);
    Ok(result)
}

#[tauri::command]
pub fn item_complete(id: i64, state: State<DbState>, app: AppHandle) -> Result<Item, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    let item = item::complete(&conn, id)?;
    emit_data_changed(&app);
    Ok(item)
}

#[tauri::command]
pub fn item_confirm_pending(
    id: i64,
    keep: bool,
    state: State<DbState>,
    app: AppHandle,
) -> Result<Item, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    let item = item::confirm_pending(&conn, id, keep)?;
    emit_data_changed(&app);
    Ok(item)
}

#[tauri::command]
pub fn item_rename(
    id: i64,
    content: String,
    state: State<DbState>,
    app: AppHandle,
) -> Result<Item, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    let item = item::rename(&conn, id, content)?;
    emit_data_changed(&app);
    Ok(item)
}

#[tauri::command]
pub fn item_triage_todo(id: i64, state: State<DbState>, app: AppHandle) -> Result<Item, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    let item = item::triage_to_todo(&conn, id)?;
    emit_data_changed(&app);
    Ok(item)
}

#[tauri::command]
pub fn item_triage_archive(
    id: i64,
    state: State<DbState>,
    app: AppHandle,
) -> Result<Item, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    let item = item::triage_archive(&conn, id)?;
    emit_data_changed(&app);
    Ok(item)
}

#[tauri::command]
pub fn item_soft_delete(id: i64, state: State<DbState>, app: AppHandle) -> Result<Item, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    let item = item::soft_delete(&conn, id)?;
    emit_data_changed(&app);
    Ok(item)
}

#[tauri::command]
pub fn item_reactivate(id: i64, state: State<DbState>, app: AppHandle) -> Result<Item, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    let item = item::reactivate(&conn, id)?;
    emit_data_changed(&app);
    Ok(item)
}

#[tauri::command]
pub fn item_undo_delete(id: i64, state: State<DbState>, app: AppHandle) -> Result<Item, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    let item = item::undo_delete(&conn, id)?;
    emit_data_changed(&app);
    Ok(item)
}

/// 失真检测 + 跨天停表。返回失真卡 payload(供前端轮询显示气泡)
#[tauri::command]
pub fn item_check_dormant(state: State<DbState>) -> Result<Vec<DormantPayload>, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    let now = time::now_ms();
    let cooling_ms = dormant::get_cooling_ms(&conn);
    let dormant = dormant::settle_dormant(&conn, now, cooling_ms)?;
    dormant::get_dormant_payloads(&conn, &dormant.has_pending)
}

/// 测试辅助:手动触发指定卡的失真确认气泡(跳过冷却检测)。
/// 仅在开发者选项开启时可用,运行时检查 developer_mode_enabled 设置。
#[tauri::command]
pub fn item_trigger_dormant(
    id: i64,
    state: State<DbState>,
    app: AppHandle,
) -> Result<DormantPayload, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    // 运行时检查:开发者选项必须开启
    let dev_mode = crate::db::setting::get(&conn, "developer_mode_enabled")
        .ok()
        .flatten()
        .map(|s| s == "true")
        .unwrap_or(false);
    if !dev_mode {
        return Err(AppError("developer mode not enabled".to_string()));
    }
    let item =
        item::get_by_id(&conn, id)?.ok_or_else(|| AppError(format!("item {} not found", id)))?;
    let payload = DormantPayload {
        id: item.id,
        content: item.content.clone(),
        pending_ms: item.pending_ms.unwrap_or(0),
    };
    let _ = app.emit("floating:dormant", &payload);
    if let Some(bubble) = app.get_webview_window("bubble") {
        let _ = bubble.show();
    }
    Ok(payload)
}

/// 重复捕获检测:同内容已有 todo/active 卡(轻提示,不合并)
#[tauri::command]
pub fn item_list_duplicate(content: String, state: State<DbState>) -> Result<Vec<Item>, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    item::list_duplicate(&conn, &content)
}

/// 某卡的激活明细(供并行统计 / 合并)
#[tauri::command]
pub fn item_list_intervals(
    item_id: i64,
    state: State<DbState>,
) -> Result<Vec<FocusInterval>, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    item::list_intervals(&conn, item_id)
}

/// 自动暂停状态:当前是否有 active 卡空闲超阈值(供前端轮询显示"自动暂停"标识)。
/// 非 Windows(无 idle 检测)恒返回 false。
#[tauri::command]
pub fn item_get_idle(state: State<DbState>) -> Result<bool, AppError> {
    let idle = crate::idle::last_input_ms();
    let now = time::now_ms();
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    let actives = item::list(&conn, ListStatus::Active, None)?;
    Ok(actives.iter().any(|it| {
        crate::idle::should_auto_pause(
            it.last_active_at,
            idle,
            now,
            crate::idle::get_idle_ms(&conn),
        )
    }))
}

/// 列出已归档的卡(archived)。
#[tauri::command]
pub fn item_get_archived(state: State<DbState>) -> Result<Vec<Item>, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    item::list(&conn, ListStatus::Archived, None)
}

/// 列出已软删除的卡(回收站视图)。
#[tauri::command]
pub fn item_list_deleted(state: State<DbState>) -> Result<Vec<Item>, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    item::list_deleted(&conn, None)
}

/// 永久删除(仅限已软删除的卡)。
#[tauri::command]
pub fn item_hard_delete(id: i64, state: State<DbState>, app: AppHandle) -> Result<(), AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    item::hard_delete(&conn, id)?;
    emit_data_changed(&app);
    Ok(())
}
