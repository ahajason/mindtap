use std::sync::Mutex;

use rusqlite::Connection;
use tauri::{AppHandle, Manager};

use crate::db::schema::CREATE_SQL;
use crate::error::AppError;

pub mod dormant;
pub mod item;
pub mod review;
pub mod schema;
pub mod setting;
pub mod time;

pub struct DbState(pub Mutex<Connection>);

pub fn init(app: &AppHandle) -> Result<DbState, AppError> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError(e.to_string()))?;
    std::fs::create_dir_all(&dir)?;
    let db_path = dir.join("projects.db");
    let conn = Connection::open(&db_path)?;
    conn.execute_batch(CREATE_SQL)?;
    migrate_v5_to_v3(&conn)?;
    migrate_focus_interval_source(&conn)?;
    // V0.2.2: 将当前时区偏移写入 app_setting(local_tz_offset_secs)
    time::persist_tz_offset(&conn);
    Ok(DbState(Mutex::new(conn)))
}

/// 五态 → 三态数据迁移(2026-08-02,ADR-0011 后续):
/// - status='inbox' → 'todo'(收件箱并入待办)
/// - status='done' → 'archived'(完成并入归档,完成即归档,去掉独立 done + 次日自动归档)
///
/// 迁移幂等:重复跑不报错(两次 UPDATE 都无匹配行即 no-op)。
/// 旧表 CHECK 约束允许 inbox/done,新库 CREATE_SQL 已收窄;存量库直接 UPDATE 即可(不重建表)。
fn migrate_v5_to_v3(conn: &Connection) -> Result<(), AppError> {
    conn.execute_batch(
        "UPDATE item SET status = 'todo', updated_at = updated_at WHERE status = 'inbox';
         UPDATE item SET status = 'archived', updated_at = updated_at WHERE status = 'done';",
    )?;
    Ok(())
}

/// V0.2.2: focus_interval 表新增 source 列。幂等:列已存在则跳过。
fn migrate_focus_interval_source(conn: &Connection) -> Result<(), AppError> {
    // 检查 source 列是否存在
    let has_col: bool = conn
        .prepare("PRAGMA table_info(focus_interval)")?
        .query_map([], |row| row.get::<_, String>(1))?
        .filter_map(|r| r.ok())
        .any(|name| name == "source");

    if !has_col {
        conn.execute_batch(
            "ALTER TABLE focus_interval ADD COLUMN source TEXT NOT NULL DEFAULT 'start'
             CHECK (source IN ('start','idle_pause','manual_pause','dormant','manual_gap'));",
        )?;
    }
    Ok(())
}
