pub const CREATE_SQL: &str = "
CREATE TABLE IF NOT EXISTS item (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  content        TEXT NOT NULL,
  type           TEXT NOT NULL DEFAULT 'task',
  status         TEXT NOT NULL CHECK (status IN ('inbox','todo','active','done','archived')),
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

-- 注意: 不建 active 部分唯一索引(支持多并行进行中)
";
