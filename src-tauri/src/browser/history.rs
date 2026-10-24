use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::RwLock;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryItem {
    pub id: String,
    pub url: String,
    pub title: String,
    pub visited_at: DateTime<Utc>,
    pub visit_count: u32,
}

pub struct HistoryStore {
    file_path: PathBuf,
    items: RwLock<Vec<HistoryItem>>,
}

impl HistoryStore {
    pub fn new(app_data_dir: &Path) -> Self {
        let dir = app_data_dir.join("nooki");
        let _ = fs::create_dir_all(&dir);
        let file_path = dir.join("history.json");

        let items = if file_path.exists() {
            fs::read_to_string(&file_path)
                .ok()
                .and_then(|data| serde_json::from_str(&data).ok())
                .unwrap_or_default()
        } else {
            Vec::new()
        };

        Self {
            file_path,
            items: RwLock::new(items),
        }
    }

    pub fn record_visit(&self, url: &str, title: &str) {
        if url.starts_with("nooki://") || url == "about:blank" || url.is_empty() {
            return;
        }

        let mut list = self.items.write().unwrap();
        if let Some(existing) = list.iter_mut().find(|item| item.url == url) {
            existing.visited_at = Utc::now();
            existing.visit_count += 1;
            if !title.is_empty() && title != url {
                existing.title = title.to_string();
            }
        } else {
            list.insert(
                0,
                HistoryItem {
                    id: format!("hist-{}", Utc::now().timestamp_millis()),
                    url: url.to_string(),
                    title: if title.is_empty() { url.to_string() } else { title.to_string() },
                    visited_at: Utc::now(),
                    visit_count: 1,
                },
            );
        }

        // Limit history to 5000 items
        if list.len() > 5000 {
            list.truncate(5000);
        }

        let _ = self.save_locked(&list);
    }

    pub fn get_all(&self) -> Vec<HistoryItem> {
        self.items.read().unwrap().clone()
    }

    pub fn search(&self, query: &str) -> Vec<HistoryItem> {
        let q = query.to_lowercase();
        self.items
            .read()
            .unwrap()
            .iter()
            .filter(|i| i.url.to_lowercase().contains(&q) || i.title.to_lowercase().contains(&q))
            .cloned()
            .collect()
    }

    pub fn delete_entry(&self, id: &str) -> bool {
        let mut list = self.items.write().unwrap();
        let initial_len = list.len();
        list.retain(|item| item.id != id);
        let removed = list.len() < initial_len;
        if removed {
            let _ = self.save_locked(&list);
        }
        removed
    }

    pub fn clear_all(&self) {
        let mut list = self.items.write().unwrap();
        list.clear();
        let _ = self.save_locked(&list);
    }

    pub fn clear_range(&self, hours: i64) {
        let cutoff = Utc::now() - Duration::hours(hours);
        let mut list = self.items.write().unwrap();
        list.retain(|item| item.visited_at < cutoff);
        let _ = self.save_locked(&list);
    }

    fn save_locked(&self, list: &[HistoryItem]) -> std::io::Result<()> {
        let data = serde_json::to_string_pretty(list)?;
        fs::write(&self.file_path, data)
    }
}
