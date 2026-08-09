// 应用设置 KV 存储(2026-08-02):浮窗展开高度等用户偏好。
// 深模块:set 用 UPSERT(INSERT OR REPLACE),get 无 key 返回 None。
// 供 commands/setting.rs 薄 adapter 调用,不直接暴露给前端结构。

use std::time::{SystemTime, UNIX_EPOCH};

use rusqlite::{params, Connection};

use crate::error::AppError;

fn now_ms() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64
}

/// 读一个设置值;key 不存在返回 None。
pub fn get(conn: &Connection, key: &str) -> Result<Option<String>, AppError> {
    let mut stmt = conn.prepare("SELECT value FROM app_setting WHERE key = ?1")?;
    let mut rows = stmt.query(params![key])?;
    match rows.next()? {
        Some(row) => Ok(Some(row.get(0)?)),
        None => Ok(None),
    }
}

/// 写一个设置值(UPSERT,幂等)。
pub fn set(conn: &Connection, key: &str, value: &str) -> Result<(), AppError> {
    let now = now_ms();
    conn.execute(
        "INSERT INTO app_setting (key, value, updated_at) VALUES (?1, ?2, ?3)
         ON CONFLICT(key) DO UPDATE SET value = ?2, updated_at = ?3",
        params![key, value, now],
    )?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    fn fresh_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        crate::db::init_connection(&conn).unwrap();
        conn
    }

    #[test]
    fn get_missing_returns_none() {
        let conn = fresh_db();
        assert_eq!(get(&conn, "missing").unwrap(), None);
    }

    #[test]
    fn set_then_get_roundtrip() {
        let conn = fresh_db();
        set(&conn, "floating_height", "320").unwrap();
        assert_eq!(get(&conn, "floating_height").unwrap(), Some("320".into()));
    }

    #[test]
    fn set_overwrites_existing() {
        let conn = fresh_db();
        set(&conn, "floating_height", "280").unwrap();
        set(&conn, "floating_height", "360").unwrap();
        assert_eq!(get(&conn, "floating_height").unwrap(), Some("360".into()));
    }
}
