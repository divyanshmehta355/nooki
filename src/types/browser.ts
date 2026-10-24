export interface BrowserTab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  can_go_back: boolean;
  can_go_forward: boolean;
  is_loading: boolean;
  shield_active: boolean;
  blocked_ads_count: number;
  blocked_trackers_count: number;
  elements_hidden_count: number;
}

export interface TabShieldStats {
  blocked_ads: number;
  blocked_trackers: number;
  elements_hidden: number;
  total: number;
}

export interface SessionShieldStats {
  total_blocked_requests: number;
  total_blocked_trackers: number;
  total_elements_hidden: number;
  total: number;
}

export interface FilterListMetadata {
  id: string;
  name: string;
  description: string;
  source_url?: string;
  enabled: boolean;
  rule_count: number;
  last_updated?: string;
  is_builtin: boolean;
}

export interface BlockedLogEntry {
  timestamp: string;
  tab_id: string;
  request_url: string;
  domain: string;
  page_domain: string;
  category: 'ad' | 'tracker' | 'malware' | 'annoyance';
  rule: string;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  folder?: string;
  favicon?: string;
  created_at: string;
}

export interface HistoryItem {
  id: string;
  url: string;
  title: string;
  visited_at: string;
  visit_count: number;
}

export interface DownloadItem {
  id: string;
  filename: string;
  url: string;
  path: string;
  total_bytes?: number;
  downloaded_bytes: number;
  status: 'downloading' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  error_message?: string;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  accent_color: 'nova-green' | 'sage-mist' | 'warm-amber' | 'soft-rose' | 'sky-mist';
  wallpaper_mode: 'daily' | 'custom' | 'plain';
  selected_wallpaper_id: string;
  search_engine: 'duckduckgo' | 'brave' | 'google' | 'ecosia';
  startup_behavior: 'newtab' | 'restore';
  shield_enabled: boolean;
  cosmetic_filtering_enabled: boolean;
  strip_tracking_params: boolean;
  clear_on_exit: boolean;
  reduced_motion: boolean;
  default_download_directory: string;
  restored_tabs: string[];
}

export interface ScenicWallpaper {
  id: string;
  title: string;
  description: string;
  location: string;
  image_path: string;
  photographer: string;
  warm_tint: string;
}

export interface ShortcutItem {
  id: string;
  title: string;
  url: string;
  iconBg?: string;
}
