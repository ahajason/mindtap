// 薄 adapter: 复盘视图命令(2026-08-03)。
use tauri::State;

use crate::db::review;
use crate::db::time;
use crate::db::DbState;
use crate::error::AppError;

#[tauri::command]
pub fn review_get_daily(state: State<DbState>) -> Result<review::DailyReview, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    let day_start = time::local_day_start_ms(time::now_ms());
    review::get_daily_review(&conn, day_start)
}

#[tauri::command]
pub fn review_associate_gap(
    item_id: i64,
    gap_start: i64,
    gap_end: i64,
    state: State<DbState>,
) -> Result<(), AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    review::associate_gap(&conn, item_id, gap_start, gap_end)
}