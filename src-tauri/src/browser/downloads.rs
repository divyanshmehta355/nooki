use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::RwLock;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DownloadStatus {
    Downloading,
    Completed,
    Failed,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadItem {
    pub id: String,
    pub filename: String,
    pub url: String,
    pub path: String,
    pub total_bytes: Option<u64>,
    pub downloaded_bytes: u64,
    pub status: DownloadStatus,
    pub created_at: DateTime<Utc>,
    pub error_message: Option<String>,
}

pub struct DownloadManager {
    file_path: PathBuf,
    downloads: RwLock<Vec<DownloadItem>>,
}

impl DownloadManager {
    pub fn new(app_data_dir: &Path) -> Self {
        let dir = app_data_dir.join("nooki");
        let _ = fs::create_dir_all(&dir);
        let file_path = dir.join("downloads.json");

        let downloads = if file_path.exists() {
            fs::read_to_string(&file_path)
                .ok()
                .and_then(|data| serde_json::from_str(&data).ok())
                .unwrap_or_default()
        } else {
            Vec::new()
        };

        Self {
            file_path,
            downloads: RwLock::new(downloads),
        }
    }

    pub fn get_all(&self) -> Vec<DownloadItem> {
        self.downloads.read().unwrap().clone()
    }

    pub fn add_item(
        &self,
        filename: &str,
        url: &str,
        path: &str,
        total_bytes: Option<u64>,
    ) -> DownloadItem {
        let item = DownloadItem {
            id: format!("dl-{}", Utc::now().timestamp_millis()),
            filename: filename.to_string(),
            url: url.to_string(),
            path: path.to_string(),
            total_bytes,
            downloaded_bytes: 0,
            status: DownloadStatus::Downloading,
            created_at: Utc::now(),
            error_message: None,
        };

        {
            let mut list = self.downloads.write().unwrap();
            list.insert(0, item.clone());
        }
        let _ = self.save();
        item
    }

    pub fn mark_completed(&self, id: &str, total_bytes: u64) {
        let mut list = self.downloads.write().unwrap();
        if let Some(item) = list.iter_mut().find(|d| d.id == id) {
            item.status = DownloadStatus::Completed;
            item.downloaded_bytes = total_bytes;
            item.total_bytes = Some(total_bytes);
        }
        let _ = self.save_locked(&list);
    }

    pub fn mark_failed(&self, id: &str, error: &str) {
        let mut list = self.downloads.write().unwrap();
        if let Some(item) = list.iter_mut().find(|d| d.id == id) {
            item.status = DownloadStatus::Failed;
            item.error_message = Some(error.to_string());
        }
        let _ = self.save_locked(&list);
    }

    pub fn clear_completed(&self) {
        let mut list = self.downloads.write().unwrap();
        list.retain(|d| matches!(d.status, DownloadStatus::Downloading));
        let _ = self.save_locked(&list);
    }

    fn save(&self) -> std::io::Result<()> {
        let list = self.downloads.read().unwrap();
        self.save_locked(&list)
    }

    fn save_locked(&self, list: &[DownloadItem]) -> std::io::Result<()> {
        let data = serde_json::to_string_pretty(list)?;
        fs::write(&self.file_path, data)
    }
}
