pub mod bookmarks;
pub mod downloads;
pub mod history;
pub mod tabs;

use bookmarks::BookmarkStore;
use downloads::DownloadManager;
use history::HistoryStore;
use std::path::Path;
use std::sync::RwLock;
use tabs::BrowserTab;

pub struct BrowserState {
    pub tabs: RwLock<Vec<BrowserTab>>,
    pub active_tab_id: RwLock<String>,
    pub recently_closed: RwLock<Vec<BrowserTab>>,
    pub bookmarks: BookmarkStore,
    pub history: HistoryStore,
    pub downloads: DownloadManager,
    pub toolbar_height: RwLock<f64>,
    pub webviews_hidden: RwLock<bool>,
}

impl BrowserState {
    pub fn new(app_data_dir: &Path) -> Self {
        let initial_tab = BrowserTab::new("tab-1".to_string(), "nooki://newtab".to_string());
        let active_id = initial_tab.id.clone();

        Self {
            tabs: RwLock::new(vec![initial_tab]),
            active_tab_id: RwLock::new(active_id),
            recently_closed: RwLock::new(Vec::new()),
            bookmarks: BookmarkStore::new(app_data_dir),
            history: HistoryStore::new(app_data_dir),
            downloads: DownloadManager::new(app_data_dir),
            toolbar_height: RwLock::new(84.0),
            webviews_hidden: RwLock::new(false),
        }
    }

    pub fn get_tabs(&self) -> Vec<BrowserTab> {
        self.tabs.read().unwrap().clone()
    }

    pub fn get_active_tab_id(&self) -> String {
        self.active_tab_id.read().unwrap().clone()
    }

    pub fn set_active_tab_id(&self, id: &str) {
        let mut active = self.active_tab_id.write().unwrap();
        *active = id.to_string();
    }

    pub fn create_tab(&self, url: Option<String>) -> BrowserTab {
        let tab_url = url.unwrap_or_else(|| "nooki://newtab".to_string());
        let new_id = format!("tab-{}", chrono::Utc::now().timestamp_millis());
        let tab = BrowserTab::new(new_id.clone(), tab_url);

        let mut tabs = self.tabs.write().unwrap();
        tabs.push(tab.clone());
        drop(tabs);

        self.set_active_tab_id(&new_id);
        tab
    }

    pub fn close_tab(&self, id: &str) -> Option<String> {
        let mut tabs = self.tabs.write().unwrap();
        if tabs.len() <= 1 {
            // If only one tab left, reset to new tab instead of closing browser
            if let Some(tab) = tabs.first_mut() {
                tab.url = "nooki://newtab".to_string();
                tab.title = "New Tab".to_string();
                tab.favicon = None;
                tab.can_go_back = false;
                tab.can_go_forward = false;
                tab.is_loading = false;
            }
            return Some(tabs[0].id.clone());
        }

        let idx = tabs.iter().position(|t| t.id == id)?;
        let removed = tabs.remove(idx);

        // Store in recently closed (limit 20)
        let mut closed = self.recently_closed.write().unwrap();
        if closed.len() >= 20 {
            closed.remove(0);
        }
        closed.push(removed);

        let active_id = self.get_active_tab_id();
        if active_id == id {
            let next_idx = if idx >= tabs.len() {
                tabs.len() - 1
            } else {
                idx
            };
            let next_id = tabs[next_idx].id.clone();
            drop(tabs);
            self.set_active_tab_id(&next_id);
            Some(next_id)
        } else {
            Some(active_id)
        }
    }

    pub fn reopen_closed_tab(&self) -> Option<BrowserTab> {
        let mut closed = self.recently_closed.write().unwrap();
        let last = closed.pop()?;

        let mut tabs = self.tabs.write().unwrap();
        tabs.push(last.clone());
        drop(tabs);

        self.set_active_tab_id(&last.id);
        Some(last)
    }

    pub fn update_tab<F>(&self, id: &str, f: F)
    where
        F: FnOnce(&mut BrowserTab),
    {
        let mut tabs = self.tabs.write().unwrap();
        if let Some(tab) = tabs.iter_mut().find(|t| t.id == id) {
            f(tab);
        }
    }
}
