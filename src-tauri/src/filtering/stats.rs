use crate::filtering::rules::BlockCategory;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, VecDeque};
use std::sync::RwLock;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockedLogEntry {
    pub timestamp: DateTime<Utc>,
    pub tab_id: String,
    pub request_url: String,
    pub domain: String,
    pub page_domain: String,
    pub category: BlockCategory,
    pub rule: String,
}

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct TabShieldStats {
    pub blocked_ads: usize,
    pub blocked_trackers: usize,
    pub elements_hidden: usize,
    pub total: usize,
}

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct SessionShieldStats {
    pub total_blocked_requests: usize,
    pub total_blocked_trackers: usize,
    pub total_elements_hidden: usize,
    pub total: usize,
}

pub struct ShieldStatsTracker {
    tab_stats: RwLock<HashMap<String, TabShieldStats>>,
    session_stats: RwLock<SessionShieldStats>,
    recent_logs: RwLock<VecDeque<BlockedLogEntry>>,
    max_logs: usize,
}

impl ShieldStatsTracker {
    pub fn new() -> Self {
        Self {
            tab_stats: RwLock::new(HashMap::new()),
            session_stats: RwLock::new(SessionShieldStats::default()),
            recent_logs: RwLock::new(VecDeque::with_capacity(100)),
            max_logs: 100,
        }
    }

    pub fn record_block(
        &self,
        tab_id: &str,
        request_url: &str,
        domain: &str,
        page_domain: &str,
        category: BlockCategory,
        rule: &str,
    ) {
        // Update tab stats
        {
            let mut tabs = self.tab_stats.write().unwrap();
            let entry = tabs.entry(tab_id.to_string()).or_default();
            entry.total += 1;
            match category {
                BlockCategory::Ad => entry.blocked_ads += 1,
                BlockCategory::Tracker => entry.blocked_trackers += 1,
                BlockCategory::Malware | BlockCategory::Annoyance => entry.blocked_ads += 1,
            }
        }

        // Update session stats
        {
            let mut session = self.session_stats.write().unwrap();
            session.total += 1;
            match category {
                BlockCategory::Ad => session.total_blocked_requests += 1,
                BlockCategory::Tracker => session.total_blocked_trackers += 1,
                BlockCategory::Malware | BlockCategory::Annoyance => session.total_blocked_requests += 1,
            }
        }

        // Record log entry
        {
            let mut logs = self.recent_logs.write().unwrap();
            if logs.len() >= self.max_logs {
                logs.pop_front();
            }
            logs.push_back(BlockedLogEntry {
                timestamp: Utc::now(),
                tab_id: tab_id.to_string(),
                request_url: request_url.to_string(),
                domain: domain.to_string(),
                page_domain: page_domain.to_string(),
                category,
                rule: rule.to_string(),
            });
        }
    }

    pub fn record_cosmetic_hiding(&self, tab_id: &str, count: usize) {
        if count == 0 {
            return;
        }
        {
            let mut tabs = self.tab_stats.write().unwrap();
            let entry = tabs.entry(tab_id.to_string()).or_default();
            entry.elements_hidden += count;
            entry.total += count;
        }
        {
            let mut session = self.session_stats.write().unwrap();
            session.total_elements_hidden += count;
            session.total += count;
        }
    }

    pub fn get_tab_stats(&self, tab_id: &str) -> TabShieldStats {
        self.tab_stats
            .read()
            .unwrap()
            .get(tab_id)
            .cloned()
            .unwrap_or_default()
    }

    pub fn get_session_stats(&self) -> SessionShieldStats {
        self.session_stats.read().unwrap().clone()
    }

    pub fn get_recent_logs(&self) -> Vec<BlockedLogEntry> {
        self.recent_logs.read().unwrap().iter().cloned().collect()
    }

    pub fn clear_tab_stats(&self, tab_id: &str) {
        self.tab_stats.write().unwrap().remove(tab_id);
    }
}
