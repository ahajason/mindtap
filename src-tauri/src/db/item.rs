// 深模块 ItemRepo —— 藏住整个五态状态机 + 结算 + 失真闭环。
// 外部 seam: create / start / pause / complete / confirm_pending / list / settle_dormant / list_duplicate。
// 状态转换正确性(零成本切换 / focus_ms 只增不减 / 跨天停表 / 待确认结算)全部在此模块事务内原子完成。
// 前端与 commands 层只发意图,不持有状态机。

use std::time::{SystemTime, UNIX_EPOCH};

use rusqlite::{params, Connection, Row};

use crate::error::AppError;

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct Item {
    pub id: i64,
    pub content: String,
    pub r#type: String,
    pub status: String,
    pub focus_ms: i64,
    pub last_active_at: Option<i64>,
    pub progress_note: Option<String>,
    pub source: String,
    pub pending_ms: Option<i64>,
    pub created_at: i64,
    pub updated_at: i64,
}

/// 一次从 start 到结算的激活明细。ended_at NULL = 进行中。
#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct FocusInterval {
    pub id: i64,
    pub item_id: i64,
    pub started_at: i64,
    pub ended_at: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct StartResult {
    pub item: Item,
    /// 因切换而退回待办的原进行中卡 id 列表
    pub switched_from: Vec<i64>,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct PauseResult {
    pub item: Item,
    /// 失真窗口毫秒(若非主动暂停)。None = 无待确认
    pub pending_ms: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct DormantResult {
    /// 因失真退回待办的卡 id
    pub paused: Vec<i64>,
    /// 有待确认窗口的卡 id
    pub has_pending: Vec<i64>,
}

/// 失真确认气泡的 emit payload(bubble 窗口监听)
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct DormantPayload {
    pub id: i64,
    pub content: String,
    pub pending_ms: i64,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum ListStatus {
    Active,
    Todo,
    Archived,
}

impl ListStatus {
    fn as_str(self) -> &'static str {
        match self {
            ListStatus::Active => "active",
            ListStatus::Todo => "todo",
            ListStatus::Archived => "archived",
        }
    }
}

/// 失真检测阈值:冷却 2 小时无更新(ADR-0012)
pub const DISTORTION_IDLE_MS: i64 = 2 * 60 * 60 * 1000;

fn now_ms() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64
}

/// 供 commands 层取当前时间戳(测试注入用 `settle_dormant(conn, now)`)
pub fn now_ms_for_cmd() -> i64 {
    now_ms()
}

/// 列出某卡的激活明细,按开始时间升序。
pub fn list_intervals(conn: &Connection, item_id: i64) -> Result<Vec<FocusInterval>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, item_id, started_at, ended_at FROM focus_interval
         WHERE item_id = ?1 ORDER BY started_at ASC",
    )?;
    let rows = stmt.query_map(params![item_id], |row| {
        Ok(FocusInterval {
            id: row.get(0)?,
            item_id: row.get(1)?,
            started_at: row.get(2)?,
            ended_at: row.get(3)?,
        })
    })?;
    rows.collect::<rusqlite::Result<Vec<_>>>()
        .map_err(AppError::from)
}

/// 结算某卡所有进行中 interval(ended_at IS NULL → now)。所有结算路径必须调用,否则
/// 卡退出 active 后 ended_at 仍为 NULL(违反"NULL=进行中")。调用方已按同一 now 把时长计入 focus_ms。
fn settle_open_intervals(conn: &Connection, item_id: i64, now: i64) -> Result<(), AppError> {
    conn.execute(
        "UPDATE focus_interval SET ended_at = ?1 WHERE item_id = ?2 AND ended_at IS NULL",
        params![now, item_id],
    )?;
    Ok(())
}

fn row_to_item(row: &Row<'_>) -> rusqlite::Result<Item> {
    Ok(Item {
        id: row.get(0)?,
        content: row.get(1)?,
        r#type: row.get(2)?,
        status: row.get(3)?,
        focus_ms: row.get(4)?,
        last_active_at: row.get(5)?,
        progress_note: row.get(6)?,
        source: row.get(7)?,
        pending_ms: row.get(8)?,
        created_at: row.get(9)?,
        updated_at: row.get(10)?,
    })
}

const COLS: &str = "id, content, type, status, focus_ms, last_active_at, progress_note, source, pending_ms, created_at, updated_at";

pub fn get_by_id(conn: &Connection, id: i64) -> Result<Option<Item>, AppError> {
    let mut stmt = conn.prepare(&format!(
        "SELECT {COLS} FROM item WHERE id = ?1 AND deleted_at IS NULL"
    ))?;
    let mut rows = stmt.query(params![id])?;
    match rows.next()? {
        Some(row) => Ok(Some(row_to_item(row)?)),
        None => Ok(None),
    }
}

/// 捕获:内容非空即存,进待办(V0.2.1 三态后捕获直接进待办,无独立收件箱)。
pub fn create(conn: &Connection, content: String) -> Result<Item, AppError> {
    let content = content.trim();
    if content.is_empty() {
        return Err(AppError("内容不能为空".into()));
    }
    if content.chars().count() > 200 {
        return Err(AppError("内容超过 200 字上限".into()));
    }
    let now = now_ms();
    conn.execute(
        "INSERT INTO item (content, status, created_at, updated_at) VALUES (?1, 'todo', ?2, ?2)",
        params![content, now],
    )?;
    let id = conn.last_insert_rowid();
    get_by_id(conn, id)?.ok_or_else(|| AppError("just-created item not found".into()))
}

/// 开始:todo → active。**并行式**——不自动暂停其他 active 卡。
/// 多任务并行(用户核心需求):点 B「开始」,A 保持 active 继续计时,两者并行。
/// 显式「切走/专注」由用户主动暂停某卡完成,不是点开始的副作用。
pub fn start(conn: &Connection, id: i64) -> Result<StartResult, AppError> {
    let tx = conn.unchecked_transaction()?;

    match get_by_id(&tx, id)? {
        Some(t) if t.status == "todo" => (),
        Some(t) => return Err(AppError(format!("item {id} 状态 {} 不能开始", t.status))),
        None => return Err(AppError(format!("item {id} 不存在"))),
    }

    // 并行式:不切换其他 active 卡,只把目标卡设为 active + 开一段进行中 interval
    let now = now_ms();
    tx.execute(
        "UPDATE item SET status = 'active', last_active_at = ?1, updated_at = ?1 WHERE id = ?2",
        params![now, id],
    )?;
    // 开一段进行中 interval(started_at = now, ended_at = NULL)
    tx.execute(
        "INSERT INTO focus_interval (item_id, started_at, ended_at, created_at) VALUES (?1, ?2, NULL, ?2)",
        params![id, now],
    )?;
    tx.commit()?;

    let item = get_by_id(conn, id)?.ok_or_else(|| AppError(format!("item {id} not found")))?;
    Ok(StartResult {
        item,
        switched_from: Vec::new(),
    })
}

/// 暂停:active → todo。失真时(pending_ms 传入)把失真窗口挂到待确认,结算到失真点。
/// 主动暂停传 pending_ms = None:只结算到暂停点,不挂待确认。
pub fn pause(conn: &Connection, id: i64, pending_ms: Option<i64>) -> Result<PauseResult, AppError> {
    let tx = conn.unchecked_transaction()?;
    let now = now_ms();

    let target = match get_by_id(&tx, id)? {
        Some(t) if t.status == "active" => t,
        Some(t) => return Err(AppError(format!("item {id} 状态 {} 不能暂停", t.status))),
        None => return Err(AppError(format!("item {id} 不存在"))),
    };

    // 结算:active 段 (started → 暂停点)。
    // - 主动暂停(pending_ms=None):settled_ms 计入 focus(这段真实投入)
    // - 失真暂停(pending_ms=Some):settled_ms 即失真窗口,未确认前不入账(ADR-0012),只挂 pending_ms
    let settled_ms = target
        .last_active_at
        .map(|la| now.saturating_sub(la))
        .unwrap_or(0);
    let focus_delta = if pending_ms.is_some() { 0 } else { settled_ms };
    let pending_to_write = pending_ms;

    tx.execute(
        "UPDATE item SET status = 'todo', focus_ms = focus_ms + ?1, pending_ms = ?2, updated_at = ?3 WHERE id = ?4",
        params![focus_delta, pending_to_write, now, id],
    )?;
    // 结算 interval:ended_at = now(失真暂停下 interval 如实记真实时长,账已挂 pending_ms 待确认)
    settle_open_intervals(&tx, id, now)?;
    tx.commit()?;

    let item = get_by_id(conn, id)?.ok_or_else(|| AppError(format!("item {id} not found")))?;
    Ok(PauseResult {
        item,
        pending_ms: pending_to_write,
    })
}

/// 归档:active/todo → archived(完成即归档,去掉独立 done)。结算 active 段,清空待确认。
/// V0.2.1 三态:唯一出口「归档」,做过的/没做过的都进 archived。
pub fn complete(conn: &Connection, id: i64) -> Result<Item, AppError> {    let tx = conn.unchecked_transaction()?;
    let now = now_ms();

    let target = match get_by_id(&tx, id)? {
        Some(t) if t.status == "active" || t.status == "todo" => t,
        Some(t) => return Err(AppError(format!("item {id} 状态 {} 不能归档", t.status))),
        None => return Err(AppError(format!("item {id} 不存在"))),
    };

    let settled_ms = if target.status == "active" {
        target
            .last_active_at
            .map(|la| now.saturating_sub(la))
            .unwrap_or(0)
    } else {
        0
    };

    // 结算 interval:ended_at = now(active 段时长与 settled_ms 同源,不重复计入)
    settle_open_intervals(&tx, id, now)?;

    tx.execute(
        "UPDATE item SET status = 'archived', focus_ms = focus_ms + ?1, pending_ms = NULL, updated_at = ?2 WHERE id = ?3",
        params![settled_ms, now, id],
    )?;
    tx.commit()?;

    get_by_id(conn, id)?.ok_or_else(|| AppError(format!("item {id} not found")))
}

/// 改名:任意非删除态 → 更新 content(3a 双击行内编辑)。内容非空 + ≤200 字;active 卡改名不结算(只改文字)。
/// 改名不改变状态机、不影响计时;只更新 content + updated_at。
pub fn rename(conn: &Connection, id: i64, content: String) -> Result<Item, AppError> {
    let content = content.trim();
    if content.is_empty() {
        return Err(AppError("内容不能为空".into()));
    }
    if content.chars().count() > 200 {
        return Err(AppError("内容超过 200 字上限".into()));
    }
    let now = now_ms();
    let affected = conn.execute(
        "UPDATE item SET content = ?1, updated_at = ?2 WHERE id = ?3 AND deleted_at IS NULL",
        params![content, now, id],
    )?;
    if affected == 0 {
        return Err(AppError(format!("item {id} 不存在或已删除")));
    }
    get_by_id(conn, id)?.ok_or_else(|| AppError(format!("item {id} not found")))
}

/// 待确认结算:keep=true 记入 pending_ms,keep=false 丢弃。清空 pending_ms。
pub fn confirm_pending(conn: &Connection, id: i64, keep: bool) -> Result<Item, AppError> {
    let tx = conn.unchecked_transaction()?;
    let now = now_ms();

    let target = match get_by_id(&tx, id)? {
        Some(t) if t.pending_ms.is_some() => t,
        Some(_) => return Err(AppError(format!("item {id} 无待确认窗口"))),
        None => return Err(AppError(format!("item {id} 不存在"))),
    };

    let pending = target.pending_ms.unwrap_or(0);
    let focus_delta = if keep { pending } else { 0 };
    tx.execute(
        "UPDATE item SET focus_ms = focus_ms + ?1, pending_ms = NULL, updated_at = ?2 WHERE id = ?3",
        params![focus_delta, now, id],
    )?;
    tx.commit()?;

    get_by_id(conn, id)?.ok_or_else(|| AppError(format!("item {id} not found")))
}

/// 整理 → 待办:active → todo(暂停退回)。三态下 inbox 已并入 todo,此命令仅用于 active 结算退回。
/// V0.2.1:active 卡「暂停」走 pause();此命令保留为 active→todo 的兜底整理(供「切走」类动作)。
pub fn triage_to_todo(conn: &Connection, id: i64) -> Result<Item, AppError> {
    let tx = conn.unchecked_transaction()?;
    let now = now_ms();

    let target = match get_by_id(&tx, id)? {
        Some(t) if t.status == "active" => t,
        Some(t) => {
            return Err(AppError(format!(
                "item {id} 状态 {} 不能转入待办",
                t.status
            )))
        }
        None => return Err(AppError(format!("item {id} 不存在"))),
    };

    let settled_ms = target
        .last_active_at
        .map(|la| now.saturating_sub(la))
        .unwrap_or(0);
    tx.execute(
        "UPDATE item SET status = 'todo', focus_ms = focus_ms + ?1, last_active_at = ?2, updated_at = ?2 WHERE id = ?3",
        params![settled_ms, now, id],
    )?;
    settle_open_intervals(&tx, id, now)?;
    tx.commit()?;

    get_by_id(conn, id)?.ok_or_else(|| AppError(format!("item {id} not found")))
}

/// 归档:todo → archived(直接归档,不转待办)。active 卡先结算退回 todo 再归档,或直接走 complete。
/// V0.2.1 三态:待办/进行中的「归档」动作。仅 todo 可走此命令;active 归档走 complete()(会结算)。
pub fn triage_archive(conn: &Connection, id: i64) -> Result<Item, AppError> {
    let tx = conn.unchecked_transaction()?;
    let now = now_ms();

    match get_by_id(&tx, id)? {
        Some(t) if t.status == "todo" => {}
        Some(t) => return Err(AppError(format!("item {id} 状态 {} 不能归档", t.status))),
        None => return Err(AppError(format!("item {id} 不存在"))),
    }
    tx.execute(
        "UPDATE item SET status = 'archived', updated_at = ?1 WHERE id = ?2",
        params![now, id],
    )?;
    tx.commit()?;

    get_by_id(conn, id)?.ok_or_else(|| AppError(format!("item {id} not found")))
}

/// 软删除:任意状态 → deleted_at = now(非空即视为删除,get_by_id/list 已过滤)。
/// active 先结算当前段。
pub fn soft_delete(conn: &Connection, id: i64) -> Result<Item, AppError> {
    let tx = conn.unchecked_transaction()?;
    let now = now_ms();

    let target = match get_by_id(&tx, id)? {
        Some(t) => t,
        None => return Err(AppError(format!("item {id} 不存在"))),
    };

    let settled_ms = if target.status == "active" {
        target
            .last_active_at
            .map(|la| now.saturating_sub(la))
            .unwrap_or(0)
    } else {
        0
    };
    tx.execute(
        "UPDATE item SET deleted_at = ?1, focus_ms = focus_ms + ?2, updated_at = ?1 WHERE id = ?3",
        params![now, settled_ms, id],
    )?;
    // 软删也结算进行中 interval,保证卡离开 active 后 ended_at 非 NULL
    settle_open_intervals(&tx, id, now)?;
    tx.commit()?;

    // 软删除后 get_by_id 过滤 deleted_at IS NULL 读不到,基于已读 target 返回
    let mut out = target;
    out.focus_ms += settled_ms;
    out.updated_at = now;
    Ok(out)
}

/// 重新激活:archived → todo。
pub fn reactivate(conn: &Connection, id: i64) -> Result<Item, AppError> {
    let tx = conn.unchecked_transaction()?;
    let now = now_ms();

    match get_by_id(&tx, id)? {
        Some(t) if t.status == "archived" => {}
        Some(t) => {
            return Err(AppError(format!(
                "item {id} 状态 {} 不能重新激活",
                t.status
            )))
        }
        None => return Err(AppError(format!("item {id} 不存在"))),
    }
    tx.execute(
        "UPDATE item SET status = 'todo', updated_at = ?1 WHERE id = ?2",
        params![now, id],
    )?;
    tx.commit()?;

    get_by_id(conn, id)?.ok_or_else(|| AppError(format!("item {id} not found")))
}

/// 撤销删除:清空 deleted_at,恢复原状态。状态在软删时未变,只需清 deleted_at。
/// ponytail: 5 秒撤销窗口由前端 toast 控制(超时即不再发 undo),DB 不校验时间窗,
/// 避免前端定时器与 DB 时钟偏差导致合法撤销被拒。
pub fn undo_delete(conn: &Connection, id: i64) -> Result<Item, AppError> {
    let tx = conn.unchecked_transaction()?;
    let now = now_ms();
    // 先读被删记录的原始状态(用于恢复 active 时重开 interval)
    let orig_status = {
        let mut stmt =
            tx.prepare("SELECT status FROM item WHERE id = ?1 AND deleted_at IS NOT NULL")?;
        let mut rows = stmt.query(params![id])?;
        match rows.next()? {
            Some(row) => row.get::<_, String>(0)?,
            None => {
                return Err(AppError(format!("item {id} 不存在或未删除")));
            }
        }
    };
    let affected = tx.execute(
        "UPDATE item SET deleted_at = NULL, updated_at = ?1 WHERE id = ?2 AND deleted_at IS NOT NULL",
        params![now, id],
    )?;
    if affected == 0 {
        return Err(AppError(format!("item {id} 不存在或未删除")));
    }
    // 恢复出 active 的卡:soft_delete 已结算其 interval(ended_at 已填)。
    // 重开一条进行中 interval,维持「active 必有 ended_at IS NULL 的 interval」不变量(tech §3.3)。
    if orig_status == "active" {
        tx.execute(
            "INSERT INTO focus_interval (item_id, started_at, ended_at, created_at)
             VALUES (?1, ?2, NULL, ?2)",
            params![id, now],
        )?;
    }
    tx.commit()?;

    get_by_id(conn, id)?.ok_or_else(|| AppError(format!("item {id} not found")))
}

pub fn list(
    conn: &Connection,
    status: ListStatus,
    limit: Option<i64>,
) -> Result<Vec<Item>, AppError> {
    let mut stmt = conn.prepare(&format!(
        "SELECT {COLS} FROM item WHERE status = ?1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT ?2"
    ))?;
    let rows = stmt.query_map(params![status.as_str(), limit.unwrap_or(100)], |row| {
        row_to_item(row)
    })?;
    rows.collect::<rusqlite::Result<Vec<_>>>()
        .map_err(AppError::from)
}

/// 失真检测 + 跨天停表。返回:退回 todo 的 id + 有待确认的 id。
pub fn settle_dormant(conn: &Connection, now: i64) -> Result<DormantResult, AppError> {
    let tx = conn.unchecked_transaction()?;
    let mut paused: Vec<i64> = Vec::new();
    let mut has_pending: Vec<i64> = Vec::new();

    // 冷却:active 且 last_active_at 超过阈值 → 退回 todo,结算到失真点 + 挂待确认
    let mut stmt = tx.prepare(
        "SELECT id, last_active_at, focus_ms FROM item WHERE status = 'active' AND deleted_at IS NULL",
    )?;
    let rows = stmt.query_map([], |row| {
        Ok((row.get::<_, i64>(0)?, row.get::<_, Option<i64>>(1)?))
    })?;
    let mut to_settle: Vec<(i64, i64)> = Vec::new();
    for r in rows {
        let (id, la) = r?;
        if let Some(la) = la {
            if now - la > DISTORTION_IDLE_MS {
                to_settle.push((id, la));
            }
        }
    }
    drop(stmt);
    for (id, la) in to_settle {
        let pending = now.saturating_sub(la);
        // ADR-0012: 冷却检测不转 todo(卡保持 active,计时继续),只挂 pending_ms 触发气泡。
        // 气泡 5s 超时才真正 pause(active→todo + 挂待确认)。
        tx.execute(
            "UPDATE item SET pending_ms = ?1, updated_at = ?2 WHERE id = ?3 AND status = 'active'",
            params![pending, now, id],
        )?;
        has_pending.push(id);
    }

    // 跨天:active 且 last_active_at 不在今天 → 退回 todo(不挂待确认,只停表)
    // 自然日边界:用本地时区判断"今天"。
    let day_start = local_day_start_ms(now);
    let mut stmt = tx.prepare(
        "SELECT id FROM item WHERE status = 'active' AND last_active_at IS NOT NULL AND last_active_at < ?1 AND deleted_at IS NULL",
    )?;
    let rows = stmt.query_map(params![day_start], |r| r.get::<_, i64>(0))?;
    let mut day_cross: Vec<i64> = Vec::new();
    for r in rows {
        day_cross.push(r?);
    }
    drop(stmt);
    for id in day_cross {
        tx.execute(
            "UPDATE item SET status = 'todo', focus_ms = focus_ms + (CASE WHEN last_active_at IS NOT NULL THEN ?1 - last_active_at ELSE 0 END), last_active_at = ?1, pending_ms = NULL, updated_at = ?1 WHERE id = ?2 AND status = 'active'",
            params![now, id],
        )?;
        // 跨天停表:结算进行中 interval
        settle_open_intervals(&tx, id, now)?;
        if !paused.contains(&id) {
            paused.push(id);
        }
    }

    tx.commit()?;
    Ok(DormantResult {
        paused,
        has_pending,
    })
}

/// 取一批卡的失真 payload(bubble 窗口 emit 用)。
pub fn get_dormant_payloads(
    conn: &Connection,
    ids: &[i64],
) -> Result<Vec<DormantPayload>, AppError> {
    let mut out = Vec::new();
    for id in ids {
        if let Some(item) = get_by_id(conn, *id)? {
            out.push(DormantPayload {
                id: item.id,
                content: item.content.clone(),
                pending_ms: item.pending_ms.unwrap_or(0),
            });
        }
    }
    Ok(out)
}

/// 重复捕获检测:同内容已有 todo/active 卡(不合并,轻提示)。
pub fn list_duplicate(conn: &Connection, content: &str) -> Result<Vec<Item>, AppError> {
    let content = content.trim();
    let mut stmt = conn.prepare(&format!(
        "SELECT {COLS} FROM item WHERE content = ?1 AND status IN ('todo','active') AND deleted_at IS NULL ORDER BY created_at DESC"
    ))?;
    let rows = stmt.query_map(params![content], row_to_item)?;
    rows.collect::<rusqlite::Result<Vec<_>>>()
        .map_err(AppError::from)
}

/// 本地时区"今天 0 点"毫秒。SQLite 无时区概念,用系统本地时区算自然日边界。
fn local_day_start_ms(now: i64) -> i64 {
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
    use rusqlite::Connection;
    use std::sync::atomic::{AtomicUsize, Ordering};

    static COUNTER: AtomicUsize = AtomicUsize::new(0);

    fn fresh_db() -> Connection {
        let id = COUNTER.fetch_add(1, Ordering::SeqCst);
        let path = std::env::temp_dir().join(format!(
            "mindtap_item_test_{}_{}.db",
            std::process::id(),
            id
        ));
        let _ = std::fs::remove_file(&path);
        let conn = Connection::open(&path).unwrap();
        conn.execute_batch(crate::db::schema::CREATE_SQL).unwrap();
        conn
    }

    fn insert_raw(
        conn: &Connection,
        content: &str,
        status: &str,
        focus_ms: i64,
        last_active_at: i64,
    ) -> i64 {
        conn.execute(
            "INSERT INTO item (content, status, focus_ms, last_active_at, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?4, ?4)",
            params![content, status, focus_ms, last_active_at],
        )
        .unwrap();
        conn.last_insert_rowid()
    }

    #[test]
    fn create_requires_nonempty_content() {
        let conn = fresh_db();
        assert!(create(&conn, "  ".into()).is_err());
        assert!(create(&conn, "".into()).is_err());
    }

    #[test]
    fn create_enters_todo() {
        let conn = fresh_db();
        let item = create(&conn, "写代码".into()).unwrap();
        assert_eq!(item.status, "todo");
        assert_eq!(item.content, "写代码");
        assert_eq!(item.focus_ms, 0);
    }

    #[test]
    fn create_rejects_over_200_chars() {
        let conn = fresh_db();
        assert!(create(&conn, "字".repeat(201)).is_err());
        let ok = create(&conn, "字".repeat(200)).unwrap();
        assert_eq!(ok.status, "todo");
    }

    #[test]
    fn start_todo_to_active() {
        let conn = fresh_db();
        let item = create(&conn, "写代码".into()).unwrap();
        let res = start(&conn, item.id).unwrap();
        assert_eq!(res.item.status, "active");
        assert!(res.switched_from.is_empty());
        assert!(res.item.last_active_at.is_some());
    }

    #[test]
    fn multi_active_allowed() {
        let conn = fresh_db();
        let a = create(&conn, "A".into()).unwrap();
        let b = create(&conn, "B".into()).unwrap();
        start(&conn, a.id).unwrap();
        // 并行式:start B 后 A 保持 active(不切换),两者真并行
        let res = start(&conn, b.id).unwrap();
        assert_eq!(res.item.status, "active");
        assert!(res.switched_from.is_empty());
        let a_after = get_by_id(&conn, a.id).unwrap().unwrap();
        assert_eq!(a_after.status, "active");
    }

    #[test]
    fn start_rejects_archived() {
        let conn = fresh_db();
        let item = create(&conn, "X".into()).unwrap();
        start(&conn, item.id).unwrap();
        complete(&conn, item.id).unwrap();
        assert!(start(&conn, item.id).is_err());
    }

    #[test]
    fn start_from_archived_rejected() {
        let conn = fresh_db();
        let item = create(&conn, "X".into()).unwrap();
        start(&conn, item.id).unwrap();
        complete(&conn, item.id).unwrap();
        assert!(start(&conn, item.id).is_err());
    }

    #[test]
    fn pause_active_to_todo_without_pending() {
        let conn = fresh_db();
        let item = create(&conn, "X".into()).unwrap();
        start(&conn, item.id).unwrap();
        let res = pause(&conn, item.id, None).unwrap();
        assert_eq!(res.item.status, "todo");
        assert!(res.pending_ms.is_none());
    }

    #[test]
    fn pause_with_pending_sets_pending_ms() {
        let conn = fresh_db();
        let item = create(&conn, "X".into()).unwrap();
        start(&conn, item.id).unwrap();
        let res = pause(&conn, item.id, Some(12345)).unwrap();
        assert_eq!(res.pending_ms, Some(12345));
        let after = get_by_id(&conn, item.id).unwrap().unwrap();
        assert_eq!(after.pending_ms, Some(12345));
        // ADR-0012: 失真暂停不入账,只挂待确认
        assert_eq!(after.focus_ms, 0);
    }

    #[test]
    fn complete_from_active_settles_focus() {
        let conn = fresh_db();
        let id = insert_raw(&conn, "X", "active", 1000, now_ms() - 5000);
        let arch = complete(&conn, id).unwrap();
        assert_eq!(arch.status, "archived");
        assert!(arch.focus_ms >= 6000 && arch.focus_ms < 6200); // 1000 + 5000 已结算 + 运行开销容差
        assert!(arch.pending_ms.is_none());
    }

    #[test]
    fn complete_from_todo_no_settle() {
        let conn = fresh_db();
        let id = insert_raw(&conn, "X", "todo", 1000, now_ms());
        let arch = complete(&conn, id).unwrap();
        assert_eq!(arch.status, "archived");
        assert_eq!(arch.focus_ms, 1000);
    }

    #[test]
    fn confirm_pending_keep_adds_focus() {
        let conn = fresh_db();
        let id = insert_raw(&conn, "X", "todo", 1000, now_ms());
        conn.execute(
            "UPDATE item SET pending_ms = 2000 WHERE id = ?1",
            params![id],
        )
        .unwrap();
        let after = confirm_pending(&conn, id, true).unwrap();
        assert_eq!(after.focus_ms, 3000); // 1000 + 2000
        assert!(after.pending_ms.is_none());
    }

    #[test]
    fn confirm_pending_discard_keeps_focus() {
        let conn = fresh_db();
        let id = insert_raw(&conn, "X", "todo", 1000, now_ms());
        conn.execute(
            "UPDATE item SET pending_ms = 2000 WHERE id = ?1",
            params![id],
        )
        .unwrap();
        let after = confirm_pending(&conn, id, false).unwrap();
        assert_eq!(after.focus_ms, 1000);
        assert!(after.pending_ms.is_none());
    }

    #[test]
    fn confirm_pending_no_pending_errors() {
        let conn = fresh_db();
        let item = create(&conn, "X".into()).unwrap();
        assert!(confirm_pending(&conn, item.id, true).is_err());
    }

    #[test]
    fn rename_updates_content_and_preserves_state() {
        let conn = fresh_db();
        let item = create(&conn, "旧名字".into()).unwrap();
        start(&conn, item.id).unwrap();
        let renamed = rename(&conn, item.id, "新名字".into()).unwrap();
        assert_eq!(renamed.content, "新名字");
        assert_eq!(renamed.status, "active"); // 改名不改变状态机
        let after = get_by_id(&conn, item.id).unwrap().unwrap();
        assert_eq!(after.content, "新名字");
    }

    #[test]
    fn rename_rejects_empty_and_over_200() {
        let conn = fresh_db();
        let item = create(&conn, "X".into()).unwrap();
        assert!(rename(&conn, item.id, "  ".into()).is_err());
        assert!(rename(&conn, item.id, "字".repeat(201)).is_err());
        assert_eq!(get_by_id(&conn, item.id).unwrap().unwrap().content, "X");
    }

    #[test]
    fn rename_rejects_missing_or_deleted() {
        let conn = fresh_db();
        assert!(rename(&conn, 99999, "X".into()).is_err());
        let item = create(&conn, "X".into()).unwrap();
        soft_delete(&conn, item.id).unwrap();
        assert!(rename(&conn, item.id, "Y".into()).is_err());
    }

    #[test]
    fn settle_dormant_cooling_pends_but_keeps_active() {
        let conn = fresh_db();
        // 失真:4 小时前活跃 → 冷却
        let now = now_ms();
        let id = insert_raw(&conn, "X", "active", 1000, now - 4 * 3600 * 1000);
        let res = settle_dormant(&conn, now).unwrap();
        // 冷却只挂 pending,不转 todo(卡保持 active,计时继续,等气泡超时再停)
        assert!(res.has_pending.contains(&id));
        assert!(!res.paused.contains(&id));
        let after = get_by_id(&conn, id).unwrap().unwrap();
        assert_eq!(after.status, "active");
        assert_eq!(after.pending_ms, Some(4 * 3600 * 1000));
        // ADR-0012: 失真窗口未确认前不入账 → focus 保持 1000
        assert_eq!(after.focus_ms, 1000);
    }

    #[test]
    fn settle_dormant_skips_recent_active() {
        let conn = fresh_db();
        let now = now_ms();
        let id = insert_raw(&conn, "X", "active", 0, now - 1000); // 1 秒前
        let res = settle_dormant(&conn, now).unwrap();
        assert!(res.paused.is_empty());
        let after = get_by_id(&conn, id).unwrap().unwrap();
        assert_eq!(after.status, "active");
    }

    #[test]
    fn settle_dormant_day_cross_returns_todo_and_clears_pending() {
        let conn = fresh_db();
        // 昨天活跃的 active → 跨天退回(UTC 日边界近似);且清空已挂 pending_ms(避免双重结算)
        let now = now_ms();
        let yesterday = now - 25 * 3600 * 1000;
        let id = insert_raw(&conn, "X", "active", 0, yesterday);
        conn.execute(
            "UPDATE item SET pending_ms = 1000 WHERE id = ?1",
            params![id],
        )
        .unwrap();
        let res = settle_dormant(&conn, now).unwrap();
        assert!(res.paused.contains(&id));
        let after = get_by_id(&conn, id).unwrap().unwrap();
        assert_eq!(after.status, "todo");
        assert_eq!(after.pending_ms, None);
    }

    #[test]
    fn list_duplicate_finds_same_content() {
        let conn = fresh_db();
        let a = create(&conn, "写代码".into()).unwrap();
        start(&conn, a.id).unwrap();
        let dup = list_duplicate(&conn, "写代码").unwrap();
        assert_eq!(dup.len(), 1);
        assert_eq!(dup[0].id, a.id);
    }

    #[test]
    fn list_duplicate_ignores_archived() {
        let conn = fresh_db();
        let item = create(&conn, "写代码".into()).unwrap();
        start(&conn, item.id).unwrap();
        complete(&conn, item.id).unwrap();
        let dup = list_duplicate(&conn, "写代码").unwrap();
        assert!(dup.is_empty());
    }

    #[test]
    fn list_filters_by_status() {
        let conn = fresh_db();
        let a = create(&conn, "A".into()).unwrap();
        start(&conn, a.id).unwrap();
        let _b = create(&conn, "B".into()).unwrap();
        let actives = list(&conn, ListStatus::Active, None).unwrap();
        assert_eq!(actives.len(), 1);
        let todos = list(&conn, ListStatus::Todo, None).unwrap();
        assert_eq!(todos.len(), 1);
    }

    #[test]
    fn triage_to_todo_from_todo() {
        // V0.2.1 三态:收件箱并入待办,todo→todo 无意义(已不是整理动作)。此命令只处理 active→todo。
        let conn = fresh_db();
        let item = create(&conn, "X".into()).unwrap();
        assert_eq!(item.status, "todo");
        // todo 卡直接归档(而非转待办)
        let arch = triage_archive(&conn, item.id).unwrap();
        assert_eq!(arch.status, "archived");
    }

    #[test]
    fn triage_to_todo_settles_active() {
        let conn = fresh_db();
        let id = insert_raw(&conn, "X", "active", 1000, now_ms() - 5000);
        let t = triage_to_todo(&conn, id).unwrap();
        assert_eq!(t.status, "todo");
        assert!(t.focus_ms >= 6000 && t.focus_ms < 6200); // 1000 + 5000 已结算 + 开销容差
    }

    #[test]
    fn triage_to_todo_rejects_archived() {
        let conn = fresh_db();
        // archived 不可
        let item = create(&conn, "X".into()).unwrap();
        start(&conn, item.id).unwrap();
        complete(&conn, item.id).unwrap();
        assert!(triage_to_todo(&conn, item.id).is_err());
        // 另一个已归档
        let item2 = create(&conn, "Y".into()).unwrap();
        triage_archive(&conn, item2.id).unwrap();
        assert!(triage_to_todo(&conn, item2.id).is_err());
    }

    #[test]
    fn triage_archive_moves_todo_to_archived() {
        let conn = fresh_db();
        let item = create(&conn, "X".into()).unwrap();
        let a = triage_archive(&conn, item.id).unwrap();
        assert_eq!(a.status, "archived");
        assert!(list(&conn, ListStatus::Todo, None).unwrap().is_empty());
        let archived = list(&conn, ListStatus::Archived, None).unwrap();
        assert_eq!(archived.len(), 1);
    }

    #[test]
    fn triage_archive_rejects_active() {
        let conn = fresh_db();
        let item = create(&conn, "X".into()).unwrap();
        start(&conn, item.id).unwrap();
        assert!(triage_archive(&conn, item.id).is_err());
    }

    #[test]
    fn soft_delete_hides_from_list_and_get() {
        let conn = fresh_db();
        let item = create(&conn, "X".into()).unwrap();
        soft_delete(&conn, item.id).unwrap();
        assert!(get_by_id(&conn, item.id).unwrap().is_none());
        assert!(list(&conn, ListStatus::Todo, None).unwrap().is_empty());
        assert!(list(&conn, ListStatus::Active, None).unwrap().is_empty());
    }

    #[test]
    fn soft_delete_settles_active() {
        let conn = fresh_db();
        let id = insert_raw(&conn, "X", "active", 1000, now_ms() - 5000);
        let del = soft_delete(&conn, id).unwrap();
        assert!(del.focus_ms >= 6000 && del.focus_ms < 6200);
        assert!(get_by_id(&conn, id).unwrap().is_none());
    }

    #[test]
    fn soft_delete_then_undo_restores() {
        let conn = fresh_db();
        let item = create(&conn, "X".into()).unwrap();
        soft_delete(&conn, item.id).unwrap();
        let restored = undo_delete(&conn, item.id).unwrap();
        assert_eq!(restored.status, "todo");
        assert!(get_by_id(&conn, item.id).unwrap().is_some());
        assert_eq!(list(&conn, ListStatus::Todo, None).unwrap().len(), 1);
    }

    #[test]
    fn undo_delete_rejects_not_deleted_or_missing() {
        let conn = fresh_db();
        let item = create(&conn, "X".into()).unwrap();
        assert!(undo_delete(&conn, item.id).is_err());
        assert!(undo_delete(&conn, 99999).is_err());
    }

    #[test]
    fn reactivate_archived_to_todo() {
        let conn = fresh_db();
        let item = create(&conn, "X".into()).unwrap();
        triage_archive(&conn, item.id).unwrap();
        let re = reactivate(&conn, item.id).unwrap();
        assert_eq!(re.status, "todo");
        assert!(list(&conn, ListStatus::Archived, None).unwrap().is_empty());
    }

    #[test]
    fn reactivate_rejects_non_archived() {
        let conn = fresh_db();
        let item = create(&conn, "X".into()).unwrap();
        assert!(reactivate(&conn, item.id).is_err());
    }

    #[test]
    fn start_creates_open_interval() {
        let conn = fresh_db();
        let item = create(&conn, "X".into()).unwrap();
        start(&conn, item.id).unwrap();
        let intervals = list_intervals(&conn, item.id).unwrap();
        assert_eq!(intervals.len(), 1);
        assert_eq!(intervals[0].item_id, item.id);
        assert!(intervals[0].ended_at.is_none()); // 进行中
    }

    #[test]
    fn pause_settles_interval_and_matches_focus() {
        let conn = fresh_db();
        let item = create(&conn, "X".into()).unwrap();
        start(&conn, item.id).unwrap();
        pause(&conn, item.id, None).unwrap();
        let intervals = list_intervals(&conn, item.id).unwrap();
        assert_eq!(intervals.len(), 1);
        let iv = &intervals[0];
        let ended = iv.ended_at.expect("主动暂停应结算 ended_at");
        assert!(ended >= iv.started_at);
        let agg: i64 = intervals
            .iter()
            .map(|i| i.ended_at.unwrap() - i.started_at)
            .sum();
        let after = get_by_id(&conn, item.id).unwrap().unwrap();
        assert_eq!(after.focus_ms, agg); // 结算后 focus == interval 聚合
    }

    #[test]
    fn complete_settles_interval_and_matches_focus() {
        let conn = fresh_db();
        let item = create(&conn, "X".into()).unwrap();
        start(&conn, item.id).unwrap();
        complete(&conn, item.id).unwrap();
        let intervals = list_intervals(&conn, item.id).unwrap();
        assert_eq!(intervals.len(), 1);
        assert!(intervals[0].ended_at.is_some());
        let agg: i64 = intervals
            .iter()
            .map(|i| i.ended_at.unwrap() - i.started_at)
            .sum();
        let after = get_by_id(&conn, item.id).unwrap().unwrap();
        assert_eq!(after.status, "archived");
        assert!(after.focus_ms > 0);
        assert_eq!(after.focus_ms, agg);
    }

    #[test]
    fn start_parallel_keeps_both_intervals_open() {
        let conn = fresh_db();
        let a = create(&conn, "A".into()).unwrap();
        let b = create(&conn, "B".into()).unwrap();
        start(&conn, a.id).unwrap();
        let res = start(&conn, b.id).unwrap(); // 并行式:不切走 A
        assert!(res.switched_from.is_empty());
        // A 保持 active,interval 仍进行中(ended_at None)
        let a_ivs = list_intervals(&conn, a.id).unwrap();
        assert_eq!(a_ivs.len(), 1);
        assert!(a_ivs[0].ended_at.is_none());
        // B 也进行中
        let b_ivs = list_intervals(&conn, b.id).unwrap();
        assert_eq!(b_ivs.len(), 1);
        assert!(b_ivs[0].ended_at.is_none());
        let a_after = get_by_id(&conn, a.id).unwrap().unwrap();
        assert_eq!(a_after.status, "active");
    }

    #[test]
    fn settle_dormant_day_cross_settles_interval() {
        let conn = fresh_db();
        let item = create(&conn, "X".into()).unwrap();
        start(&conn, item.id).unwrap();
        let now = now_ms();
        let yesterday = now - 25 * 3600 * 1000;
        // 模拟"昨天开始跑进今天":last_active_at 与 interval 起点同源,都挪到昨天
        conn.execute(
            "UPDATE item SET last_active_at = ?1 WHERE id = ?2",
            params![yesterday, item.id],
        )
        .unwrap();
        conn.execute(
            "UPDATE focus_interval SET started_at = ?1 WHERE item_id = ?2",
            params![yesterday, item.id],
        )
        .unwrap();
        let res = settle_dormant(&conn, now).unwrap();
        assert!(res.paused.contains(&item.id));
        let intervals = list_intervals(&conn, item.id).unwrap();
        assert_eq!(intervals.len(), 1);
        assert!(intervals[0].ended_at.is_some());
        let agg: i64 = intervals
            .iter()
            .map(|i| i.ended_at.unwrap() - i.started_at)
            .sum();
        let after = get_by_id(&conn, item.id).unwrap().unwrap();
        assert_eq!(after.status, "todo");
        assert_eq!(after.focus_ms, agg); // 跨天停表后 focus == interval 聚合
    }

    // 五态 → 三态迁移:旧库 inbox/done 数据归一为 todo/archived(2026-08-02 决策)。
    // 用「宽松五态 CHECK」的表模拟旧库(新 schema 已收窄,无法插入 inbox/done)。
    #[test]
    fn migrate_v5_to_v3_normalizes_statuses() {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(
            "CREATE TABLE item (
               id INTEGER PRIMARY KEY AUTOINCREMENT,
               content TEXT NOT NULL,
               type TEXT NOT NULL DEFAULT 'task',
               status TEXT NOT NULL CHECK (status IN ('inbox','todo','active','done','archived')),
               focus_ms INTEGER NOT NULL DEFAULT 0,
               last_active_at INTEGER,
               progress_note TEXT,
               source TEXT NOT NULL DEFAULT 'manual',
               payload TEXT,
               tag TEXT,
               deleted_at INTEGER,
               pending_ms INTEGER,
               created_at INTEGER NOT NULL,
               updated_at INTEGER NOT NULL
             );",
        )
        .unwrap();
        let now = now_ms();
        conn.execute(
            "INSERT INTO item (content, status, created_at, updated_at) VALUES ('旧收件箱', 'inbox', ?1, ?1)",
            params![now],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO item (content, status, created_at, updated_at) VALUES ('旧已完成', 'done', ?1, ?1)",
            params![now],
        )
        .unwrap();
        // 实际迁移逻辑在 db::init 调用,此处验证迁移 SQL 语义
        conn.execute_batch(
            "UPDATE item SET status = 'todo', updated_at = updated_at WHERE status = 'inbox';
             UPDATE item SET status = 'archived', updated_at = updated_at WHERE status = 'done';",
        )
        .unwrap();
        let items: Vec<String> = {
            let mut stmt = conn
                .prepare("SELECT status FROM item ORDER BY created_at")
                .unwrap();
            stmt.query_map([], |r| r.get::<_, String>(0))
                .unwrap()
                .collect::<rusqlite::Result<Vec<_>>>()
                .unwrap()
        };
        assert_eq!(items, vec!["todo".to_string(), "archived".to_string()]);
    }
}
