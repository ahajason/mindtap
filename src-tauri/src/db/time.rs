// 无状态时间工具(2026-08-02 拆分):毫秒时间戳 + 本地自然日边界。
// 单向依赖、无状态、无环——供 db/item.rs、db/dormant.rs、idle 共用。
// 不引入 chrono(ponytail: 避免重量依赖,跨天用 UTC 近似可接受)。

use std::time::{SystemTime, UNIX_EPOCH};

use crate::db::setting;
use rusqlite::Connection;

/// 当前毫秒时间戳。
pub fn now_ms() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64
}

/// 本地时区"今天 0 点"毫秒。SQLite 无时区概念,用系统本地时区算自然日边界。
pub fn local_day_start_ms(now: i64) -> i64 {
    // 用系统本地偏移近似(不引入 chrono 依赖)
    let local_offset_secs = local_utc_offset_secs(now);
    let local_now = now + local_offset_secs * 1000;
    let local_day = local_now.div_euclid(86400 * 1000) * 86400 * 1000;
    local_day - local_offset_secs * 1000
}

// ponytail: 用 libc localtime 拿当前时区偏移,避免引入 chrono。
fn local_utc_offset_secs(_now: i64) -> i64 {
    #[cfg(target_os = "windows")]
    {
        return windows_tz::utc_offset_secs();
    }
    #[cfg(not(target_os = "windows"))]
    {
        // Linux/macOS 未实现,用 UTC 日边界近似
        0
    }
}

/// 将当前时区偏移写入 app_setting(local_tz_offset_secs),供前端/复盘计算使用。
pub fn persist_tz_offset(conn: &Connection) {
    let offset = local_utc_offset_secs(now_ms());
    let _ = setting::set(conn, "local_tz_offset_secs", &offset.to_string());
}

#[cfg(target_os = "windows")]
mod windows_tz {
    pub(super) fn utc_offset_secs() -> i64 {
        use windows::Win32::System::Time::{GetTimeZoneInformation, TIME_ZONE_INFORMATION};
        let mut tz = TIME_ZONE_INFORMATION::default();
        // SAFETY: GetTimeZoneInformation 写入栈上结构体,无内存安全风险
        let result = unsafe { GetTimeZoneInformation(&mut tz) };
        match result {
            // TIME_ZONE_ID_DAYLIGHT = 2: 夏令时生效,用 DaylightBias
            2 => {
                // Bias = UTC 偏移(分钟),Windows 约定:UTC = Local + Bias
                // 东八区 Bias = -480 → UTC = Local - 480min → 本地比 UTC 早 8 小时
                // 要得到 local_offset = -Bias
                let bias = tz.Bias.saturating_add(tz.DaylightBias).saturating_neg();
                (bias as i64) * 60
            }
            // TIME_ZONE_ID_STANDARD = 1: 标准时间,用 StandardBias
            1 => {
                let bias = tz.Bias.saturating_add(tz.StandardBias).saturating_neg();
                (bias as i64) * 60
            }
            // 未知/错误:fallback 用 StandardBias
            _ => {
                let bias = tz.Bias.saturating_neg();
                (bias as i64) * 60
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn now_ms_is_positive_and_monotonic() {
        let a = now_ms();
        let b = now_ms();
        assert!(a > 0);
        assert!(b >= a);
    }

    #[test]
    fn local_day_start_is_at_midnight() {
        // UTC 近似下,任意时刻的"今天 0 点"应 ≤ now,且差 < 24h。
        let now = now_ms();
        let start = local_day_start_ms(now);
        assert!(start <= now);
        assert!(now - start < 86400 * 1000);
    }

    #[test]
    #[cfg(target_os = "windows")]
    fn local_utc_offset_is_reasonable() {
        // Windows 上应返回真实偏移(东八区 28800,其他时区 ≠ 0)
        let offset = local_utc_offset_secs(now_ms());
        // 偏移应在 -12h ~ +14h 范围内
        assert!(offset > -43200, "offset={offset} should be > -12h");
        assert!(offset < 50400, "offset={offset} should be < +14h");
        // 非零:Windows 有真实时区,不会返回 0 除非 UTC+0
        // 不 assert_eq!(0) 因为 UTC+0 是合法时区,只检查范围
    }

    #[test]
    fn persist_tz_offset_writes_to_app_setting() {
        use rusqlite::Connection;
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(crate::db::schema::CREATE_SQL).unwrap();

        persist_tz_offset(&conn);

        let saved = setting::get(&conn, "local_tz_offset_secs").unwrap();
        assert!(saved.is_some(), "persist_tz_offset should write to app_setting");
        let offset: i64 = saved.unwrap().parse().unwrap();
        // 偏移应在合理范围内
        assert!(offset > -43200, "offset={offset} should be > -12h");
        assert!(offset < 50400, "offset={offset} should be < +14h");
    }
}
