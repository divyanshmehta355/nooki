pub mod filter_lists;
pub mod rules;
pub mod stats;

use filter_lists::{FilterListManager, FilterListMetadata};
use rules::{
    extract_registered_domain, BlockCategory, CosmeticRule, FilterDecision, NetworkRule,
    ResourceType,
};
use stats::ShieldStatsTracker;
use std::collections::{HashMap, HashSet};
use std::path::Path;
use std::sync::RwLock;
use url::Url;

pub struct AdBlockEngine {
    pub global_enabled: bool,
    pub cosmetic_filtering_enabled: bool,
    pub block_rules: Vec<NetworkRule>,
    pub exception_rules: Vec<NetworkRule>,
    pub cosmetic_rules: Vec<CosmeticRule>,
    pub whitelisted_domains: HashSet<String>,
    pub filter_lists: Vec<FilterListMetadata>,
    pub stats: ShieldStatsTracker,
    pub list_manager: FilterListManager,
    decision_cache: RwLock<HashMap<String, FilterDecision>>,
}

impl AdBlockEngine {
    pub fn new(app_data_dir: &Path) -> Self {
        let list_manager = FilterListManager::new(app_data_dir);
        let filter_lists = FilterListManager::get_default_subscriptions();
        let stats = ShieldStatsTracker::new();

        let mut engine = Self {
            global_enabled: true,
            cosmetic_filtering_enabled: true,
            block_rules: Vec::new(),
            exception_rules: Vec::new(),
            cosmetic_rules: Vec::new(),
            whitelisted_domains: HashSet::new(),
            filter_lists,
            stats,
            list_manager,
            decision_cache: RwLock::new(HashMap::with_capacity(1000)),
        };

        engine.reload_all_rules();
        engine
    }

    /// Re-parses and indexes rules from all enabled filter lists.
    pub fn reload_all_rules(&mut self) {
        let mut new_block = Vec::new();
        let mut new_exception = Vec::new();
        let mut new_cosmetic = Vec::new();

        for list in &mut self.filter_lists {
            if !list.enabled {
                continue;
            }

            let content = self.list_manager.load_list_content(&list.id);
            let mut list_rule_count = 0;

            let default_cat = if list.id.contains("tracker") {
                BlockCategory::Tracker
            } else if list.id.contains("malware") {
                BlockCategory::Malware
            } else if list.id.contains("annoyance") {
                BlockCategory::Annoyance
            } else {
                BlockCategory::Ad
            };

            for line in content.lines() {
                let trimmed = line.trim();
                if trimmed.is_empty() || trimmed.starts_with('!') || trimmed.starts_with('[') {
                    continue;
                }

                if trimmed.contains("##") || trimmed.contains("#@#") {
                    if let Some(rule) = CosmeticRule::parse(trimmed) {
                        new_cosmetic.push(rule);
                        list_rule_count += 1;
                    }
                } else if let Some(rule) = NetworkRule::parse(trimmed, default_cat) {
                    if rule.is_exception {
                        new_exception.push(rule);
                    } else {
                        new_block.push(rule);
                    }
                    list_rule_count += 1;
                }
            }

            list.rule_count = list_rule_count;
        }

        self.block_rules = new_block;
        self.exception_rules = new_exception;
        self.cosmetic_rules = new_cosmetic;
        self.clear_cache();
    }

    pub fn clear_cache(&self) {
        if let Ok(mut cache) = self.decision_cache.write() {
            cache.clear();
        }
    }

    /// Check whether a network request should be blocked.
    pub fn check_request(
        &self,
        tab_id: &str,
        request_url: &Url,
        page_domain: &str,
        resource_type: ResourceType,
    ) -> FilterDecision {
        if !self.global_enabled {
            return FilterDecision::Allow;
        }

        // Check if page domain is whitelisted by user
        let page_base = extract_registered_domain(page_domain).to_lowercase();
        if self.whitelisted_domains.contains(&page_base)
            || self.whitelisted_domains.contains(page_domain)
        {
            return FilterDecision::Allow;
        }

        let request_domain = match request_url.host_str() {
            Some(h) => h,
            None => return FilterDecision::Allow,
        };

        // Cache key: (url, page_domain, resource_type)
        let cache_key = format!("{}|{}|{:?}", request_url.as_str(), page_domain, resource_type);
        if let Ok(cache) = self.decision_cache.read() {
            if let Some(decision) = cache.get(&cache_key) {
                return decision.clone();
            }
        }

        // 1. Check Exception rules (allow rules take precedence over block rules)
        for rule in &self.exception_rules {
            if rule.matches(request_url, request_domain, page_domain, resource_type) {
                let decision = FilterDecision::Allow;
                if let Ok(mut cache) = self.decision_cache.write() {
                    if cache.len() < 2000 {
                        cache.insert(cache_key, decision.clone());
                    }
                }
                return decision;
            }
        }

        // 2. Check Block rules
        for rule in &self.block_rules {
            if rule.matches(request_url, request_domain, page_domain, resource_type) {
                let decision = FilterDecision::Block {
                    rule: rule.raw.clone(),
                    category: rule.category,
                };

                // Record real stats
                self.stats.record_block(
                    tab_id,
                    request_url.as_str(),
                    request_domain,
                    page_domain,
                    rule.category,
                    &rule.raw,
                );

                if let Ok(mut cache) = self.decision_cache.write() {
                    if cache.len() < 2000 {
                        cache.insert(cache_key, decision.clone());
                    }
                }
                return decision;
            }
        }

        let decision = FilterDecision::Allow;
        if let Ok(mut cache) = self.decision_cache.write() {
            if cache.len() < 2000 {
                cache.insert(cache_key, decision.clone());
            }
        }
        decision
    }

    /// Generates optimized CSS selector block to hide elements on the given domain.
    pub fn generate_cosmetic_css(&self, domain: &str) -> String {
        if !self.global_enabled || !self.cosmetic_filtering_enabled {
            return String::new();
        }

        let page_base = extract_registered_domain(domain).to_lowercase();
        if self.whitelisted_domains.contains(&page_base)
            || self.whitelisted_domains.contains(domain)
        {
            return String::new();
        }

        let mut selectors = Vec::new();
        for rule in &self.cosmetic_rules {
            if !rule.is_exception && rule.applies_to_domain(domain) {
                selectors.push(rule.selector.as_str());
            }
        }

        if selectors.is_empty() {
            return String::new();
        }

        // Construct clean display:none !important rule
        let joined = selectors.join(", ");
        format!(
            "{} {{ display: none !important; visibility: hidden !important; height: 0 !important; max-height: 0 !important; }}",
            joined
        )
    }

    pub fn whitelist_domain(&mut self, domain: &str) {
        let clean = domain.trim().to_lowercase();
        if !clean.is_empty() {
            self.whitelisted_domains.insert(clean);
            self.clear_cache();
        }
    }

    pub fn remove_whitelist_domain(&mut self, domain: &str) {
        let clean = domain.trim().to_lowercase();
        self.whitelisted_domains.remove(&clean);
        self.clear_cache();
    }

    pub fn is_domain_whitelisted(&self, domain: &str) -> bool {
        let clean = domain.trim().to_lowercase();
        let base = extract_registered_domain(&clean).to_string();
        self.whitelisted_domains.contains(&clean) || self.whitelisted_domains.contains(&base)
    }

    pub fn set_list_enabled(&mut self, id: &str, enabled: bool) {
        if let Some(list) = self.filter_lists.iter_mut().find(|l| l.id == id) {
            list.enabled = enabled;
        }
        self.reload_all_rules();
    }
}
