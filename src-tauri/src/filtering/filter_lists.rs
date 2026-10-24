use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FilterListMetadata {
    pub id: String,
    pub name: String,
    pub description: String,
    pub source_url: Option<String>,
    pub enabled: bool,
    pub rule_count: usize,
    pub last_updated: Option<String>,
    pub is_builtin: bool,
}

pub struct FilterListManager {
    cache_dir: PathBuf,
}

impl FilterListManager {
    pub fn new(app_data_dir: &Path) -> Self {
        let cache_dir = app_data_dir.join("nooki").join("filter_lists");
        let _ = fs::create_dir_all(&cache_dir);
        Self { cache_dir }
    }

    /// Returns default filter list subscriptions.
    pub fn get_default_subscriptions() -> Vec<FilterListMetadata> {
        vec![
            FilterListMetadata {
                id: "nooki-ads".to_string(),
                name: "Nooki Core Ad Blocker".to_string(),
                description: "Blocks display ads, video pre-rolls, interstitials, and popups.".to_string(),
                source_url: Some("https://easylist.to/easylist/easylist.txt".to_string()),
                enabled: true,
                rule_count: 0,
                last_updated: None,
                is_builtin: true,
            },
            FilterListMetadata {
                id: "nooki-trackers".to_string(),
                name: "Nooki Privacy & Anti-Tracker".to_string(),
                description: "Stops web telemetry, fingerprinting scripts, and third-party trackers.".to_string(),
                source_url: Some("https://easylist.to/easylist/easyprivacy.txt".to_string()),
                enabled: true,
                rule_count: 0,
                last_updated: None,
                is_builtin: true,
            },
            FilterListMetadata {
                id: "nooki-malware".to_string(),
                name: "Nooki Malicious & Phishing Guard".to_string(),
                description: "Protects against malicious domains, in-browser miners, and scam sites.".to_string(),
                source_url: Some("https://pgl.yoyo.org/adservers/serverlist.php?hostformat=hosts&showintro=0&mimetype=plaintext".to_string()),
                enabled: true,
                rule_count: 0,
                last_updated: None,
                is_builtin: true,
            },
            FilterListMetadata {
                id: "nooki-annoyances".to_string(),
                name: "Nooki Cookie & Annoyance Blocker".to_string(),
                description: "Hides intrusive cookie consent popups and GDPR nag overlays.".to_string(),
                source_url: Some("https://secure.fanboy.co.nz/fanboy-cookiemonster.txt".to_string()),
                enabled: true,
                rule_count: 0,
                last_updated: None,
                is_builtin: true,
            },
        ]
    }

    /// Read raw rules for a list from disk cache, falling back to embedded defaults.
    pub fn load_list_content(&self, id: &str) -> String {
        let cached_file = self.cache_dir.join(format!("{}.txt", id));
        if cached_file.exists() {
            if let Ok(content) = fs::read_to_string(&cached_file) {
                if !content.trim().is_empty() {
                    return content;
                }
            }
        }
        Self::get_embedded_defaults(id)
    }

    /// Save updated list content to disk.
    pub fn save_list_content(&self, id: &str, content: &str) -> std::io::Result<()> {
        let cached_file = self.cache_dir.join(format!("{}.txt", id));
        fs::write(cached_file, content)
    }

    /// Returns embedded rules for built-in lists ensuring instant, 100% offline out-of-the-box operation.
    pub fn get_embedded_defaults(id: &str) -> String {
        match id {
            "nooki-ads" => EMBEDDED_ADS_RULES.to_string(),
            "nooki-trackers" => EMBEDDED_TRACKER_RULES.to_string(),
            "nooki-malware" => EMBEDDED_MALWARE_RULES.to_string(),
            "nooki-annoyances" => EMBEDDED_ANNOYANCE_RULES.to_string(),
            _ => String::new(),
        }
    }
}

pub const EMBEDDED_ADS_RULES: &str = r#"[Adblock Plus 2.0]
! Title: Nooki Core Ads Filter
||doubleclick.net^
||googlesyndication.com^
||googleadservices.com^
||adnxs.com^
||criteo.com^
||criteo.net^
||rubiconproject.com^
||pubmatic.com^
||taboola.com^
||outbrain.com^
||adroll.com^
||popads.net^
||propellerads.com^
||adsterra.com^
||revcontent.com^
||amazon-adsystem.com^
||media.net^
||infolinks.com^
||trafficjunky.net^
||exoclick.com^
||bidvertiser.com^
||buysellads.com^
||adcolony.com^
||applovin.com^
||unityads.unity3d.com^
||vungle.com^
||chartboost.com^
||ironsrc.com^
||advertising.com^
||adtechus.com^
||smartadserver.com^
||yieldmo.com^
||sovrn.com^
||openx.net^
||casalemedia.com^
||adpushup.com^
||adblade.com^
||zergnet.com^
||zedo.com^
||adform.net^
||teads.tv^
||sharethrough.com^
||exponential.com^
||tribalfusion.com^
||mgid.com^
||contentexchange.me^
||admixer.net^
||admanmedia.com^
||adskeeper.co.uk^
||adrunnr.com^
||adspirit.de^
||affec.tv^
||aniview.com^
||bidswitch.net^
||bttrack.com^
||contextweb.com^
||conversantmedia.com^
||districtm.io^
||e-planning.net^
||gumgum.com^
||imrworldwide.com^
||indexexchange.com^
||innovid.com^
||lijit.com^
||liveramp.com^
||mathtag.com^
||mediav.com^
||moatads.com^
||nexage.com^
||onetag-sys.com^
||quantcount.com^
||rhythmone.com^
||simpli.fi^
||spotxchange.com^
||stickyads.tv^
||tremorhub.com^
||triplelift.com^
||undertone.com^
||unrulymedia.com^
||yieldlove.com^
||yieldoptimizer.com^
! Common ad element hiding
##.ad-container
##.ad-banner
##.ad_banner
##.ad-wrapper
##.advertisement
##[aria-label="advertisement"]
##[aria-label="sponsored"]
##.sponsored-post
##.adsbygoogle
##div[id^="google_ads_"]
##div[id^="ad-div"]
##div[id^="dfp-ad-"]
##.taboola-ad
##.outbrain-ad
##.native-ad
##.dfp-ad
##.adbox
##.adunit
##.ad-placement
##.ad-slot
##.ad-holder
##.ad-space
##.ad_box
##.ad_unit
##.ad_slot
"#;

pub const EMBEDDED_TRACKER_RULES: &str = r#"[Adblock Plus 2.0]
! Title: Nooki Privacy & Trackers Filter
||google-analytics.com^$tracker
||analytics.google.com^$tracker
||googletagmanager.com/gtag/js^$tracker
||googletagservices.com^$tracker
||hotjar.com^$tracker
||mixpanel.com^$tracker
||segment.io^$tracker
||segment.com^$tracker
||amplitude.com^$tracker
||clarity.ms^$tracker
||fullstory.com^$tracker
||mouseflow.com^$tracker
||crazyegg.com^$tracker
||newrelic.com^$tracker
||nr-data.net^$tracker
||datadoghq-browser-agent.com^$tracker
||sentry.io/api^$tracker
||bugsnag.com^$tracker
||scorecardresearch.com^$tracker
||quantserve.com^$tracker
||statcounter.com^$tracker
||yandex.ru/metrika^$tracker
||mc.yandex.ru^$tracker
||connect.facebook.net/en_US/fbevents.js^$tracker
||connect.facebook.net/signals/config/^$tracker
||snap.licdn.com^$tracker
||tr.snapchat.com^$tracker
||analytics.tiktok.com^$tracker
||ads-twitter.com^$tracker
||pixel.wp.com^$tracker
||branch.io^$tracker
||appsflyer.com^$tracker
||adjust.com^$tracker
||kochava.com^$tracker
||heapanalytics.com^$tracker
||inspectlet.com^$tracker
||smartlook.com^$tracker
||logrocket.io^$tracker
||permutive.com^$tracker
||chartbeat.com^$tracker
||chartbeat.net^$tracker
||kissmetrics.com^$tracker
||optimizely.com^$tracker
||vwo.com^$tracker
||qualaroo.com^$tracker
||woopra.com^$tracker
||clicky.com^$tracker
||matomo.org^$tracker
||piwik.pro^$tracker
||parsely.com^$tracker
||cxense.com^$tracker
||bluekai.com^$tracker
||demdex.net^$tracker
||krxd.net^$tracker
||tapad.com^$tracker
||exelator.com^$tracker
||agkn.com^$tracker
||everesttech.net^$tracker
||bkrtx.com^$tracker
"#;

pub const EMBEDDED_MALWARE_RULES: &str = r#"[Adblock Plus 2.0]
! Title: Nooki Malicious Domains
||coinhive.com^
||crypto-loot.com^
||jsecoin.com^
||authedmine.com^
||webminepool.com^
||coin-have.com^
||minr.pw^
||cryptoloot.pro^
||coinnebula.com^
||webmine.pro^
||browsermine.com^
||cloudcoins.co^
||mineralt.io^
||monerominer.rocks^
"#;

pub const EMBEDDED_ANNOYANCE_RULES: &str = r#"[Adblock Plus 2.0]
! Title: Nooki Annoyances Filter
##.cookie-banner
##.cookie-consent
##.cookie-notice
##.cookie-policy-notice
##.gdpr-banner
##.cc-banner
##[id*="cookie-banner"]
##[id*="cookieConsent"]
##.optanon-alert-box-wrapper
##.onetrust-pc-dark-filter
##.onetrust-consent-sdk
##.qc-cmp2-container
##.didomi-popup-container
##.trustarc-banner-container
##div[class*="ConsentBanner"]
##div[class*="cookie-container"]
##div[class*="CookieNotice"]
"#;
