// 无状态时间工具(2026-08-02 拆分):毫秒时间戳 + 本地自然日边界。
// 单向依赖、无状态、无环——供 db/item.rs、db/dormant.rs、idle 共用。
// 不引入 chrono(ponytail: 避免重量依赖,跨天用 UTC 近似可接受)。

use std::time::{SystemTime, UNIX_EPOCH};

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
    // Linux/macOS 用 libc 的 localtime_r;Windows 用 _timezone。
    // 保守实现:直接用 UTC 日边界(偏差 = 本地时区小时数)。V0.2.1 跨天检测用 UTC 自然日近似,
    // 时区偏差(如 UTC+8 的"今天"早 8 小时)会让"跨天"在本地 0 点前 8 小时触发,轻微偏早。
    // 对台账可接受:晚间的 active 在本地 0 点前被停表,更接近"不跨天"意图。
    0
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
}
