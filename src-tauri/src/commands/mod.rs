use crate::browser::bookmarks::Bookmark;
use crate::browser::downloads::DownloadItem;
use crate::browser::history::HistoryItem;
use crate::browser::tabs::BrowserTab;
use crate::browser::BrowserState;
use crate::filtering::filter_lists::FilterListMetadata;
use crate::filtering::rules::{sanitize_tracking_params, ResourceType};
use crate::filtering::stats::{BlockedLogEntry, SessionShieldStats, TabShieldStats};
use crate::filtering::AdBlockEngine;
use crate::settings::{SettingsManager, UserSettings};
use crate::wallpapers::{get_curated_wallpapers, get_daily_scenic_wallpaper, ScenicWallpaper};
use std::sync::{Arc, RwLock};
use tauri::{AppHandle, LogicalPosition, LogicalSize, Manager, WebviewBuilder, WebviewUrl};
use url::Url;

// --- TABS & NAVIGATION COMMANDS ---

#[tauri::command]
pub fn log_frontend_event(level: String, message: String) {
    let prefix = match level.to_lowercase().as_str() {
        "error" => "🛑 [Nooki JS ERROR]",
        "warn" => "⚠️ [Nooki JS WARN]",
        _ => "💬 [Nooki JS INFO]",
    };
    println!("{} {}", prefix, message);
}

#[tauri::command]
pub async fn get_tabs(browser: tauri::State<'_, Arc<BrowserState>>) -> Result<Vec<BrowserTab>, String> {
    let tabs = browser.get_tabs();
    println!("[Nooki Rust] get_tabs() -> {} tab(s)", tabs.len());
    Ok(tabs)
}

#[tauri::command]
pub async fn get_active_tab_id(browser: tauri::State<'_, Arc<BrowserState>>) -> Result<String, String> {
    let id = browser.get_active_tab_id();
    println!("[Nooki Rust] get_active_tab_id() -> '{}'", id);
    Ok(id)
}

#[tauri::command]
pub async fn create_tab(
    url: Option<String>,
    browser: tauri::State<'_, Arc<BrowserState>>,
    app: AppHandle,
) -> Result<BrowserTab, String> {
    println!("[Nooki Rust] create_tab(url: {:?})", url);
    let tab = browser.create_tab(url.clone());
    let active_id = tab.id.clone();
    manage_webviews_visibility(&app, &browser, &active_id);
    println!("[Nooki Rust] -> Tab created: id={}, url={}", tab.id, tab.url);
    Ok(tab)
}

#[tauri::command]
pub async fn switch_tab(
    tab_id: String,
    browser: tauri::State<'_, Arc<BrowserState>>,
    app: AppHandle,
) -> Result<String, String> {
    println!("[Nooki Rust] switch_tab(tab_id: '{}')", tab_id);
    browser.set_active_tab_id(&tab_id);
    manage_webviews_visibility(&app, &browser, &tab_id);
    Ok(tab_id)
}

#[tauri::command]
pub async fn close_tab(
    tab_id: String,
    browser: tauri::State<'_, Arc<BrowserState>>,
    app: AppHandle,
) -> Result<Option<String>, String> {
    println!("[Nooki Rust] close_tab(tab_id: '{}')", tab_id);
    let wv_label = format!("wv-{}", tab_id);
    if let Some(wv) = app.get_webview(&wv_label) {
        println!("[Nooki Rust] Closing webview '{}'", wv_label);
        let _ = wv.close();
    }

    let next_active = browser.close_tab(&tab_id);
    if let Some(ref active) = next_active {
        println!("[Nooki Rust] Next active tab after closing: '{}'", active);
        manage_webviews_visibility(&app, &browser, active);
    }
    Ok(next_active)
}

#[tauri::command]
pub async fn reopen_closed_tab(
    browser: tauri::State<'_, Arc<BrowserState>>,
    app: AppHandle,
) -> Result<Option<BrowserTab>, String> {
    println!("[Nooki Rust] reopen_closed_tab called");
    let tab = browser.reopen_closed_tab();
    if let Some(ref t) = tab {
        let active_id = t.id.clone();
        println!("[Nooki Rust] -> Reopened tab: id={}, url={}", t.id, t.url);
        manage_webviews_visibility(&app, &browser, &active_id);
    }
    Ok(tab)
}

#[tauri::command]
pub async fn navigate_tab(
    tab_id: String,
    input_url: String,
    browser: tauri::State<'_, Arc<BrowserState>>,
    engine: tauri::State<'_, Arc<RwLock<AdBlockEngine>>>,
    settings: tauri::State<'_, Arc<SettingsManager>>,
    app: AppHandle,
) -> Result<BrowserTab, String> {
    println!("------------------------------------------------------------");
    println!("[Nooki Rust] navigate_tab(tab_id: '{}', input: '{}')", tab_id, input_url);
    let user_settings = settings.get();

    // 1. Resolve URL or Search Query
    let target_url = resolve_url_or_search(&input_url, &user_settings.search_engine);
    println!("[Nooki Rust] -> Resolved target URL: '{}'", target_url);

    // 2. Check for internal nooki:// protocol
    if target_url.starts_with("nooki://") {
        println!("[Nooki Rust] -> Internal page requested: '{}'", target_url);
        browser.update_tab(&tab_id, |t| {
            t.url = target_url.clone();
            t.title = if target_url == "nooki://newtab" {
                "New Tab".to_string()
            } else {
                target_url.replace("nooki://", "").to_uppercase()
            };
            t.is_loading = false;
        });

        // Hide child webview so React internal UI is visible
        let wv_label = format!("wv-{}", tab_id);
        if let Some(wv) = app.get_webview(&wv_label) {
            println!("[Nooki Rust] Hiding webview '{}' for internal page", wv_label);
            let _ = wv.hide();
        }

        return browser
            .get_tabs()
            .into_iter()
            .find(|t| t.id == tab_id)
            .ok_or_else(|| "Tab not found".to_string());
    }

    // 3. Parse and sanitize URL tracking parameters if enabled
    let parsed = Url::parse(&target_url).map_err(|e| {
        eprintln!("[Nooki Rust ERROR] Url::parse failed for '{}': {:?}", target_url, e);
        e.to_string()
    })?;
    let (sanitized_url, _stripped_count) = if user_settings.strip_tracking_params {
        let (s, count) = sanitize_tracking_params(&parsed);
        if count > 0 {
            println!("[Nooki Shield] Stripped {} tracking query parameter(s)", count);
        }
        (s, count)
    } else {
        (parsed, 0)
    };

    let domain = sanitized_url.host_str().unwrap_or("").to_string();
    println!("[Nooki Rust] Sanitized URL: '{}', domain: '{}'", sanitized_url, domain);

    // 4. Check AdBlockEngine for top-level navigation (malware / ad blocking)
    {
        let eng = engine.read().unwrap();
        let decision = eng.check_request(&tab_id, &sanitized_url, &domain, ResourceType::Subdocument);
        if let crate::filtering::rules::FilterDecision::Block { ref rule, .. } = decision {
            println!("[Nooki Shield BLOCKED] Top-level navigation to '{}' (rule: {})", domain, rule);
            browser.update_tab(&tab_id, |t| {
                t.url = format!("nooki://blocked?domain={}&rule={}", domain, rule);
                t.title = format!("Blocked: {}", domain);
                t.is_loading = false;
            });
            let wv_label = format!("wv-{}", tab_id);
            if let Some(wv) = app.get_webview(&wv_label) {
                let _ = wv.hide();
            }
            return browser
                .get_tabs()
                .into_iter()
                .find(|t| t.id == tab_id)
                .ok_or_else(|| "Tab not found".to_string());
        }
    }

    // Record visit in history
    browser.history.record_visit(sanitized_url.as_str(), &domain);

    // 5. Update Tab metadata
    browser.update_tab(&tab_id, |t| {
        t.url = sanitized_url.as_str().to_string();
        t.title = domain.clone();
        t.is_loading = true;
    });

    // 6. Manage or create child Webview
    let wv_label = format!("wv-{}", tab_id);
    let nav_tab_id = tab_id.clone();
    let load_tab_id = tab_id.clone();
    let browser_clone = Arc::clone(&browser);
    let engine_clone = Arc::clone(&engine);

    if let Some(wv) = app.get_webview(&wv_label) {
        println!("[Nooki Rust] Navigating existing webview '{}' to '{}'", wv_label, sanitized_url);
        if let Err(e) = wv.navigate(sanitized_url) {
            eprintln!("[Nooki Rust ERROR] Failed to navigate existing webview '{}': {:?}", wv_label, e);
        }
        let _ = wv.show();
        let _ = wv.set_focus();
    } else if let Some(window) = app.get_window("main") {
        println!("[Nooki Rust] Creating new child webview '{}' on main window...", wv_label);
        let top_offset = *browser.toolbar_height.read().unwrap();
        let (w, h) = window
            .inner_size()
            .map(|s| (s.width as f64, s.height as f64))
            .unwrap_or((1280.0, 800.0));
        let scale = window.scale_factor().unwrap_or(1.0);
        let logical_w = w / scale;
        let logical_h = h / scale;
        let child_h = (logical_h - top_offset).max(100.0);
        println!("[Nooki Rust] Main window size: {}x{} (scale: {}). Attaching webview at y={}, size={}x{}", w, h, scale, top_offset, logical_w, child_h);

        let cosmetic_css = engine.read().unwrap().generate_cosmetic_css(&domain);
        let init_script = format!(
            "window.__NOOKI_INJECTED = true; (function() {{ const s = document.createElement('style'); s.textContent = {:?}; document.head ? document.head.appendChild(s) : document.addEventListener('DOMContentLoaded', () => {{ if (document.head) document.head.appendChild(s); }}); }})();",
            cosmetic_css
        );

        let nav_log_id = nav_tab_id.clone();
        let builder = WebviewBuilder::new(&wv_label, WebviewUrl::External(sanitized_url))
            .initialization_script(&init_script)
            .on_navigation(move |url| {
                let host = url.host_str().unwrap_or("");
                let eng = engine_clone.read().unwrap();
                let decision = eng.check_request(&nav_log_id, url, host, ResourceType::Subdocument);
                match decision {
                    crate::filtering::rules::FilterDecision::Block { ref rule, .. } => {
                        println!("[Nooki Shield BLOCKED] Subresource '{}' (rule: {})", url, rule);
                        false
                    }
                    crate::filtering::rules::FilterDecision::Allow => true,
                }
            })
            .on_page_load(move |wv, payload| {
                println!("[Nooki Rust] Page load event for tab {}: label={}, url={}, event={:?}", load_tab_id, wv.label(), payload.url(), payload.event());
                if matches!(payload.event(), tauri::webview::PageLoadEvent::Finished) {
                    browser_clone.update_tab(&load_tab_id, |t| {
                        t.is_loading = false;
                        t.can_go_back = true;
                    });
                }
            });

        let add_res = window.add_child(
            builder,
            LogicalPosition::new(0.0, top_offset),
            LogicalSize::new(logical_w, child_h),
        );

        match add_res {
            Ok(child_wv) => {
                println!("[Nooki Rust SUCCESS] Child webview '{}' successfully added to window!", wv_label);
                let _ = child_wv.show();
                let _ = child_wv.set_focus();
            }
            Err(err) => {
                eprintln!("[Nooki Rust CRITICAL ERROR] window.add_child('{}') failed: {:?}", wv_label, err);
            }
        }
    } else {
        eprintln!("[Nooki Rust CRITICAL ERROR] Could not locate window 'main' to attach webview '{}'!", wv_label);
    }
    println!("------------------------------------------------------------");

    browser
        .get_tabs()
        .into_iter()
        .find(|t| t.id == tab_id)
        .ok_or_else(|| "Tab not found".to_string())
}

#[tauri::command]
pub async fn reload_tab(tab_id: String, app: AppHandle) -> Result<(), String> {
    println!("[Nooki Rust] reload_tab('{}')", tab_id);
    let wv_label = format!("wv-{}", tab_id);
    if let Some(wv) = app.get_webview(&wv_label) {
        let _ = wv.eval("window.location.reload()");
    }
    Ok(())
}

#[tauri::command]
pub async fn go_back(tab_id: String, app: AppHandle) -> Result<(), String> {
    println!("[Nooki Rust] go_back('{}')", tab_id);
    let wv_label = format!("wv-{}", tab_id);
    if let Some(wv) = app.get_webview(&wv_label) {
        let _ = wv.eval("window.history.back()");
    }
    Ok(())
}

#[tauri::command]
pub async fn go_forward(tab_id: String, app: AppHandle) -> Result<(), String> {
    println!("[Nooki Rust] go_forward('{}')", tab_id);
    let wv_label = format!("wv-{}", tab_id);
    if let Some(wv) = app.get_webview(&wv_label) {
        let _ = wv.eval("window.history.forward()");
    }
    Ok(())
}

#[tauri::command]
pub async fn update_tab_bounds(
    width: f64,
    height: f64,
    toolbar_height: f64,
    browser: tauri::State<'_, Arc<BrowserState>>,
    app: AppHandle,
) -> Result<(), String> {
    {
        let mut th = browser.toolbar_height.write().unwrap();
        *th = toolbar_height;
    }

    let active_id = browser.get_active_tab_id();
    let wv_label = format!("wv-{}", active_id);

    if let Some(wv) = app.get_webview(&wv_label) {
        println!("[Nooki Rust] update_tab_bounds for active webview '{}': size={}x{}, top_offset={}", wv_label, width, height - toolbar_height, toolbar_height);
        let _ = wv.set_position(LogicalPosition::new(0.0, toolbar_height));
        let _ = wv.set_size(LogicalSize::new(width, (height - toolbar_height).max(50.0)));
    }
    Ok(())
}

// Helper to show the active webview and hide inactive ones
fn manage_webviews_visibility(app: &AppHandle, browser: &Arc<BrowserState>, active_id: &str) {
    let tabs = browser.get_tabs();
    for tab in tabs {
        let wv_label = format!("wv-{}", tab.id);
        if let Some(wv) = app.get_webview(&wv_label) {
            if tab.id == active_id && !tab.url.starts_with("nooki://") {
                println!("[Nooki Rust] Showing active webview '{}'", wv_label);
                let _ = wv.show();
                let _ = wv.set_focus();
            } else {
                println!("[Nooki Rust] Hiding inactive webview '{}'", wv_label);
                let _ = wv.hide();
            }
        }
    }
}

/// Detects whether input is already a valid URL or should be treated as a search query.
pub fn resolve_url_or_search(input: &str, search_engine: &str) -> String {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return "nooki://newtab".to_string();
    }
    if trimmed.starts_with("nooki://") {
        return trimmed.to_string();
    }

    if trimmed.starts_with("http://") || trimmed.starts_with("https://") {
        return trimmed.to_string();
    }

    // If it contains dots and no spaces, like `example.com` or `news.ycombinator.com/path`
    if !trimmed.contains(' ') && (trimmed.contains('.') || trimmed.starts_with("localhost")) {
        return format!("https://{}", trimmed);
    }

    // Otherwise, treat as search query
    let encoded = url::form_urlencoded::byte_serialize(trimmed.as_bytes()).collect::<String>();
    match search_engine.to_lowercase().as_str() {
        "brave" => format!("https://search.brave.com/search?q={}", encoded),
        "google" => format!("https://www.google.com/search?q={}", encoded),
        "ecosia" => format!("https://www.ecosia.org/search?q={}", encoded),
        _ => format!("https://duckduckgo.com/?q={}", encoded),
    }
}

// --- SHIELD & FILTERING COMMANDS ---

#[tauri::command]
pub fn get_tab_shield_stats(
    tab_id: String,
    engine: tauri::State<'_, Arc<RwLock<AdBlockEngine>>>,
) -> TabShieldStats {
    engine.read().unwrap().stats.get_tab_stats(&tab_id)
}

#[tauri::command]
pub fn get_session_shield_stats(
    engine: tauri::State<'_, Arc<RwLock<AdBlockEngine>>>,
) -> SessionShieldStats {
    engine.read().unwrap().stats.get_session_stats()
}

#[tauri::command]
pub fn toggle_global_shield(
    enabled: bool,
    engine: tauri::State<'_, Arc<RwLock<AdBlockEngine>>>,
) {
    let mut eng = engine.write().unwrap();
    eng.global_enabled = enabled;
    eng.clear_cache();
}

#[tauri::command]
pub fn toggle_site_shield(
    domain: String,
    whitelisted: bool,
    engine: tauri::State<'_, Arc<RwLock<AdBlockEngine>>>,
) {
    let mut eng = engine.write().unwrap();
    if whitelisted {
        eng.whitelist_domain(&domain);
    } else {
        eng.remove_whitelist_domain(&domain);
    }
}

#[tauri::command]
pub fn is_site_whitelisted(
    domain: String,
    engine: tauri::State<'_, Arc<RwLock<AdBlockEngine>>>,
) -> bool {
    engine.read().unwrap().is_domain_whitelisted(&domain)
}

#[tauri::command]
pub fn get_filter_lists(
    engine: tauri::State<'_, Arc<RwLock<AdBlockEngine>>>,
) -> Vec<FilterListMetadata> {
    engine.read().unwrap().filter_lists.clone()
}

#[tauri::command]
pub fn toggle_filter_list(
    list_id: String,
    enabled: bool,
    engine: tauri::State<'_, Arc<RwLock<AdBlockEngine>>>,
) {
    let mut eng = engine.write().unwrap();
    eng.set_list_enabled(&list_id, enabled);
}

#[tauri::command]
pub async fn update_filter_lists(
    engine: tauri::State<'_, Arc<RwLock<AdBlockEngine>>>,
) -> Result<Vec<FilterListMetadata>, String> {
    let lists_to_update: Vec<(String, String)> = {
        let eng = engine.read().unwrap();
        eng.filter_lists
            .iter()
            .filter(|l| l.enabled && l.source_url.is_some())
            .map(|l| (l.id.clone(), l.source_url.clone().unwrap()))
            .collect()
    };

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(12))
        .build()
        .map_err(|e| e.to_string())?;

    for (id, url) in lists_to_update {
        if let Ok(resp) = client.get(&url).send().await {
            if resp.status().is_success() {
                if let Ok(text) = resp.text().await {
                    let mut eng = engine.write().unwrap();
                    let _ = eng.list_manager.save_list_content(&id, &text);
                    if let Some(list) = eng.filter_lists.iter_mut().find(|l| l.id == id) {
                        list.last_updated = Some(chrono::Utc::now().to_rfc3339());
                    }
                }
            }
        }
    }

    {
        let mut eng = engine.write().unwrap();
        eng.reload_all_rules();
        Ok(eng.filter_lists.clone())
    }
}

#[tauri::command]
pub fn get_blocked_logs(
    engine: tauri::State<'_, Arc<RwLock<AdBlockEngine>>>,
) -> Vec<BlockedLogEntry> {
    engine.read().unwrap().stats.get_recent_logs()
}

// --- BOOKMARKS COMMANDS ---

#[tauri::command]
pub fn get_bookmarks(browser: tauri::State<'_, Arc<BrowserState>>) -> Vec<Bookmark> {
    browser.bookmarks.get_all()
}

#[tauri::command]
pub fn add_bookmark(
    title: String,
    url: String,
    folder: Option<String>,
    favicon: Option<String>,
    browser: tauri::State<'_, Arc<BrowserState>>,
) -> Bookmark {
    browser
        .bookmarks
        .add(&title, &url, folder.as_deref(), favicon.as_deref())
}

#[tauri::command]
pub fn remove_bookmark(id: String, browser: tauri::State<'_, Arc<BrowserState>>) -> bool {
    browser.bookmarks.remove(&id)
}

#[tauri::command]
pub fn is_bookmarked(url: String, browser: tauri::State<'_, Arc<BrowserState>>) -> bool {
    browser.bookmarks.is_bookmarked(&url)
}

// --- HISTORY COMMANDS ---

#[tauri::command]
pub fn get_history(browser: tauri::State<'_, Arc<BrowserState>>) -> Vec<HistoryItem> {
    browser.history.get_all()
}

#[tauri::command]
pub fn search_history(
    query: String,
    browser: tauri::State<'_, Arc<BrowserState>>,
) -> Vec<HistoryItem> {
    browser.history.search(&query)
}

#[tauri::command]
pub fn delete_history_item(id: String, browser: tauri::State<'_, Arc<BrowserState>>) -> bool {
    browser.history.delete_entry(&id)
}

#[tauri::command]
pub fn clear_history(hours: Option<i64>, browser: tauri::State<'_, Arc<BrowserState>>) {
    if let Some(h) = hours {
        browser.history.clear_range(h);
    } else {
        browser.history.clear_all();
    }
}

// --- DOWNLOADS COMMANDS ---

#[tauri::command]
pub fn get_downloads(browser: tauri::State<'_, Arc<BrowserState>>) -> Vec<DownloadItem> {
    browser.downloads.get_all()
}

#[tauri::command]
pub fn clear_completed_downloads(browser: tauri::State<'_, Arc<BrowserState>>) {
    browser.downloads.clear_completed();
}

// --- SETTINGS COMMANDS ---

#[tauri::command]
pub fn get_user_settings(settings: tauri::State<'_, Arc<SettingsManager>>) -> UserSettings {
    settings.get()
}

#[tauri::command]
pub fn save_user_settings(
    new_settings: UserSettings,
    settings: tauri::State<'_, Arc<SettingsManager>>,
    engine: tauri::State<'_, Arc<RwLock<AdBlockEngine>>>,
) -> Result<(), String> {
    {
        let mut eng = engine.write().unwrap();
        eng.global_enabled = new_settings.shield_enabled;
        eng.cosmetic_filtering_enabled = new_settings.cosmetic_filtering_enabled;
        eng.clear_cache();
    }
    settings.update(new_settings).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn clear_browsing_data(
    clear_history_data: bool,
    _clear_cache: bool,
    _clear_cookies: bool,
    browser: tauri::State<'_, Arc<BrowserState>>,
    engine: tauri::State<'_, Arc<RwLock<AdBlockEngine>>>,
) {
    if clear_history_data {
        browser.history.clear_all();
    }
    engine.read().unwrap().clear_cache();
}

// --- WALLPAPERS COMMANDS ---

#[tauri::command]
pub fn get_wallpapers() -> Vec<ScenicWallpaper> {
    get_curated_wallpapers()
}

#[tauri::command]
pub fn get_daily_wallpaper() -> ScenicWallpaper {
    get_daily_scenic_wallpaper()
}
