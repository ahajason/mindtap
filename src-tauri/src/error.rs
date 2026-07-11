use thiserror::Error;

#[derive(Debug, Error)]
#[error("{0}")]
pub struct AppError(pub String);

// ponytail: 5 变体 enum 全走 .to_string() 序列化, 等价单个 newtype, 省掉 4 个空变体
impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.0)
    }
}

impl From<rusqlite::Error> for AppError {
    fn from(err: rusqlite::Error) -> Self {
        AppError(err.to_string())
    }
}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        AppError(err.to_string())
    }
}
