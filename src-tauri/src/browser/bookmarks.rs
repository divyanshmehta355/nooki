use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::RwLock;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bookmark {
    pub id: String,
    pub title: String,
    pub url: String,
    pub folder: Option<String>,
    pub favicon: Option<String>,
    pub created_at: DateTime<Utc>,
}

pub struct BookmarkStore {
    file_path: PathBuf,
    bookmarks: RwLock<Vec<Bookmark>>,
}

impl BookmarkStore {
    pub fn new(app_data_dir: &Path) -> Self {
        let dir = app_data_dir.join("nooki");
        let _ = fs::create_dir_all(&dir);
        let file_path = dir.join("bookmarks.json");

        let bookmarks = if file_path.exists() {
            fs::read_to_string(&file_path)
                .ok()
                .and_then(|data| serde_json::from_str(&data).ok())
                .unwrap_or_else(Self::default_bookmarks)
        } else {
            Self::default_bookmarks()
        };

        let store = Self {
            file_path,
            bookmarks: RwLock::new(bookmarks),
        };
        let _ = store.save();
        store
    }

    fn default_bookmarks() -> Vec<Bookmark> {
        vec![
            Bookmark {
                id: "bm-1".to_string(),
                title: "DuckDuckGo".to_string(),
                url: "https://duckduckgo.com".to_string(),
                folder: None,
                favicon: Some("https://duckduckgo.com/favicon.ico".to_string()),
                created_at: Utc::now(),
            },
            Bookmark {
                id: "bm-2".to_string(),
                title: "Wikipedia".to_string(),
                url: "https://en.wikipedia.org".to_string(),
                folder: None,
                favicon: Some("https://en.wikipedia.org/favicon.ico".to_string()),
                created_at: Utc::now(),
            },
            Bookmark {
                id: "bm-3".to_string(),
                title: "Hacker News".to_string(),
                url: "https://news.ycombinator.com".to_string(),
                folder: None,
                favicon: Some("https://news.ycombinator.com/favicon.ico".to_string()),
                created_at: Utc::now(),
            },
            Bookmark {
                id: "bm-4".to_string(),
                title: "GitHub".to_string(),
                url: "https://github.com".to_string(),
                folder: None,
                favicon: Some("https://github.com/favicon.ico".to_string()),
                created_at: Utc::now(),
            },
        ]
    }

    pub fn get_all(&self) -> Vec<Bookmark> {
        self.bookmarks.read().unwrap().clone()
    }

    pub fn add(&self, title: &str, url: &str, folder: Option<&str>, favicon: Option<&str>) -> Bookmark {
        let bm = Bookmark {
            id: format!("bm-{}", Utc::now().timestamp_millis()),
            title: title.to_string(),
            url: url.to_string(),
            folder: folder.map(|s| s.to_string()),
            favicon: favicon.map(|s| s.to_string()),
            created_at: Utc::now(),
        };

        {
            let mut list = self.bookmarks.write().unwrap();
            list.retain(|b| b.url != url);
            list.push(bm.clone());
        }
        let _ = self.save();
        bm
    }

    pub fn remove(&self, id: &str) -> bool {
        let mut list = self.bookmarks.write().unwrap();
        let initial_len = list.len();
        list.retain(|b| b.id != id);
        let removed = list.len() < initial_len;
        if removed {
            let _ = self.save();
        }
        removed
    }

    pub fn is_bookmarked(&self, url: &str) -> bool {
        self.bookmarks.read().unwrap().iter().any(|b| b.url == url)
    }

    pub fn save(&self) -> std::io::Result<()> {
        let data = serde_json::to_string_pretty(&*self.bookmarks.read().unwrap())?;
        fs::write(&self.file_path, data)
    }
}
