pub const CREATE_SQL: &str = "
CREATE TABLE IF NOT EXISTS item (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  content        TEXT NOT NULL,
  type           TEXT NOT NULL DEFAULT 'task',
  status         TEXT NOT NULL CHECK (status IN ('todo','active','archived')),
  focus_ms       INTEGER NOT NULL DEFAULT 0,
  last_active_at INTEGER,
  progress_note  TEXT,
  source         TEXT NOT NULL DEFAULT 'manual',
  payload        TEXT,
  tag            TEXT,
  deleted_at     INTEGER,
  pending_ms     INTEGER,
  created_at     INTEGER NOT NULL,
  updated_at     INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_item_status_created
  ON item (status, created_at DESC);

-- 激活明细日志:一次 start 到结算。ended_at NULL = 进行中。
CREATE TABLE IF NOT EXISTS focus_interval (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id    INTEGER NOT NULL,
  started_at INTEGER NOT NULL,
  ended_at   INTEGER,
  created_at INTEGER NOT NULL,
  source     TEXT NOT NULL DEFAULT 'start' CHECK (source IN ('start','idle_pause','manual_pause','dormant','manual_gap'))
);

CREATE INDEX IF NOT EXISTS idx_focus_interval_item
  ON focus_interval (item_id);

-- 应用设置 KV 表:浮窗展开高度等用户偏好(2026-08-02)。key 唯一,value 文本。
CREATE TABLE IF NOT EXISTS app_setting (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 注意: 不建 active 部分唯一索引(支持多并行进行中)
";
