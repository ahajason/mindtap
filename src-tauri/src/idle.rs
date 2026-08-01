// 自动计时空闲保护 —— 系统空闲检测 + 自动暂停扫描。
// Windows:GetLastInputInfo(上次键鼠输入的 boot-tick) + GetTickCount64(当前 boot-tick),
//         相减得空闲时长(ms)。非 Windows:last_input_ms() 返回 None,不检测(不误停)。
// 休眠/锁屏兜底:锁屏后无键鼠输入,idle 必然超阈值 → 下一扫描周期自动暂停
// (不单独监听电源事件,见 tech §1 不在范围)。

use rusqlite::Connection;

use crate::db::item::{self, Item, ListStatus};
use crate::error::AppError;

/// 自动暂停空闲阈值:10 分钟无键鼠输入
pub const IDLE_AUTO_PAUSE_MS: i64 = 10 * 60 * 1000;

/// 距上次键鼠输入的空闲毫秒。None = 当前平台不支持检测(fallback 不检测)。
pub fn last_input_ms() -> Option<i64> {
    #[cfg(target_os = "windows")]
    {
        windows_idle::last_input_ms()
    }
    #[cfg(not(target_os = "windows"))]
    {
        None
    }
}

/// 自动暂停判定(纯逻辑,单测入口):idle 严格超阈值,且卡 last_active_at 早于 idle 起点。
/// - last_active_at / now:UNIX epoch 毫秒
/// - idle:空闲时长毫秒(与 now 相减得 idle 起点,不同时钟域但在同一扫描时刻取数)
pub fn should_auto_pause(last_active_at: Option<i64>, idle: Option<i64>, now: i64) -> bool {
    let Some(idle) = idle else { return false };
    if idle <= IDLE_AUTO_PAUSE_MS {
        return false;
    }
    let Some(la) = last_active_at else {
        return false;
    };
    la < now.saturating_sub(idle)
}

/// 自动暂停扫描:遍历 active 卡,命中 should_auto_pause 的主动暂停(不计失真,退回 todo)。
/// 返回被暂停的卡(供发通知)。conn 由调用方持 DbState 锁。
pub fn scan_and_auto_pause(
    conn: &Connection,
    idle: Option<i64>,
    now: i64,
) -> Result<Vec<Item>, AppError> {
    let actives = item::list(conn, ListStatus::Active, None)?;
    let mut paused = Vec::new();
    for it in actives {
        if should_auto_pause(it.last_active_at, idle, now) {
            // 单卡失败跳过(可能已被其他路径完成/暂停),不阻塞整轮扫描
            if let Ok(res) = item::pause(conn, it.id, None) {
                paused.push(res.item);
            }
        }
    }
    Ok(paused)
}

#[cfg(target_os = "windows")]
mod windows_idle {
    use windows::Win32::System::SystemInformation::GetTickCount64;
    use windows::Win32::UI::Input::KeyboardAndMouse::{GetLastInputInfo, LASTINPUTINFO};

    pub(super) fn last_input_ms() -> Option<i64> {
        let mut info = LASTINPUTINFO {
            cbSize: std::mem::size_of::<LASTINPUTINFO>() as u32,
            dwTime: 0,
        };
        // GetLastInputInfo 返回 BOOL → windows crate 包成 Result<()>;FALSE 即取不到输入时间,不判定
        if !unsafe { GetLastInputInfo(&mut info).as_bool() } {
            return None;
        }
        let now_tick = unsafe { GetTickCount64() } as i64;
        let last_tick = info.dwTime as i64;
        Some(now_tick.saturating_sub(last_tick))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::params;
    use std::sync::atomic::{AtomicUsize, Ordering};

    static COUNTER: AtomicUsize = AtomicUsize::new(0);

    fn fresh_db() -> Connection {
        let id = COUNTER.fetch_add(1, Ordering::SeqCst);
        let path = std::env::temp_dir().join(format!(
            "mindtap_idle_test_{}_{}.db",
            std::process::id(),
            id
        ));
        let _ = std::fs::remove_file(&path);
        let conn = Connection::open(&path).unwrap();
        conn.execute_batch(crate::db::schema::CREATE_SQL).unwrap();
        conn
    }

    fn insert_active(conn: &Connection, content: &str, last_active_at: i64) -> i64 {
        conn.execute(
            "INSERT INTO item (content, status, last_active_at, created_at, updated_at)
             VALUES (?1, 'active', ?2, ?2, ?2)",
            params![content, last_active_at],
        )
        .unwrap();
        conn.last_insert_rowid()
    }

    // idle 检测逻辑:阈值判断 + idle 起点与 last_active_at 的相对先后
    #[test]
    fn should_auto_pause_respects_threshold() {
        let now = 1_000_000_000;
        let old_la = now - 20 * 60 * 1000;
        // 未超阈值(9 分钟 / 恰好 10 分钟)→ 不暂停
        assert!(!should_auto_pause(Some(old_la), Some(9 * 60 * 1000), now));
        assert!(!should_auto_pause(
            Some(old_la),
            Some(IDLE_AUTO_PAUSE_MS),
            now
        ));
        // 超阈值 → 暂停
        assert!(should_auto_pause(Some(old_la), Some(11 * 60 * 1000), now));
        // 卡 last_active_at 在 idle 起点之后(空闲前还在动)→ 不暂停
        assert!(!should_auto_pause(
            Some(now - 5 * 60 * 1000),
            Some(11 * 60 * 1000),
            now
        ));
        // 无 last_active_at / 无 idle(非 Windows fallback)→ 不暂停
        assert!(!should_auto_pause(None, Some(11 * 60 * 1000), now));
        assert!(!should_auto_pause(Some(old_la), None, now));
    }

    // 自动暂停调用路径:mock last_input(idle 固定值) → 陈旧卡被 pause,新卡保持 active
    #[test]
    fn scan_pauses_stale_active_and_keeps_fresh() {
        let conn = fresh_db();
        let now = crate::db::time::now_ms();
        let stale = insert_active(&conn, "老任务", now - 20 * 60 * 1000);
        let fresh = insert_active(&conn, "新任务", now - 1000);

        let paused = scan_and_auto_pause(&conn, Some(11 * 60 * 1000), now).unwrap();

        let paused_ids: Vec<i64> = paused.iter().map(|it| it.id).collect();
        assert!(paused_ids.contains(&stale));
        assert!(!paused_ids.contains(&fresh));

        let stale_after = item::get_by_id(&conn, stale).unwrap().unwrap();
        assert_eq!(stale_after.status, "todo");
        assert!(stale_after.pending_ms.is_none());
        let fresh_after = item::get_by_id(&conn, fresh).unwrap().unwrap();
        assert_eq!(fresh_after.status, "active");
    }

    #[test]
    fn scan_skips_when_idle_unknown() {
        let conn = fresh_db();
        let now = crate::db::time::now_ms();
        let stale = insert_active(&conn, "老任务", now - 20 * 60 * 1000);
        let paused = scan_and_auto_pause(&conn, None, now).unwrap();
        assert!(paused.is_empty());
        let after = item::get_by_id(&conn, stale).unwrap().unwrap();
        assert_eq!(after.status, "active");
    }
}
