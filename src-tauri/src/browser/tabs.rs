use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrowserTab {
    pub id: String,
    pub title: String,
    pub url: String,
    pub favicon: Option<String>,
    pub can_go_back: bool,
    pub can_go_forward: bool,
    pub is_loading: bool,
    pub shield_active: bool,
    pub blocked_ads_count: usize,
    pub blocked_trackers_count: usize,
    pub elements_hidden_count: usize,
}

impl BrowserTab {
    pub fn new(id: String, url: String) -> Self {
        let is_newtab = url == "nooki://newtab" || url.is_empty();
        let display_url = if is_newtab { "nooki://newtab".to_string() } else { url };
        let title = if is_newtab {
            "New Tab".to_string()
        } else {
            display_url.clone()
        };

        Self {
            id,
            title,
            url: display_url,
            favicon: None,
            can_go_back: false,
            can_go_forward: false,
            is_loading: false,
            shield_active: true,
            blocked_ads_count: 0,
            blocked_trackers_count: 0,
            elements_hidden_count: 0,
        }
    }
}
