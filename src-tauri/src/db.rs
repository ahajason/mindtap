use std::sync::Mutex;

use rusqlite::Connection;
use tauri::{AppHandle, Manager};

use crate::db::schema::CREATE_SQL;
use crate::error::AppError;

pub mod item;
pub mod schema;
pub mod setting;

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
