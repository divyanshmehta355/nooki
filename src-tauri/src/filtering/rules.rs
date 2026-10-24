use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use url::Url;

/// Classification of resource being requested.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ResourceType {
    Script,
    Image,
    Stylesheet,
    XmlHttpRequest,
    Subdocument,
    Ping,
    Other,
}

impl ResourceType {
    pub fn from_mime_or_ext(mime: Option<&str>, path: &str) -> Self {
        if let Some(m) = mime {
            if m.contains("javascript") || m.contains("ecmascript") {
                return ResourceType::Script;
            }
            if m.starts_with("image/") {
                return ResourceType::Image;
            }
            if m.contains("css") {
                return ResourceType::Stylesheet;
            }
            if m.contains("json") || m.contains("xml") {
                return ResourceType::XmlHttpRequest;
            }
            if m.contains("html") {
                return ResourceType::Subdocument;
            }
        }

        let lower = path.to_lowercase();
        if lower.ends_with(".js") || lower.ends_with(".mjs") {
            ResourceType::Script
        } else if lower.ends_with(".png")
            || lower.ends_with(".jpg")
            || lower.ends_with(".jpeg")
            || lower.ends_with(".gif")
            || lower.ends_with(".webp")
            || lower.ends_with(".svg")
            || lower.ends_with(".avif")
        {
            ResourceType::Image
        } else if lower.ends_with(".css") {
            ResourceType::Stylesheet
        } else if lower.ends_with(".json") {
            ResourceType::XmlHttpRequest
        } else {
            ResourceType::Other
        }
    }
}

/// Category of the blocked rule.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum BlockCategory {
    Ad,
    Tracker,
    Malware,
    Annoyance,
}

/// A parsed network filter rule.
#[derive(Debug, Clone)]
pub struct NetworkRule {
    pub raw: String,
    pub is_exception: bool,
    pub pattern: RulePattern,
    pub third_party_only: Option<bool>,
    pub resource_types: Option<HashSet<ResourceType>>,
    pub domains: Option<HashSet<String>>,
    pub excluded_domains: Option<HashSet<String>>,
    pub category: BlockCategory,
}

#[derive(Debug, Clone)]
pub enum RulePattern {
    /// ||domain.com^ : matches if domain is domain.com or subdomain
    DomainAnchor(String),
    /// ||domain.com/path^ : matches domain + path prefix
    DomainPathAnchor { domain: String, path_prefix: String },
    /// |http://example.com : prefix match
    Prefix(String),
    /// example.com/ad| : suffix match
    Suffix(String),
    /// Contains exact substring
    Contains(String),
    /// Wildcard / Regex
    Regex(Regex),
}

/// A cosmetic filter rule (element hiding).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CosmeticRule {
    pub raw: String,
    pub selector: String,
    pub domains: Option<HashSet<String>>,
    pub excluded_domains: Option<HashSet<String>>,
    pub is_exception: bool,
}

/// Result of evaluating a request against the ad block engine.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum FilterDecision {
    Allow,
    Block {
        rule: String,
        category: BlockCategory,
    },
}

impl NetworkRule {
    /// Parse an ABP/EasyList formatted rule line.
    pub fn parse(line: &str, default_category: BlockCategory) -> Option<Self> {
        let trimmed = line.trim();
        if trimmed.is_empty()
            || trimmed.starts_with('!')
            || trimmed.starts_with('[')
            || trimmed.contains("##")
            || trimmed.contains("#@#")
            || trimmed.contains("#?#")
        {
            return None;
        }

        let is_exception = trimmed.starts_with("@@");
        let rule_body = if is_exception {
            &trimmed[2..]
        } else {
            trimmed
        };

        // Split options: pattern$option1,option2
        let (pattern_str, options_str) = match rule_body.split_once('$') {
            Some((p, o)) => (p.trim(), Some(o.trim())),
            None => (rule_body, None),
        };

        if pattern_str.is_empty() && options_str.is_none() {
            return None;
        }

        let mut third_party_only = None;
        let mut resource_types = None;
        let mut domains = None;
        let mut excluded_domains = None;
        let mut category = default_category;

        if let Some(opts) = options_str {
            for opt in opts.split(',') {
                let opt = opt.trim();
                if opt == "third-party" || opt == "3p" {
                    third_party_only = Some(true);
                } else if opt == "~third-party" || opt == "~3p" {
                    third_party_only = Some(false);
                } else if opt.starts_with("domain=") {
                    let domain_list = &opt["domain=".len()..];
                    let mut inc = HashSet::new();
                    let mut exc = HashSet::new();
                    for d in domain_list.split('|') {
                        let d = d.trim();
                        if let Some(ex) = d.strip_prefix('~') {
                            exc.insert(ex.to_lowercase());
                        } else if !d.is_empty() {
                            inc.insert(d.to_lowercase());
                        }
                    }
                    if !inc.is_empty() {
                        domains = Some(inc);
                    }
                    if !exc.is_empty() {
                        excluded_domains = Some(exc);
                    }
                } else if opt == "script" {
                    resource_types.get_or_insert_with(HashSet::new).insert(ResourceType::Script);
                } else if opt == "image" {
                    resource_types.get_or_insert_with(HashSet::new).insert(ResourceType::Image);
                } else if opt == "stylesheet" || opt == "css" {
                    resource_types.get_or_insert_with(HashSet::new).insert(ResourceType::Stylesheet);
                } else if opt == "xmlhttprequest" || opt == "xhr" || opt == "fetch" {
                    resource_types.get_or_insert_with(HashSet::new).insert(ResourceType::XmlHttpRequest);
                } else if opt == "subdocument" || opt == "frame" {
                    resource_types.get_or_insert_with(HashSet::new).insert(ResourceType::Subdocument);
                } else if opt == "ping" {
                    resource_types.get_or_insert_with(HashSet::new).insert(ResourceType::Ping);
                } else if opt == "other" {
                    resource_types.get_or_insert_with(HashSet::new).insert(ResourceType::Other);
                } else if opt == "tracker" {
                    category = BlockCategory::Tracker;
                }
            }
        }

        let pattern = if let Some(stripped) = pattern_str.strip_prefix("||") {
            let clean = stripped.trim_end_matches('^');
            if let Some((dom, path)) = clean.split_once('/') {
                RulePattern::DomainPathAnchor {
                    domain: dom.to_lowercase(),
                    path_prefix: format!("/{}", path.trim_start_matches('/')),
                }
            } else {
                RulePattern::DomainAnchor(clean.trim_end_matches('/').to_lowercase())
            }
        } else if let Some(stripped) = pattern_str.strip_prefix('|') {
            RulePattern::Prefix(stripped.to_lowercase())
        } else if let Some(stripped) = pattern_str.strip_suffix('|') {
            RulePattern::Suffix(stripped.to_lowercase())
        } else if pattern_str.contains('*') || pattern_str.contains('^') {
            let regex_str = glob_to_regex(pattern_str);
            match Regex::new(&regex_str) {
                Ok(r) => RulePattern::Regex(r),
                Err(_) => RulePattern::Contains(pattern_str.replace('*', "").to_lowercase()),
            }
        } else {
            RulePattern::Contains(pattern_str.to_lowercase())
        };

        Some(NetworkRule {
            raw: trimmed.to_string(),
            is_exception,
            pattern,
            third_party_only,
            resource_types,
            domains,
            excluded_domains,
            category,
        })
    }

    /// Check if this rule matches a specific network request.
    pub fn matches(
        &self,
        request_url: &Url,
        request_domain: &str,
        page_domain: &str,
        resource_type: ResourceType,
    ) -> bool {
        // 1. Check domain scoping
        if let Some(ref exc) = self.excluded_domains {
            if exc.contains(page_domain) || exc.iter().any(|d| page_domain.ends_with(d)) {
                return false;
            }
        }
        if let Some(ref inc) = self.domains {
            let matched = inc.contains(page_domain) || inc.iter().any(|d| page_domain.ends_with(d));
            if !matched {
                return false;
            }
        }

        // 2. Check third-party option
        if let Some(third_party) = self.third_party_only {
            let is_third_party = is_third_party(request_domain, page_domain);
            if third_party != is_third_party {
                return false;
            }
        }

        // 3. Check resource type
        if let Some(ref types) = self.resource_types {
            if !types.contains(&resource_type) {
                return false;
            }
        }

        // 4. Check URL pattern
        let url_str = request_url.as_str().to_lowercase();
        match &self.pattern {
            RulePattern::DomainAnchor(domain) => {
                let req_d = request_domain.to_lowercase();
                req_d == *domain || req_d.ends_with(&format!(".{}", domain))
            }
            RulePattern::DomainPathAnchor { domain, path_prefix } => {
                let req_d = request_domain.to_lowercase();
                let domain_matched = req_d == *domain || req_d.ends_with(&format!(".{}", domain));
                domain_matched && request_url.path().starts_with(path_prefix)
            }
            RulePattern::Prefix(prefix) => url_str.starts_with(prefix),
            RulePattern::Suffix(suffix) => url_str.ends_with(suffix),
            RulePattern::Contains(sub) => url_str.contains(sub),
            RulePattern::Regex(re) => re.is_match(&url_str),
        }
    }
}

impl CosmeticRule {
    /// Parse an element hiding rule (e.g. `##.ad`, `domain.com##.sponsor`, `domain.com#@#.allowed`)
    pub fn parse(line: &str) -> Option<Self> {
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with('!') || trimmed.starts_with('[') {
            return None;
        }

        let (is_exception, separator) = if trimmed.contains("#@#") {
            (true, "#@#")
        } else if trimmed.contains("##") {
            (false, "##")
        } else {
            return None;
        };

        let (domain_part, selector_part) = trimmed.split_once(separator)?;
        let selector = selector_part.trim().to_string();
        if selector.is_empty() {
            return None;
        }

        let (domains, excluded_domains) = if domain_part.is_empty() {
            (None, None)
        } else {
            let mut inc = HashSet::new();
            let mut exc = HashSet::new();
            for d in domain_part.split(',') {
                let d = d.trim();
                if let Some(stripped) = d.strip_prefix('~') {
                    exc.insert(stripped.to_lowercase());
                } else if !d.is_empty() {
                    inc.insert(d.to_lowercase());
                }
            }
            (
                if inc.is_empty() { None } else { Some(inc) },
                if exc.is_empty() { None } else { Some(exc) },
            )
        };

        Some(CosmeticRule {
            raw: trimmed.to_string(),
            selector,
            domains,
            excluded_domains,
            is_exception,
        })
    }

    /// Check if this cosmetic rule applies to the given page domain.
    pub fn applies_to_domain(&self, domain: &str) -> bool {
        let d = domain.to_lowercase();
        if let Some(ref exc) = self.excluded_domains {
            if exc.contains(&d) || exc.iter().any(|e| d.ends_with(e)) {
                return false;
            }
        }
        if let Some(ref inc) = self.domains {
            return inc.contains(&d) || inc.iter().any(|e| d.ends_with(e));
        }
        true
    }
}

/// Convert an adblock glob pattern to a valid regular expression.
fn glob_to_regex(pattern: &str) -> String {
    let mut regex = String::with_capacity(pattern.len() * 2);
    for c in pattern.chars() {
        match c {
            '*' => regex.push_str(".*"),
            '^' => regex.push_str("(?:[/?#:]|$)"),
            '.' | '(' | ')' | '[' | ']' | '{' | '}' | '+' | '?' | '\\' | '|' | '$' => {
                regex.push('\\');
                regex.push(c);
            }
            _ => regex.push(c),
        }
    }
    regex
}

/// Determine whether request_domain is third-party to page_domain.
pub fn is_third_party(request_domain: &str, page_domain: &str) -> bool {
    if request_domain.is_empty() || page_domain.is_empty() {
        return false;
    }
    let r_base = extract_registered_domain(request_domain);
    let p_base = extract_registered_domain(page_domain);
    !r_base.eq_ignore_ascii_case(p_base)
}

/// Basic effective registered domain extraction (e.g. `sub.example.com` -> `example.com`, `example.co.uk` -> `example.co.uk`).
pub fn extract_registered_domain(domain: &str) -> &str {
    let parts: Vec<&str> = domain.trim_end_matches('.').split('.').collect();
    if parts.len() <= 2 {
        return domain;
    }

    // Common two-level TLDs
    let last = parts[parts.len() - 1];
    let second_last = parts[parts.len() - 2];
    let is_cc_tld = (last == "uk" || last == "au" || last == "br" || last == "jp" || last == "nz")
        && (second_last == "co" || second_last == "com" || second_last == "org" || second_last == "gov" || second_last == "edu");

    if is_cc_tld && parts.len() >= 3 {
        let start = domain.len() - (parts[parts.len() - 3].len() + second_last.len() + last.len() + 2);
        &domain[start..]
    } else {
        let start = domain.len() - (second_last.len() + last.len() + 1);
        &domain[start..]
    }
}

/// List of well-known invasive tracking query parameters to sanitize from URLs.
pub const TRACKING_PARAMS: &[&str] = &[
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "utm_id",
    "gclid",
    "gclsrc",
    "dclid",
    "gad_source",
    "gbraid",
    "wbraid",
    "fbclid",
    "msclkid",
    "twclid",
    "mc_eid",
    "_hsenc",
    "_hsmi",
    "igshid",
    "yclid",
    "_openstat",
    "sc_cid",
    "zanpid",
];

/// Remove invasive tracking parameters from a URL without breaking legitimate query params.
pub fn sanitize_tracking_params(url: &Url) -> (Url, usize) {
    let mut cleaned = url.clone();
    let mut stripped_count = 0;

    if url.query().is_none() {
        return (cleaned, 0);
    }

    let mut retained_pairs = Vec::new();
    for (k, v) in url.query_pairs() {
        let k_lower = k.to_lowercase();
        if TRACKING_PARAMS.contains(&k_lower.as_str()) {
            stripped_count += 1;
        } else {
            retained_pairs.push((k.into_owned(), v.into_owned()));
        }
    }

    if stripped_count > 0 {
        if retained_pairs.is_empty() {
            cleaned.set_query(None);
        } else {
            let mut serializer = url::form_urlencoded::Serializer::new(String::new());
            for (k, v) in retained_pairs {
                serializer.append_pair(&k, &v);
            }
            cleaned.set_query(Some(&serializer.finish()));
        }
    }

    (cleaned, stripped_count)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_domain_anchor() {
        let rule = NetworkRule::parse("||doubleclick.net^", BlockCategory::Ad).unwrap();
        assert!(!rule.is_exception);
        assert_eq!(rule.category, BlockCategory::Ad);

        let url = Url::parse("https://ad.doubleclick.net/pagead/ads?foo=bar").unwrap();
        assert!(rule.matches(&url, "ad.doubleclick.net", "example.com", ResourceType::Script));

        let non_match = Url::parse("https://notdoubleclick.net/foo").unwrap();
        assert!(!rule.matches(&non_match, "notdoubleclick.net", "example.com", ResourceType::Script));
    }

    #[test]
    fn test_parse_exception_rule() {
        let rule = NetworkRule::parse("@@||allowed-ad.com^", BlockCategory::Ad).unwrap();
        assert!(rule.is_exception);

        let url = Url::parse("https://allowed-ad.com/script.js").unwrap();
        assert!(rule.matches(&url, "allowed-ad.com", "example.com", ResourceType::Script));
    }

    #[test]
    fn test_third_party_option() {
        let rule = NetworkRule::parse("||tracker.com^$third-party", BlockCategory::Tracker).unwrap();
        assert_eq!(rule.third_party_only, Some(true));

        let url = Url::parse("https://tracker.com/pixel.gif").unwrap();
        // 3rd party request from example.com -> tracker.com
        assert!(rule.matches(&url, "tracker.com", "example.com", ResourceType::Image));
        // 1st party request from tracker.com -> tracker.com
        assert!(!rule.matches(&url, "tracker.com", "tracker.com", ResourceType::Image));
    }

    #[test]
    fn test_cosmetic_rule_parse() {
        let rule = CosmeticRule::parse("##.banner-ad").unwrap();
        assert!(!rule.is_exception);
        assert_eq!(rule.selector, ".banner-ad");
        assert!(rule.applies_to_domain("anydomain.com"));

        let site_rule = CosmeticRule::parse("news.com##.sponsored-post").unwrap();
        assert!(site_rule.applies_to_domain("news.com"));
        assert!(site_rule.applies_to_domain("sub.news.com"));
        assert!(!site_rule.applies_to_domain("other.com"));
    }

    #[test]
    fn test_sanitize_tracking_params() {
        let raw = Url::parse("https://example.com/article?title=cottagecore&utm_source=twitter&fbclid=123456&page=2").unwrap();
        let (cleaned, count) = sanitize_tracking_params(&raw);
        assert_eq!(count, 2);
        assert_eq!(cleaned.as_str(), "https://example.com/article?title=cottagecore&page=2");
    }
}
