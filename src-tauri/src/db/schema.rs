pub const CREATE_SQL: &str = "
CREATE TABLE IF NOT EXISTS timer_session (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  task_title    TEXT NOT NULL,
  status        TEXT NOT NULL CHECK (status IN ('active', 'paused', 'completed')),
  started_at    INTEGER,
  paused_at     INTEGER,
  completed_at  INTEGER,
  focus_ms      INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_timer_session_active
  ON timer_session (status) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_timer_session_completed_at
  ON timer_session (completed_at DESC) WHERE status = 'completed';
";