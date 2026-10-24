pub mod browser;
pub mod commands;
pub mod filtering;
pub mod settings;
pub mod wallpapers;

use browser::BrowserState;
use filtering::AdBlockEngine;
use settings::SettingsManager;
use std::path::PathBuf;
use std::sync::{Arc, RwLock};
use tauri::{Manager, WindowEvent};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_data_dir = dirs::data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("Nooki");

    let browser_state = Arc::new(BrowserState::new(&app_data_dir));
    let adblock_engine = Arc::new(RwLock::new(AdBlockEngine::new(&app_data_dir)));
    let settings_manager = Arc::new(SettingsManager::new(&app_data_dir));

    let browser_clone = Arc::clone(&browser_state);

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(browser_state)
        .manage(adblock_engine)
        .manage(settings_manager)
        .setup(|app| {
            println!("============================================================");
            println!("🌿 NOOKI BROWSER RUST BACKEND INITIALIZED");
            println!("============================================================");

            #[cfg(debug_assertions)]
            {
                if let Some(win) = app.get_webview_window("main") {
                    println!("[Nooki Rust] Main window found: {:?}", win.label());
                    win.open_devtools();
                    println!("[Nooki Rust] DevTools automatically opened for debugging.");
                } else if let Some(win) = app.get_window("main") {
                    println!("[Nooki Rust] Main window (as Window) found: {:?}", win.label());
                } else {
                    eprintln!("[Nooki Rust WARNING] Could not find window 'main' during setup!");
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Logging
            commands::log_frontend_event,
            // Tabs & Navigation
            commands::get_tabs,
            commands::get_active_tab_id,
            commands::create_tab,
            commands::switch_tab,
            commands::close_tab,
            commands::reopen_closed_tab,
            commands::navigate_tab,
            commands::reload_tab,
            commands::go_back,
            commands::go_forward,
            commands::update_tab_bounds,
            // Shield & Filtering
            commands::get_tab_shield_stats,
            commands::get_session_shield_stats,
            commands::toggle_global_shield,
            commands::toggle_site_shield,
            commands::is_site_whitelisted,
            commands::get_filter_lists,
            commands::toggle_filter_list,
            commands::update_filter_lists,
            commands::get_blocked_logs,
            // Bookmarks
            commands::get_bookmarks,
            commands::add_bookmark,
            commands::remove_bookmark,
            commands::is_bookmarked,
            // History
            commands::get_history,
            commands::search_history,
            commands::delete_history_item,
            commands::clear_history,
            // Downloads
            commands::get_downloads,
            commands::clear_completed_downloads,
            // Settings
            commands::get_user_settings,
            commands::save_user_settings,
            commands::clear_browsing_data,
            // Wallpapers
            commands::get_wallpapers,
            commands::get_daily_wallpaper,
        ])
        .on_window_event(move |window, event| {
            if let WindowEvent::Resized(size) = event {
                let scale = window.scale_factor().unwrap_or(1.0);
                let logical_w = size.width as f64 / scale;
                let logical_h = size.height as f64 / scale;
                let top_offset = *browser_clone.toolbar_height.read().unwrap();
                let active_id = browser_clone.get_active_tab_id();
                let wv_label = format!("wv-{}", active_id);

                if let Some(wv) = window.app_handle().get_webview(&wv_label) {
                    let _ = wv.set_position(tauri::LogicalPosition::new(0.0, top_offset));
                    let _ = wv.set_size(tauri::LogicalSize::new(
                        logical_w,
                        (logical_h - top_offset).max(50.0),
                    ));
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running Nooki browser application");
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::commands::resolve_url_or_search;
    use crate::filtering::rules::{BlockCategory, FilterDecision, NetworkRule, ResourceType};
    use crate::wallpapers::get_daily_scenic_wallpaper;
    use url::Url;

    #[test]
    fn test_engine_init() {
        let temp_dir = std::env::temp_dir().join(format!("nooki_test_{}", chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0)));
        let engine = AdBlockEngine::new(&temp_dir);
        assert!(engine.global_enabled);
        assert!(!engine.block_rules.is_empty());
        assert!(!engine.cosmetic_rules.is_empty());
    }

    #[test]
    fn test_browser_state_init() {
        let temp_dir = std::env::temp_dir().join(format!("nooki_test_bs_{}", chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0)));
        let state = BrowserState::new(&temp_dir);
        let tabs = state.get_tabs();
        assert_eq!(tabs.len(), 1);
        assert_eq!(tabs[0].url, "nooki://newtab");
    }

    #[test]
    fn test_url_vs_search_detection() {
        // Direct domains
        assert_eq!(resolve_url_or_search("duckduckgo.com", "duckduckgo"), "https://duckduckgo.com");
        assert_eq!(resolve_url_or_search("news.ycombinator.com", "duckduckgo"), "https://news.ycombinator.com");
        assert_eq!(resolve_url_or_search("https://github.com", "duckduckgo"), "https://github.com");
        assert_eq!(resolve_url_or_search("nooki://newtab", "duckduckgo"), "nooki://newtab");

        // Queries
        assert_eq!(
            resolve_url_or_search("cozy forest cottage", "duckduckgo"),
            "https://duckduckgo.com/?q=cozy+forest+cottage"
        );
        assert_eq!(
            resolve_url_or_search("rust programming", "brave"),
            "https://search.brave.com/search?q=rust+programming"
        );
        assert_eq!(
            resolve_url_or_search("plant care", "google"),
            "https://www.google.com/search?q=plant+care"
        );
        assert_eq!(
            resolve_url_or_search("autumn leaves", "ecosia"),
            "https://www.ecosia.org/search?q=autumn+leaves"
        );
    }

    #[test]
    fn test_tab_lifecycle() {
        let temp_dir = std::env::temp_dir().join(format!("nooki_test_life_{}", chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0)));
        let state = BrowserState::new(&temp_dir);

        // Create new tab
        let tab2 = state.create_tab(Some("https://example.com".to_string()));
        assert_eq!(state.get_tabs().len(), 2);
        assert_eq!(state.get_active_tab_id(), tab2.id);

        // Switch back
        let initial_id = state.get_tabs()[0].id.clone();
        state.set_active_tab_id(&initial_id);
        assert_eq!(state.get_active_tab_id(), initial_id);

        // Close tab2
        state.close_tab(&tab2.id);
        assert_eq!(state.get_tabs().len(), 1);

        // Reopen recently closed tab
        let reopened = state.reopen_closed_tab();
        assert!(reopened.is_some());
        assert_eq!(state.get_tabs().len(), 2);
    }

    #[test]
    fn test_settings_persistence() {
        let temp_dir = std::env::temp_dir().join(format!("nooki_test_sett_{}", chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0)));
        let manager = SettingsManager::new(&temp_dir);
        let mut initial = manager.get();
        initial.theme = "dark".to_string();
        initial.accent_color = "warm-amber".to_string();
        initial.search_engine = "brave".to_string();

        assert!(manager.update(initial.clone()).is_ok());

        // Reload from disk in a fresh instance
        let reloaded_manager = SettingsManager::new(&temp_dir);
        let saved = reloaded_manager.get();
        assert_eq!(saved.theme, "dark");
        assert_eq!(saved.accent_color, "warm-amber");
        assert_eq!(saved.search_engine, "brave");
    }

    #[test]
    fn test_daily_wallpaper_consistency() {
        let wp1 = get_daily_scenic_wallpaper();
        let wp2 = get_daily_scenic_wallpaper();
        assert_eq!(wp1.id, wp2.id);
        assert!(!wp1.image_path.is_empty());
    }

    #[test]
    fn test_allow_rule_precedence_and_whitelisting() {
        let temp_dir = std::env::temp_dir().join(format!("nooki_test_prec_{}", chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0)));
        let mut engine = AdBlockEngine::new(&temp_dir);

        // Add explicit block rule
        let block_rule = NetworkRule::parse("||ads.tracker.com^", BlockCategory::Ad).unwrap();
        engine.block_rules.push(block_rule);

        // Add exception rule
        let allow_rule = NetworkRule::parse("@@||ads.tracker.com/safe.js^", BlockCategory::Ad).unwrap();
        engine.exception_rules.push(allow_rule);

        let blocked_url = Url::parse("https://ads.tracker.com/banner.js").unwrap();
        let allowed_url = Url::parse("https://ads.tracker.com/safe.js?foo=bar").unwrap();

        // 1. Unmatched should block
        let decision1 = engine.check_request("tab-1", &blocked_url, "example.com", ResourceType::Script);
        assert!(matches!(decision1, FilterDecision::Block { .. }));

        // 2. Exception rule overrides block rule
        let decision2 = engine.check_request("tab-1", &allowed_url, "example.com", ResourceType::Script);
        assert_eq!(decision2, FilterDecision::Allow);

        // 3. User whitelisting allows entire domain
        engine.whitelist_domain("example.com");
        let decision3 = engine.check_request("tab-1", &blocked_url, "example.com", ResourceType::Script);
        assert_eq!(decision3, FilterDecision::Allow);
    }

    #[test]
    fn test_filtering_statistics_tracking() {
        let temp_dir = std::env::temp_dir().join(format!("nooki_test_stat_{}", chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0)));
        let engine = AdBlockEngine::new(&temp_dir);

        let url = Url::parse("https://doubleclick.net/ad.js").unwrap();
        engine.check_request("tab-test", &url, "news.com", ResourceType::Script);

        let tab_stats = engine.stats.get_tab_stats("tab-test");
        assert!(tab_stats.blocked_ads >= 1);
        assert!(tab_stats.total >= 1);

        let session_stats = engine.stats.get_session_stats();
        assert!(session_stats.total >= 1);
    }

    #[test]
    fn test_browsing_data_clearing() {
        let temp_dir = std::env::temp_dir().join(format!("nooki_test_clear_{}", chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0)));
        let state = BrowserState::new(&temp_dir);

        state.history.record_visit("https://news.ycombinator.com", "Hacker News");
        state.history.record_visit("https://duckduckgo.com", "DuckDuckGo");
        assert_eq!(state.history.get_all().len(), 2);

        state.history.clear_all();
        assert_eq!(state.history.get_all().len(), 0);
    }
}
