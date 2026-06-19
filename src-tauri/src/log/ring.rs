use serde::Serialize;
use std::collections::VecDeque;
use std::sync::{Arc, Mutex};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LogEntry {
    pub ts: i64,
    pub level: String,
    pub target: String,
    pub message: String,
}

#[derive(Debug)]
pub struct RingBuffer {
    inner: Mutex<VecDeque<LogEntry>>,
    cap: usize,
}

impl RingBuffer {
    pub fn new(cap: usize) -> Self {
        Self { inner: Mutex::new(VecDeque::with_capacity(cap)), cap }
    }
    pub fn push(&self, e: LogEntry) {
        let mut g = self.inner.lock().unwrap();
        if g.len() == self.cap { g.pop_front(); }
        g.push_back(e);
    }
    pub fn recent(&self, n: usize) -> Vec<LogEntry> {
        let g = self.inner.lock().unwrap();
        g.iter().rev().take(n).cloned().collect::<Vec<_>>().into_iter().rev().collect()
    }
    pub fn shared(self) -> Arc<Self> { Arc::new(self) }
}

pub type SharedRing = Arc<RingBuffer>;

#[cfg(test)]
mod tests {
    use super::*;

    fn ts() -> i64 {
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as i64
    }

    #[test]
    fn under_cap_retains_all() {
        let rb = RingBuffer::new(10);
        rb.push(LogEntry { ts: ts(), level: "info".into(), target: "test".into(), message: "a".into() });
        rb.push(LogEntry { ts: ts(), level: "info".into(), target: "test".into(), message: "b".into() });
        let rec = rb.recent(10);
        assert_eq!(rec.len(), 2);
        assert_eq!(rec[0].message, "a");
        assert_eq!(rec[1].message, "b");
    }

    #[test]
    fn over_cap_evicts_oldest() {
        let rb = RingBuffer::new(3);
        for i in 0..5 {
            rb.push(LogEntry { ts: ts(), level: "info".into(), target: "test".into(), message: format!("i{}", i) });
        }
        let rec = rb.recent(3);
        assert_eq!(rec.len(), 3);
        assert_eq!(rec[0].message, "i2");
        assert_eq!(rec[1].message, "i3");
        assert_eq!(rec[2].message, "i4");
    }

    #[test]
    fn recent_n_returns_chrono_order() {
        let rb = RingBuffer::new(100);
        for i in 0..10 {
            rb.push(LogEntry { ts: ts(), level: "info".into(), target: "test".into(), message: format!("msg{}", i) });
        }
        let rec = rb.recent(4);
        assert_eq!(rec.len(), 4);
        assert_eq!(rec[0].message, "msg6");
        assert_eq!(rec[3].message, "msg9");
    }
}
