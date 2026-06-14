// src-tauri/src/error.rs
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("数据库错误: {0}")]
    Db(#[from] rusqlite::Error),

    #[error("序列化错误: {0}")]
    Serde(#[from] serde_json::Error),

    #[error("未找到资源: {0}")]
    NotFound(String),

    #[error("状态机非法转换: {0}")]
    InvalidTransition(String),

    #[error("全局唯一 Focus 冲突")]
    ActiveExists,
}

pub type AppResult<T> = Result<T, AppError>;

impl serde::Serialize for AppError {
    fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_str(&self.to_string())
    }
}
