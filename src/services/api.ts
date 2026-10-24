import { invoke } from '@tauri-apps/api/core';
import {
  BlockedLogEntry,
  Bookmark,
  BrowserTab,
  DownloadItem,
  FilterListMetadata,
  HistoryItem,
  ScenicWallpaper,
  SessionShieldStats,
  TabShieldStats,
  UserSettings,
} from '../types/browser';

// Check if running inside Tauri
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

// --- TABS & NAVIGATION ---

export async function getTabs(): Promise<BrowserTab[]> {
  if (!isTauri) {
    return [
      {
        id: 'tab-1',
        title: 'New Tab',
        url: 'nooki://newtab',
        can_go_back: false,
        can_go_forward: false,
        is_loading: false,
        shield_active: true,
        blocked_ads_count: 0,
        blocked_trackers_count: 0,
        elements_hidden_count: 0,
      },
    ];
  }
  return invoke('get_tabs');
}

export async function getActiveTabId(): Promise<string> {
  if (!isTauri) return 'tab-1';
  return invoke('get_active_tab_id');
}

export async function createTab(url?: string): Promise<BrowserTab> {
  if (!isTauri) {
    return {
      id: `tab-${Date.now()}`,
      title: 'New Tab',
      url: url || 'nooki://newtab',
      can_go_back: false,
      can_go_forward: false,
      is_loading: false,
      shield_active: true,
      blocked_ads_count: 0,
      blocked_trackers_count: 0,
      elements_hidden_count: 0,
    };
  }
  return invoke('create_tab', { url });
}

export async function switchTab(tabId: string): Promise<string> {
  if (!isTauri) return tabId;
  return invoke('switch_tab', { tabId });
}

export async function closeTab(tabId: string): Promise<string | null> {
  if (!isTauri) return 'tab-1';
  return invoke('close_tab', { tabId });
}

export async function reopenClosedTab(): Promise<BrowserTab | null> {
  if (!isTauri) return null;
  return invoke('reopen_closed_tab');
}

export async function navigateTab(tabId: string, inputUrl: string): Promise<BrowserTab> {
  if (!isTauri) {
    return {
      id: tabId,
      title: inputUrl.replace('https://', ''),
      url: inputUrl,
      can_go_back: true,
      can_go_forward: false,
      is_loading: false,
      shield_active: true,
      blocked_ads_count: 4,
      blocked_trackers_count: 2,
      elements_hidden_count: 3,
    };
  }
  return invoke('navigate_tab', { tabId, inputUrl });
}

export async function reloadTab(tabId: string): Promise<void> {
  if (!isTauri) return;
  return invoke('reload_tab', { tabId });
}

export async function goBack(tabId: string): Promise<void> {
  if (!isTauri) return;
  return invoke('go_back', { tabId });
}

export async function goForward(tabId: string): Promise<void> {
  if (!isTauri) return;
  return invoke('go_forward', { tabId });
}

export async function updateTabBounds(
  width: number,
  height: number,
  toolbarHeight: number
): Promise<void> {
  if (!isTauri) return;
  return invoke('update_tab_bounds', { width, height, toolbarHeight });
}

// --- SHIELD & FILTERING ---

export async function getTabShieldStats(tabId: string): Promise<TabShieldStats> {
  if (!isTauri) {
    return { blocked_ads: 3, blocked_trackers: 2, elements_hidden: 5, total: 10 };
  }
  return invoke('get_tab_shield_stats', { tabId });
}

export async function getSessionShieldStats(): Promise<SessionShieldStats> {
  if (!isTauri) {
    return { total_blocked_requests: 42, total_blocked_trackers: 19, total_elements_hidden: 35, total: 96 };
  }
  return invoke('get_session_shield_stats');
}

export async function toggleGlobalShield(enabled: boolean): Promise<void> {
  if (!isTauri) return;
  return invoke('toggle_global_shield', { enabled });
}

export async function toggleSiteShield(domain: string, whitelisted: boolean): Promise<void> {
  if (!isTauri) return;
  return invoke('toggle_site_shield', { domain, whitelisted });
}

export async function isSiteWhitelisted(domain: string): Promise<boolean> {
  if (!isTauri) return false;
  return invoke('is_site_whitelisted', { domain });
}

export async function getFilterLists(): Promise<FilterListMetadata[]> {
  if (!isTauri) {
    return [
      {
        id: 'nooki-ads',
        name: 'Nooki Core Ad Blocker',
        description: 'Blocks display ads, video pre-rolls, interstitials, and popups.',
        enabled: true,
        rule_count: 42150,
        last_updated: new Date().toISOString(),
        is_builtin: true,
      },
      {
        id: 'nooki-trackers',
        name: 'Nooki Privacy & Anti-Tracker',
        description: 'Stops web telemetry, fingerprinting scripts, and third-party trackers.',
        enabled: true,
        rule_count: 28410,
        last_updated: new Date().toISOString(),
        is_builtin: true,
      },
      {
        id: 'nooki-malware',
        name: 'Nooki Malicious & Phishing Guard',
        description: 'Protects against malicious domains, in-browser miners, and scam sites.',
        enabled: true,
        rule_count: 14890,
        last_updated: new Date().toISOString(),
        is_builtin: true,
      },
      {
        id: 'nooki-annoyances',
        name: 'Nooki Cookie & Annoyance Blocker',
        description: 'Hides intrusive cookie consent popups and GDPR nag overlays.',
        enabled: true,
        rule_count: 8920,
        last_updated: new Date().toISOString(),
        is_builtin: true,
      },
    ];
  }
  return invoke('get_filter_lists');
}

export async function toggleFilterList(listId: string, enabled: boolean): Promise<void> {
  if (!isTauri) return;
  return invoke('toggle_filter_list', { listId, enabled });
}

export async function updateFilterLists(): Promise<FilterListMetadata[]> {
  if (!isTauri) return getFilterLists();
  return invoke('update_filter_lists');
}

export async function getBlockedLogs(): Promise<BlockedLogEntry[]> {
  if (!isTauri) return [];
  return invoke('get_blocked_logs');
}

// --- BOOKMARKS ---

export async function getBookmarks(): Promise<Bookmark[]> {
  if (!isTauri) {
    return [
      { id: '1', title: 'DuckDuckGo', url: 'https://duckduckgo.com', created_at: new Date().toISOString() },
      { id: '2', title: 'Wikipedia', url: 'https://en.wikipedia.org', created_at: new Date().toISOString() },
      { id: '3', title: 'Hacker News', url: 'https://news.ycombinator.com', created_at: new Date().toISOString() },
      { id: '4', title: 'GitHub', url: 'https://github.com', created_at: new Date().toISOString() },
    ];
  }
  return invoke('get_bookmarks');
}

export async function addBookmark(
  title: string,
  url: string,
  folder?: string,
  favicon?: string
): Promise<Bookmark> {
  if (!isTauri) {
    return { id: `bm-${Date.now()}`, title, url, folder, favicon, created_at: new Date().toISOString() };
  }
  return invoke('add_bookmark', { title, url, folder, favicon });
}

export async function removeBookmark(id: string): Promise<boolean> {
  if (!isTauri) return true;
  return invoke('remove_bookmark', { id });
}

export async function isBookmarked(url: string): Promise<boolean> {
  if (!isTauri) return false;
  return invoke('is_bookmarked', { url });
}

// --- HISTORY ---

export async function getHistory(): Promise<HistoryItem[]> {
  if (!isTauri) {
    return [
      { id: '1', url: 'https://duckduckgo.com', title: 'DuckDuckGo', visited_at: new Date().toISOString(), visit_count: 5 },
      { id: '2', url: 'https://news.ycombinator.com', title: 'Hacker News', visited_at: new Date().toISOString(), visit_count: 12 },
    ];
  }
  return invoke('get_history');
}

export async function searchHistory(query: string): Promise<HistoryItem[]> {
  if (!isTauri) return [];
  return invoke('search_history', { query });
}

export async function deleteHistoryItem(id: string): Promise<boolean> {
  if (!isTauri) return true;
  return invoke('delete_history_item', { id });
}

export async function clearHistory(hours?: number): Promise<void> {
  if (!isTauri) return;
  return invoke('clear_history', { hours });
}

// --- DOWNLOADS ---

export async function getDownloads(): Promise<DownloadItem[]> {
  if (!isTauri) return [];
  return invoke('get_downloads');
}

export async function clearCompletedDownloads(): Promise<void> {
  if (!isTauri) return;
  return invoke('clear_completed_downloads');
}

// --- SETTINGS ---

export async function getUserSettings(): Promise<UserSettings> {
  if (!isTauri) {
    return {
      theme: 'system',
      accent_color: 'nova-green',
      wallpaper_mode: 'daily',
      selected_wallpaper_id: 'misty-forest',
      search_engine: 'duckduckgo',
      startup_behavior: 'newtab',
      shield_enabled: true,
      cosmetic_filtering_enabled: true,
      strip_tracking_params: true,
      clear_on_exit: false,
      reduced_motion: false,
      default_download_directory: 'C:\\Downloads',
      restored_tabs: ['nooki://newtab'],
    };
  }
  return invoke('get_user_settings');
}

export async function saveUserSettings(settings: UserSettings): Promise<void> {
  if (!isTauri) return;
  return invoke('save_user_settings', { newSettings: settings });
}

export async function clearBrowsingData(
  clearHistoryData: boolean,
  clearCache: boolean,
  clearCookies: boolean
): Promise<void> {
  if (!isTauri) return;
  return invoke('clear_browsing_data', { clearHistoryData, clearCache, clearCookies });
}

// --- WALLPAPERS ---

export async function getWallpapers(): Promise<ScenicWallpaper[]> {
  if (!isTauri) {
    return [
      {
        id: 'misty-forest',
        title: 'Misty Forest Trail',
        description: 'Soft morning dew and quiet fog resting between mossy pine trunks.',
        location: 'Black Forest, Germany',
        image_path: '/wallpapers/misty-forest.svg',
        photographer: 'Nooki Scenery',
        warm_tint: 'rgba(36, 59, 51, 0.45)',
      },
      {
        id: 'mountain-lake',
        title: 'Quiet Mountain Lake',
        description: 'Still crystal waters mirroring snow-dusted alpine ridges at dawn.',
        location: 'Lake Braies, Dolomites',
        image_path: '/wallpapers/mountain-lake.svg',
        photographer: 'Nooki Scenery',
        warm_tint: 'rgba(40, 70, 75, 0.40)',
      },
      {
        id: 'sunlit-meadow',
        title: 'Sunlit Wildflower Meadow',
        description: 'Golden afternoon sunshine warming clover, daisies, and lavender.',
        location: 'Cotswolds, England',
        image_path: '/wallpapers/sunlit-meadow.svg',
        photographer: 'Nooki Scenery',
        warm_tint: 'rgba(60, 50, 30, 0.35)',
      },
      {
        id: 'rainy-cottage',
        title: 'Rainy Cottage Window',
        description: 'Gentle raindrops tracing patterns on glass overlooking a cozy tea garden.',
        location: 'Lakeside Cottage, Scotland',
        image_path: '/wallpapers/rainy-cottage.svg',
        photographer: 'Nooki Scenery',
        warm_tint: 'rgba(35, 45, 42, 0.45)',
      },
      {
        id: 'soft-sunrise',
        title: 'Soft Sunrise Skies',
        description: 'Gentle apricot and pastel rose glow rising above sleepy valley mist.',
        location: "Val d'Orcia, Tuscany",
        image_path: '/wallpapers/soft-sunrise.svg',
        photographer: 'Nooki Scenery',
        warm_tint: 'rgba(65, 45, 35, 0.35)',
      },
      {
        id: 'autumn-scenery',
        title: 'Gentle Autumn Scenery',
        description: 'Warm amber oak foliage and crisp pine needles carpeted along a winding path.',
        location: 'Kyoto Gardens, Japan',
        image_path: '/wallpapers/autumn-scenery.svg',
        photographer: 'Nooki Scenery',
        warm_tint: 'rgba(55, 40, 25, 0.40)',
      },
    ];
  }
  return invoke('get_wallpapers');
}

export async function getDailyWallpaper(): Promise<ScenicWallpaper> {
  const wallpapers = await getWallpapers();
  return wallpapers[0];
}
