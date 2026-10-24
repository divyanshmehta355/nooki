import { useEffect, useState, useRef, useCallback } from 'react';
import { TabBar } from './components/TabBar';
import { Toolbar } from './components/Toolbar';
import { BookmarksBar } from './components/BookmarksBar';
import { ShieldPopover } from './components/ShieldPopover';
import { NewTabPage } from './components/NewTabPage';
import { SettingsModal } from './components/SettingsModal';
import { BookmarksModal } from './components/BookmarksModal';
import { HistoryModal } from './components/HistoryModal';
import { DownloadsModal } from './components/DownloadsModal';
import { ErrorPage } from './components/ErrorPage';
import { DiagnosticDrawer } from './components/DiagnosticDrawer';
import {
  Bookmark,
  BrowserTab,
  FilterListMetadata,
  ScenicWallpaper,
  UserSettings,
} from './types/browser';
import * as api from './services/api';

const defaultSettings: UserSettings = {
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

export function App() {
  const [tabs, setTabs] = useState<BrowserTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [wallpapers, setWallpapers] = useState<ScenicWallpaper[]>([]);
  const [activeWallpaper, setActiveWallpaper] = useState<ScenicWallpaper | null>(null);
  const [filterLists, setFilterLists] = useState<FilterListMetadata[]>([]);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);

  // Modals & Popovers
  const [isShieldOpen, setIsShieldOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState('appearance');
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDownloadsOpen, setIsDownloadsOpen] = useState(false);

  const headerRef = useRef<HTMLDivElement>(null);

  // Synchronize native webviews visibility when any modal is open
  const isAnyModalOpen =
    isSettingsOpen ||
    isBookmarksOpen ||
    isHistoryOpen ||
    isDownloadsOpen ||
    isShieldOpen;

  useEffect(() => {
    api.setWebviewsHidden(isAnyModalOpen);
  }, [isAnyModalOpen]);

  // Initialize application data
  useEffect(() => {
    async function init() {
      let loadedSettings = defaultSettings;
      try {
        const fetched = await api.getUserSettings();
        if (fetched) {
          loadedSettings = fetched;
          setSettings(fetched);
        }
      } catch (err) {
        console.warn('Failed to load settings from backend:', err);
      }

      const allWallpapers = await api.getWallpapers();
      setWallpapers(allWallpapers);

      const dailyWp = await api.getDailyWallpaper();
      if (loadedSettings.wallpaper_mode === 'custom' && loadedSettings.selected_wallpaper_id) {
        const found = allWallpapers.find((w) => w.id === loadedSettings.selected_wallpaper_id);
        setActiveWallpaper(found || dailyWp);
      } else {
        setActiveWallpaper(dailyWp);
      }

      const initialTabs = await api.getTabs();
      setTabs(initialTabs);

      const activeId = await api.getActiveTabId();
      setActiveTabId(activeId || initialTabs[0]?.id || '');

      const bms = await api.getBookmarks();
      setBookmarks(bms);

      const lists = await api.getFilterLists();
      setFilterLists(lists);
    }
    init();
  }, []);

  // Sync Theme & Accent
  useEffect(() => {
    if (!settings) return;

    const root = document.documentElement;

    // Theme: light, dark, or system
    if (settings.theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', settings.theme);
    }

    // Accent color
    root.setAttribute('data-accent', settings.accent_color);
  }, [settings?.theme, settings?.accent_color]);

  // Update Child Webviews Bounds on Window Resize
  const syncBounds = useCallback(() => {
    if (!headerRef.current) return;
    const headerHeight = headerRef.current.offsetHeight;
    const width = window.innerWidth;
    const height = window.innerHeight;
    api.updateTabBounds(width, height, headerHeight);
  }, []);

  useEffect(() => {
    syncBounds();
    window.addEventListener('resize', syncBounds);
    return () => window.removeEventListener('resize', syncBounds);
  }, [syncBounds, bookmarks.length]);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Ctrl+T: New Tab
      if (e.ctrlKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        handleNewTab();
      }
      // Ctrl+W: Close Tab
      else if (e.ctrlKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        if (activeTabId) {
          handleCloseTab(activeTabId);
        }
      }
      // Ctrl+Shift+T: Reopen Closed Tab
      else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        const reopened = await api.reopenClosedTab();
        if (reopened) {
          const updated = await api.getTabs();
          setTabs(updated);
          setActiveTabId(reopened.id);
        }
      }
      // Ctrl+Tab: Next Tab
      else if (e.ctrlKey && !e.shiftKey && e.key === 'Tab') {
        e.preventDefault();
        if (tabs.length > 1) {
          const idx = tabs.findIndex((t) => t.id === activeTabId);
          const nextIdx = (idx + 1) % tabs.length;
          handleSelectTab(tabs[nextIdx].id);
        }
      }
      // Ctrl+Shift+Tab: Previous Tab
      else if (e.ctrlKey && e.shiftKey && e.key === 'Tab') {
        e.preventDefault();
        if (tabs.length > 1) {
          const idx = tabs.findIndex((t) => t.id === activeTabId);
          const prevIdx = (idx - 1 + tabs.length) % tabs.length;
          handleSelectTab(tabs[prevIdx].id);
        }
      }
      // Ctrl+H: History
      else if (e.ctrlKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setIsHistoryOpen((prev) => !prev);
      }
      // Ctrl+J: Downloads
      else if (e.ctrlKey && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsDownloadsOpen((prev) => !prev);
      }
      // Ctrl+,: Settings
      else if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        setIsSettingsOpen((prev) => !prev);
      }
      // F5 or Ctrl+R: Reload
      else if (e.key === 'F5' || (e.ctrlKey && e.key.toLowerCase() === 'r')) {
        e.preventDefault();
        handleReload();
      }
      // Alt+Left: Back
      else if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        handleGoBack();
      }
      // Alt+Right: Forward
      else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        handleGoForward();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId, tabs]);

  // Tab Actions
  const handleSelectTab = async (id: string) => {
    setActiveTabId(id);
    await api.switchTab(id);
    const updated = await api.getTabs();
    setTabs(updated);
    syncBounds();
  };

  const handleNewTab = async () => {
    const newTab = await api.createTab();
    const updated = await api.getTabs();
    setTabs(updated);
    setActiveTabId(newTab.id);
    syncBounds();
  };

  const handleCloseTab = async (id: string) => {
    const nextActive = await api.closeTab(id);
    const updated = await api.getTabs();
    setTabs(updated);
    if (nextActive) {
      setActiveTabId(nextActive);
    }
    syncBounds();
  };

  // Navigation Actions
  const handleNavigate = async (url: string) => {
    if (!activeTabId) return;
    try {
      const updatedTab = await api.navigateTab(activeTabId, url);
      setTabs((prev) => prev.map((t) => (t.id === activeTabId ? updatedTab : t)));
      syncBounds();
    } catch (err) {
      console.error('Navigation error:', err);
    }
  };

  const handleReload = async () => {
    if (activeTabId) await api.reloadTab(activeTabId);
  };

  const handleGoBack = async () => {
    if (activeTabId) await api.goBack(activeTabId);
  };

  const handleGoForward = async () => {
    if (activeTabId) await api.goForward(activeTabId);
  };

  const handleGoHome = async () => {
    handleNavigate('nooki://newtab');
  };

  const handleWhitelistAndRetry = async (domain: string) => {
    await api.toggleSiteShield(domain, true);
    handleNavigate(`https://${domain}`);
  };

  const handleSaveSettings = async (newSettings: UserSettings) => {
    setSettings(newSettings);
    await api.saveUserSettings(newSettings);
  };

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const isNewTab = !activeTab || activeTab.url === 'nooki://newtab';
  const isBlockedPage = activeTab?.url.startsWith('nooki://blocked');

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Top Header Region (Tabs, Toolbar, Bookmarks) */}
      <div ref={headerRef} style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {/* Tabs Bar */}
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
          onNewTab={handleNewTab}
        />

        {/* Toolbar */}
        <Toolbar
          activeTab={activeTab}
          blockedCount={activeTab ? activeTab.blocked_ads_count + activeTab.blocked_trackers_count : 0}
          onNavigate={handleNavigate}
          onReload={handleReload}
          onGoBack={handleGoBack}
          onGoForward={handleGoForward}
          onGoHome={handleGoHome}
          onToggleShield={() => setIsShieldOpen(!isShieldOpen)}
          onToggleBookmarks={() => setIsBookmarksOpen(!isBookmarksOpen)}
          onToggleHistory={() => setIsHistoryOpen(!isHistoryOpen)}
          onToggleDownloads={() => setIsDownloadsOpen(!isDownloadsOpen)}
          onToggleSettings={() => {
            setSettingsSection('appearance');
            setIsSettingsOpen((prev) => !prev);
          }}
          isShieldOpen={isShieldOpen}
          isBookmarksOpen={isBookmarksOpen}
          isHistoryOpen={isHistoryOpen}
          isDownloadsOpen={isDownloadsOpen}
          isSettingsOpen={isSettingsOpen}
        />

        {/* Bookmarks Bar */}
        {bookmarks.length > 0 && (
          <BookmarksBar
            bookmarks={bookmarks}
            onNavigate={handleNavigate}
            onOpenBookmarksModal={() => setIsBookmarksOpen(true)}
          />
        )}
      </div>

      {/* Main Content Area */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          background: 'transparent',
        }}
      >
        {/* Shield Popover Dashboard */}
        {activeTab && (
          <ShieldPopover
            tabId={activeTab.id}
            currentUrl={activeTab.url}
            isOpen={isShieldOpen}
            onClose={() => setIsShieldOpen(false)}
            onOpenSettings={(sec) => {
              setSettingsSection(sec || 'ad-blocking');
              setIsSettingsOpen(true);
            }}
          />
        )}

        {/* Internal Views */}
        {isBlockedPage && activeTab ? (
          <ErrorPage
            url={activeTab.url}
            onGoHome={handleGoHome}
            onWhitelistAndRetry={handleWhitelistAndRetry}
          />
        ) : isNewTab && activeWallpaper ? (
          <NewTabPage
            onNavigate={handleNavigate}
            activeWallpaper={activeWallpaper}
            wallpapers={wallpapers}
            onChangeWallpaper={(wp) => {
              setActiveWallpaper(wp);
              if (settings) {
                handleSaveSettings({
                  ...settings,
                  selected_wallpaper_id: wp.id,
                  wallpaper_mode: 'custom',
                });
              }
            }}
            wallpaperMode={settings?.wallpaper_mode || 'daily'}
            onTogglePlainMode={() => {
              if (settings) {
                const nextMode = settings.wallpaper_mode === 'plain' ? 'daily' : 'plain';
                handleSaveSettings({ ...settings, wallpaper_mode: nextMode });
              }
            }}
            blockedCount={activeTab ? activeTab.blocked_ads_count : 0}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--bg-primary)',
            }}
          >
            {typeof window !== 'undefined' && Boolean((window as any).__TAURI_INTERNALS__) ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'var(--text-secondary)',
                  gap: '8px',
                }}
              >
                <p style={{ fontSize: '15px' }}>Viewing: <strong style={{ color: 'var(--text-primary)' }}>{activeTab?.url}</strong></p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Native WebView2 container active.</p>
              </div>
            ) : (
              <iframe
                title={activeTab?.title || 'Web View'}
                src={activeTab?.url}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  background: '#FFFFFF',
                }}
                onLoad={() => {
                  api.recordLog('info', 'Web', `Preview iframe loaded: ${activeTab?.url}`);
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {settings && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onUpdateSettings={handleSaveSettings}
          filterLists={filterLists}
          onRefreshFilterLists={async () => {
            const lists = await api.getFilterLists();
            setFilterLists(lists);
          }}
          wallpapers={wallpapers}
          initialSection={settingsSection}
        />
      )}

      <BookmarksModal
        isOpen={isBookmarksOpen}
        onClose={() => setIsBookmarksOpen(false)}
        onNavigate={handleNavigate}
        onRefreshBookmarks={async () => {
          const bms = await api.getBookmarks();
          setBookmarks(bms);
        }}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onNavigate={handleNavigate}
      />

      <DownloadsModal
        isOpen={isDownloadsOpen}
        onClose={() => setIsDownloadsOpen(false)}
      />

      {/* Live Diagnostic Logs Drawer */}
      <DiagnosticDrawer activeTabId={activeTab?.id} activeUrl={activeTab?.url} />
    </div>
  );
}
export default App;
