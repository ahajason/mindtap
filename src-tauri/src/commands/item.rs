// 薄 adapter:invoke 参数映射 → ItemRepo(db::item)调用 → 返回。
// 状态机逻辑全部在 db::item(深模块),本层只做参数转换与序列化。

use tauri::State;

use crate::db::item::{
    self, DormantPayload, FocusInterval, Item, ListStatus, PauseResult, StartResult, TitleRec,
};
use crate::db::DbState;
use crate::error::AppError;

#[tauri::command]
pub fn item_create(content: String, state: State<DbState>) -> Result<Item, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    item::create(&conn, content)
}

#[tauri::command]
pub fn item_get_active(state: State<DbState>) -> Result<Vec<Item>, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    item::list(&conn, ListStatus::Active, None)
}

#[tauri::command]
pub fn item_get_inbox(state: State<DbState>) -> Result<Vec<Item>, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    item::list(&conn, ListStatus::Inbox, None)
}

#[tauri::command]
pub fn item_get_todo(state: State<DbState>) -> Result<Vec<Item>, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    item::list(&conn, ListStatus::Todo, None)
}

#[tauri::command]
pub fn item_start(id: i64, state: State<DbState>) -> Result<StartResult, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    item::start(&conn, id)
}

#[tauri::command]
pub fn item_pause(
    id: i64,
    pending_ms: Option<i64>,
    state: State<DbState>,
) -> Result<PauseResult, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    item::pause(&conn, id, pending_ms)
}

#[tauri::command]
pub fn item_complete(id: i64, state: State<DbState>) -> Result<Item, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    item::complete(&conn, id)
}

#[tauri::command]
pub fn item_confirm_pending(id: i64, keep: bool, state: State<DbState>) -> Result<Item, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    item::confirm_pending(&conn, id, keep)
}

#[tauri::command]
pub fn item_triage_todo(id: i64, state: State<DbState>) -> Result<Item, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    item::triage_to_todo(&conn, id)
}

#[tauri::command]
pub fn item_triage_archive(id: i64, state: State<DbState>) -> Result<Item, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    item::triage_archive(&conn, id)
}

#[tauri::command]
pub fn item_soft_delete(id: i64, state: State<DbState>) -> Result<Item, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    item::soft_delete(&conn, id)
}

#[tauri::command]
pub fn item_reactivate(id: i64, state: State<DbState>) -> Result<Item, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    item::reactivate(&conn, id)
}

#[tauri::command]
pub fn item_undo_delete(id: i64, state: State<DbState>) -> Result<Item, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    item::undo_delete(&conn, id)
}

/// 失真检测 + 跨天停表。返回失真卡 payload(供前端轮询显示气泡)
#[tauri::command]
pub fn item_check_dormant(state: State<DbState>) -> Result<Vec<DormantPayload>, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    let now = item::now_ms_for_cmd();
    let dormant = item::settle_dormant(&conn, now)?;
    item::get_dormant_payloads(&conn, &dormant.has_pending)
}

/// 重复捕获检测:同内容已有 inbox/todo/active 卡(轻提示,不合并)
#[tauri::command]
pub fn item_list_duplicate(content: String, state: State<DbState>) -> Result<Vec<Item>, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    item::list_duplicate(&conn, &content)
}

/// 历史任务名复用
#[tauri::command]
pub fn item_get_history_titles(
    limit: Option<i64>,
    state: State<DbState>,
) -> Result<Vec<TitleRec>, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    item::list_recent_titles(&conn, limit.unwrap_or(5))
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
    let now = item::now_ms_for_cmd();
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    let actives = item::list(&conn, ListStatus::Active, None)?;
    Ok(actives
        .iter()
        .any(|it| crate::idle::should_auto_pause(it.last_active_at, idle, now)))
}
