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

// Stateful in-memory stores for testing and browser preview fallback
let inMemoryTabs: BrowserTab[] = [
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
let inMemoryActiveTabId = 'tab-1';
const inMemoryClosedTabs: BrowserTab[] = [];

let inMemoryBookmarks: Bookmark[] = [
  { id: '1', title: 'DuckDuckGo', url: 'https://duckduckgo.com', created_at: new Date().toISOString() },
  { id: '2', title: 'Wikipedia', url: 'https://en.wikipedia.org', created_at: new Date().toISOString() },
  { id: '3', title: 'Hacker News', url: 'https://news.ycombinator.com', created_at: new Date().toISOString() },
  { id: '4', title: 'GitHub', url: 'https://github.com', created_at: new Date().toISOString() },
];

let inMemoryHistory: HistoryItem[] = [
  { id: '1', url: 'https://duckduckgo.com', title: 'DuckDuckGo', visited_at: new Date().toISOString(), visit_count: 5 },
  { id: '2', url: 'https://news.ycombinator.com', title: 'Hacker News', visited_at: new Date().toISOString(), visit_count: 12 },
];

let inMemorySettings: UserSettings = {
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

const inMemoryWallpapers: ScenicWallpaper[] = [
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

let inMemoryFilterLists: FilterListMetadata[] = [
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

export interface DiagnosticLog {
  id: string;
  time: string;
  level: 'info' | 'warn' | 'error';
  source: string;
  message: string;
}

const recentLogs: DiagnosticLog[] = [];
type LogListener = (logs: DiagnosticLog[]) => void;
const logListeners = new Set<LogListener>();

export function getDiagnosticLogs(): DiagnosticLog[] {
  return [...recentLogs];
}

export function subscribeDiagnosticLogs(listener: LogListener): () => void {
  logListeners.add(listener);
  listener([...recentLogs]);
  return () => {
    logListeners.delete(listener);
  };
}

export function recordLog(level: 'info' | 'warn' | 'error', source: string, message: string) {
  const item: DiagnosticLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    time: new Date().toLocaleTimeString(),
    level,
    source,
    message,
  };
  recentLogs.push(item);
  if (recentLogs.length > 100) recentLogs.shift();
  logListeners.forEach((fn) => fn([...recentLogs]));

  // Log to browser devtools
  if (level === 'error') {
    console.error(`[${source}] ${message}`);
  } else if (level === 'warn') {
    console.warn(`[${source}] ${message}`);
  } else {
    console.log(`[${source}] ${message}`);
  }

  // Forward to Rust terminal if running in Tauri
  if (typeof window !== 'undefined' && Boolean((window as any).__TAURI_INTERNALS__)) {
    invoke('log_frontend_event', { level, message: `[${source}] ${message}` }).catch(() => {});
  }
}

async function tryInvoke<T>(
  cmd: string,
  args: Record<string, unknown> = {},
  fallback: () => T | Promise<T>
): Promise<T> {
  const isTauri = typeof window !== 'undefined' && Boolean((window as any).__TAURI_INTERNALS__);
  if (isTauri) {
    try {
      const argsStr = Object.keys(args).length ? ` with ${JSON.stringify(args)}` : '';
      recordLog('info', 'IPC', `Invoking "${cmd}"${argsStr}`);
      const result = await invoke<T>(cmd, args);
      recordLog('info', 'IPC', `"${cmd}" completed successfully`);
      return result;
    } catch (err: any) {
      const errMsg = typeof err === 'string' ? err : err?.message || JSON.stringify(err);
      recordLog('error', 'IPC', `Command "${cmd}" FAILED: ${errMsg}`);
    }
  } else {
    recordLog('info', 'Web', `Browser preview: simulated "${cmd}" via memory store`);
  }
  return fallback();
}

// --- TABS & NAVIGATION ---

export async function getTabs(): Promise<BrowserTab[]> {
  return tryInvoke('get_tabs', {}, () => [...inMemoryTabs]);
}

export async function getActiveTabId(): Promise<string> {
  return tryInvoke('get_active_tab_id', {}, () => inMemoryActiveTabId);
}

export async function createTab(url?: string): Promise<BrowserTab> {
  return tryInvoke('create_tab', { url }, () => {
    const tabUrl = url || 'nooki://newtab';
    const newTab: BrowserTab = {
      id: `tab-${Date.now()}`,
      title: tabUrl === 'nooki://newtab' ? 'New Tab' : tabUrl,
      url: tabUrl,
      can_go_back: false,
      can_go_forward: false,
      is_loading: false,
      shield_active: true,
      blocked_ads_count: 0,
      blocked_trackers_count: 0,
      elements_hidden_count: 0,
    };
    inMemoryTabs.push(newTab);
    inMemoryActiveTabId = newTab.id;
    return newTab;
  });
}

export async function switchTab(tabId: string): Promise<string> {
  return tryInvoke('switch_tab', { tabId }, () => {
    inMemoryActiveTabId = tabId;
    return tabId;
  });
}

export async function closeTab(tabId: string): Promise<string | null> {
  return tryInvoke('close_tab', { tabId }, () => {
    if (inMemoryTabs.length <= 1) {
      inMemoryTabs[0].url = 'nooki://newtab';
      inMemoryTabs[0].title = 'New Tab';
      return inMemoryTabs[0].id;
    }
    const idx = inMemoryTabs.findIndex((t) => t.id === tabId);
    if (idx !== -1) {
      const removed = inMemoryTabs.splice(idx, 1)[0];
      inMemoryClosedTabs.push(removed);
      const nextIdx = Math.min(idx, inMemoryTabs.length - 1);
      inMemoryActiveTabId = inMemoryTabs[nextIdx].id;
      return inMemoryActiveTabId;
    }
    return inMemoryActiveTabId;
  });
}

export async function reopenClosedTab(): Promise<BrowserTab | null> {
  return tryInvoke('reopen_closed_tab', {}, () => {
    const last = inMemoryClosedTabs.pop();
    if (last) {
      inMemoryTabs.push(last);
      inMemoryActiveTabId = last.id;
      return last;
    }
    return null;
  });
}

export async function navigateTab(tabId: string, inputUrl: string): Promise<BrowserTab> {
  return tryInvoke('navigate_tab', { tabId, inputUrl }, () => {
    let resolved = inputUrl.trim();
    if (!resolved.startsWith('http://') && !resolved.startsWith('https://') && !resolved.startsWith('nooki://')) {
      if (resolved.includes('.') && !resolved.includes(' ')) {
        resolved = `https://${resolved}`;
      } else {
        resolved = `https://duckduckgo.com/?q=${encodeURIComponent(resolved)}`;
      }
    }

    const tab = inMemoryTabs.find((t) => t.id === tabId);
    if (tab) {
      tab.url = resolved;
      tab.title = resolved.replace('https://', '').replace('http://', '');
      tab.can_go_back = true;
      tab.blocked_ads_count = 3;
      tab.blocked_trackers_count = 2;
      tab.elements_hidden_count = 4;
      return { ...tab };
    }
    throw new Error('Tab not found');
  });
}

export async function reloadTab(tabId: string): Promise<void> {
  return tryInvoke('reload_tab', { tabId }, () => {});
}

export async function goBack(tabId: string): Promise<void> {
  return tryInvoke('go_back', { tabId }, () => {});
}

export async function goForward(tabId: string): Promise<void> {
  return tryInvoke('go_forward', { tabId }, () => {});
}

export async function updateTabBounds(
  width: number,
  height: number,
  toolbarHeight: number
): Promise<void> {
  return tryInvoke('update_tab_bounds', { width, height, toolbarHeight }, () => {});
}

// --- SHIELD & FILTERING ---

export async function getTabShieldStats(tabId: string): Promise<TabShieldStats> {
  return tryInvoke('get_tab_shield_stats', { tabId }, () => ({
    blocked_ads: 3,
    blocked_trackers: 2,
    elements_hidden: 5,
    total: 10,
  }));
}

export async function getSessionShieldStats(): Promise<SessionShieldStats> {
  return tryInvoke('get_session_shield_stats', {}, () => ({
    total_blocked_requests: 42,
    total_blocked_trackers: 19,
    total_elements_hidden: 35,
    total: 96,
  }));
}

export async function toggleGlobalShield(enabled: boolean): Promise<void> {
  return tryInvoke('toggle_global_shield', { enabled }, () => {});
}

export async function toggleSiteShield(domain: string, whitelisted: boolean): Promise<void> {
  return tryInvoke('toggle_site_shield', { domain, whitelisted }, () => {});
}

export async function isSiteWhitelisted(domain: string): Promise<boolean> {
  return tryInvoke('is_site_whitelisted', { domain }, () => false);
}

export async function getFilterLists(): Promise<FilterListMetadata[]> {
  return tryInvoke('get_filter_lists', {}, () => [...inMemoryFilterLists]);
}

export async function toggleFilterList(listId: string, enabled: boolean): Promise<void> {
  return tryInvoke('toggle_filter_list', { listId, enabled }, () => {
    const l = inMemoryFilterLists.find((f) => f.id === listId);
    if (l) l.enabled = enabled;
  });
}

export async function updateFilterLists(): Promise<FilterListMetadata[]> {
  return tryInvoke('update_filter_lists', {}, () => {
    inMemoryFilterLists = inMemoryFilterLists.map((l) => ({
      ...l,
      last_updated: new Date().toISOString(),
    }));
    return inMemoryFilterLists;
  });
}

export async function getBlockedLogs(): Promise<BlockedLogEntry[]> {
  return tryInvoke('get_blocked_logs', {}, () => []);
}

// --- BOOKMARKS ---

export async function getBookmarks(): Promise<Bookmark[]> {
  return tryInvoke('get_bookmarks', {}, () => [...inMemoryBookmarks]);
}

export async function addBookmark(
  title: string,
  url: string,
  folder?: string,
  favicon?: string
): Promise<Bookmark> {
  return tryInvoke('add_bookmark', { title, url, folder, favicon }, () => {
    const bm: Bookmark = {
      id: `bm-${Date.now()}`,
      title,
      url,
      folder,
      favicon,
      created_at: new Date().toISOString(),
    };
    inMemoryBookmarks = inMemoryBookmarks.filter((b) => b.url !== url);
    inMemoryBookmarks.push(bm);
    return bm;
  });
}

export async function removeBookmark(id: string): Promise<boolean> {
  return tryInvoke('remove_bookmark', { id }, () => {
    const initial = inMemoryBookmarks.length;
    inMemoryBookmarks = inMemoryBookmarks.filter((b) => b.id !== id);
    return inMemoryBookmarks.length < initial;
  });
}

export async function isBookmarked(url: string): Promise<boolean> {
  return tryInvoke('is_bookmarked', { url }, () => {
    return inMemoryBookmarks.some((b) => b.url === url);
  });
}

// --- HISTORY ---

export async function getHistory(): Promise<HistoryItem[]> {
  return tryInvoke('get_history', {}, () => [...inMemoryHistory]);
}

export async function searchHistory(query: string): Promise<HistoryItem[]> {
  return tryInvoke('search_history', { query }, () => {
    const q = query.toLowerCase();
    return inMemoryHistory.filter(
      (h) => h.title.toLowerCase().includes(q) || h.url.toLowerCase().includes(q)
    );
  });
}

export async function deleteHistoryItem(id: string): Promise<boolean> {
  return tryInvoke('delete_history_item', { id }, () => {
    inMemoryHistory = inMemoryHistory.filter((h) => h.id !== id);
    return true;
  });
}

export async function clearHistory(hours?: number): Promise<void> {
  return tryInvoke('clear_history', { hours }, () => {
    inMemoryHistory = [];
  });
}

// --- DOWNLOADS ---

export async function getDownloads(): Promise<DownloadItem[]> {
  return tryInvoke('get_downloads', {}, () => []);
}

export async function clearCompletedDownloads(): Promise<void> {
  return tryInvoke('clear_completed_downloads', {}, () => {});
}

// --- SETTINGS ---

export async function getUserSettings(): Promise<UserSettings> {
  return tryInvoke('get_user_settings', {}, () => ({ ...inMemorySettings }));
}

export async function saveUserSettings(settings: UserSettings): Promise<void> {
  return tryInvoke('save_user_settings', { newSettings: settings }, () => {
    inMemorySettings = { ...settings };
  });
}

export async function clearBrowsingData(
  clearHistoryData: boolean,
  clearCache: boolean,
  clearCookies: boolean
): Promise<void> {
  return tryInvoke(
    'clear_browsing_data',
    { clearHistoryData, clearCache, clearCookies },
    () => {
      if (clearHistoryData) inMemoryHistory = [];
    }
  );
}

// --- WALLPAPERS ---

export async function getWallpapers(): Promise<ScenicWallpaper[]> {
  return tryInvoke('get_wallpapers', {}, () => [...inMemoryWallpapers]);
}

export async function getDailyWallpaper(): Promise<ScenicWallpaper> {
  return tryInvoke('get_daily_wallpaper', {}, () => inMemoryWallpapers[0]);
}
