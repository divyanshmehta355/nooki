import React, { useState } from 'react';
import {
  X,
  Palette,
  Shield,
  Lock,
  Globe,
  Info,
  RefreshCw,
  Trash2,
  Check,
} from 'lucide-react';
import { FilterListMetadata, ScenicWallpaper, UserSettings } from '../types/browser';
import * as api from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  filterLists: FilterListMetadata[];
  onRefreshFilterLists: () => void;
  wallpapers: ScenicWallpaper[];
  initialSection?: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  filterLists,
  onRefreshFilterLists,
  wallpapers,
  initialSection = 'appearance',
}) => {
  const [activeTab, setActiveTab] = useState(initialSection);
  const [isUpdatingLists, setIsUpdatingLists] = useState(false);
  const [clearHistoryData, setClearHistoryData] = useState(true);
  const [clearCacheData, setClearCacheData] = useState(true);
  const [clearCookiesData, setClearCookiesData] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);

  if (!isOpen) return null;

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    onUpdateSettings({ ...settings, theme });
  };

  const handleAccentChange = (accent_color: UserSettings['accent_color']) => {
    onUpdateSettings({ ...settings, accent_color });
  };

  const handleWallpaperModeChange = (wallpaper_mode: UserSettings['wallpaper_mode']) => {
    onUpdateSettings({ ...settings, wallpaper_mode });
  };

  const handleWallpaperSelect = (selected_wallpaper_id: string) => {
    onUpdateSettings({ ...settings, selected_wallpaper_id, wallpaper_mode: 'custom' });
  };

  const handleSearchEngineChange = (search_engine: UserSettings['search_engine']) => {
    onUpdateSettings({ ...settings, search_engine });
  };

  const handleStartupBehaviorChange = (startup_behavior: UserSettings['startup_behavior']) => {
    onUpdateSettings({ ...settings, startup_behavior });
  };

  const handleUpdateLists = async () => {
    setIsUpdatingLists(true);
    try {
      await api.updateFilterLists();
      onRefreshFilterLists();
    } finally {
      setIsUpdatingLists(false);
    }
  };

  const handleClearData = async () => {
    await api.clearBrowsingData(clearHistoryData, clearCacheData, clearCookiesData);
    setClearSuccess(true);
    setTimeout(() => setClearSuccess(false), 2500);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        userSelect: 'none',
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          width: '780px',
          height: '560px',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-popover)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* Left Sidebar */}
        <div
          style={{
            width: '210px',
            background: 'var(--bg-primary)',
            borderRight: '1px solid var(--border-subtle)',
            padding: '16px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div
            style={{
              fontSize: '16px',
              fontWeight: 700,
              padding: '6px 12px 14px',
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            Preferences
          </div>

          <button
            onClick={() => setActiveTab('appearance')}
            style={navItemStyle(activeTab === 'appearance')}
          >
            <Palette size={16} />
            <span>Appearance</span>
          </button>

          <button
            onClick={() => setActiveTab('ad-blocking')}
            style={navItemStyle(activeTab === 'ad-blocking')}
          >
            <Shield size={16} />
            <span>Ad Blocking</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            style={navItemStyle(activeTab === 'privacy')}
          >
            <Lock size={16} />
            <span>Privacy & Security</span>
          </button>

          <button
            onClick={() => setActiveTab('browser')}
            style={navItemStyle(activeTab === 'browser')}
          >
            <Globe size={16} />
            <span>Browser</span>
          </button>

          <button
            onClick={() => setActiveTab('about')}
            style={{ ...navItemStyle(activeTab === 'about'), marginTop: 'auto' }}
          >
            <Info size={16} />
            <span>About Nooki</span>
          </button>
        </div>

        {/* Right Content Area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-surface)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {activeTab === 'appearance' && 'Appearance & Themes'}
              {activeTab === 'ad-blocking' && 'Nooki Shield & Ad Filtering'}
              {activeTab === 'privacy' && 'Privacy & Permissions'}
              {activeTab === 'browser' && 'Browser Settings'}
              {activeTab === 'about' && 'About Nooki Browser'}
            </h2>
            <button
              onClick={onClose}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: 'var(--radius-control)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-muted)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <X size={16} />
            </button>
          </div>

          {/* Section Body */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            {/* --- APPEARANCE TAB --- */}
            {activeTab === 'appearance' && (
              <>
                {/* Theme Mode */}
                <div>
                  <label style={sectionTitleStyle}>Theme Mode</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '8px' }}>
                    {(['light', 'dark', 'system'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => handleThemeChange(t)}
                        style={cardSelectStyle(settings.theme === t)}
                      >
                        <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                          {t === 'light' ? 'Warm Light' : t === 'dark' ? 'Cozy Dark' : 'Windows System'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {t === 'light'
                            ? 'Warm Ivory & Sage Mist'
                            : t === 'dark'
                            ? 'Warm Forest Nocturne'
                            : 'Match OS preference'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accent Colors */}
                <div>
                  <label style={sectionTitleStyle}>Accent Color</label>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                    {[
                      { id: 'nova-green', label: 'Nooki Green', color: '#28765F' },
                      { id: 'sage-mist', label: 'Sage Mist', color: '#588B77' },
                      { id: 'warm-amber', label: 'Warm Amber', color: '#B87937' },
                      { id: 'soft-rose', label: 'Soft Rose', color: '#A8606B' },
                      { id: 'sky-mist', label: 'Sky Mist', color: '#4A7A8C' },
                    ].map((acc) => (
                      <button
                        key={acc.id}
                        onClick={() => handleAccentChange(acc.id as any)}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: acc.color,
                          boxShadow: settings.accent_color === acc.id ? `0 0 0 3px var(--bg-surface), 0 0 0 5px ${acc.color}` : 'none',
                          transition: 'transform var(--transition-fast)',
                        }}
                        title={acc.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Wallpaper Mode */}
                <div>
                  <label style={sectionTitleStyle}>Scenic Wallpapers</label>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    {[
                      { id: 'daily', label: 'Daily Scenic Rotation' },
                      { id: 'custom', label: 'Selected Scenic Landscape' },
                      { id: 'plain', label: 'Plain Solid Background' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleWallpaperModeChange(m.id as any)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 'var(--radius-pill)',
                          fontSize: '12px',
                          fontWeight: 500,
                          background: settings.wallpaper_mode === m.id ? 'var(--accent-primary)' : 'var(--bg-primary)',
                          color: settings.wallpaper_mode === m.id ? 'var(--text-inverse)' : 'var(--text-secondary)',
                        }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {/* Wallpaper Gallery Selection */}
                  {settings.wallpaper_mode !== 'plain' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '12px' }}>
                      {wallpapers.map((wp) => (
                        <div
                          key={wp.id}
                          onClick={() => handleWallpaperSelect(wp.id)}
                          style={{
                            height: '76px',
                            borderRadius: 'var(--radius-control)',
                            backgroundImage: `url(${wp.image_path})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            position: 'relative',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            border: settings.selected_wallpaper_id === wp.id ? '2.5px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                          }}
                        >
                          <div
                            style={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              padding: '4px 6px',
                              background: 'rgba(0, 0, 0, 0.55)',
                              color: '#FFFFFF',
                              fontSize: '11px',
                              fontWeight: 500,
                            }}
                          >
                            {wp.title}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* --- AD BLOCKING TAB --- */}
            {activeTab === 'ad-blocking' && (
              <>
                {/* Global Protection Toggle */}
                <div style={settingRowStyle}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Nooki Shield</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      Block intrusive ads, banners, video pop-ups, and trackers.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.shield_enabled}
                    onChange={(e) => onUpdateSettings({ ...settings, shield_enabled: e.target.checked })}
                    style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                  />
                </div>

                {/* Cosmetic Filtering Toggle */}
                <div style={settingRowStyle}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Cosmetic Element Hiding</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      Hide empty ad placeholders, cookie overlays, and sponsored containers in the page DOM.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.cosmetic_filtering_enabled}
                    onChange={(e) => onUpdateSettings({ ...settings, cosmetic_filtering_enabled: e.target.checked })}
                    style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                  />
                </div>

                {/* Tracking Query Parameter Stripping */}
                <div style={settingRowStyle}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>URL Tracking Parameter Stripper</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      Automatically strip invasive query parameters (utm_*, fbclid, gclid) from visited links.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.strip_tracking_params}
                    onChange={(e) => onUpdateSettings({ ...settings, strip_tracking_params: e.target.checked })}
                    style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                  />
                </div>

                {/* Filter Lists Management */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={sectionTitleStyle}>Filter Lists</label>
                    <button
                      onClick={handleUpdateLists}
                      disabled={isUpdatingLists}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        color: 'var(--accent-primary)',
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <RefreshCw size={13} className={isUpdatingLists ? 'animate-spin' : ''} />
                      {isUpdatingLists ? 'Updating Lists...' : 'Update Lists Now'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {filterLists.map((list) => (
                      <div
                        key={list.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-control)',
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                            {list.name}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {list.description}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {list.rule_count.toLocaleString()} rules active · Built-in & verified
                          </div>
                        </div>

                        <input
                          type="checkbox"
                          checked={list.enabled}
                          onChange={async (e) => {
                            await api.toggleFilterList(list.id, e.target.checked);
                            onRefreshFilterLists();
                          }}
                          style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* --- PRIVACY & SECURITY TAB --- */}
            {activeTab === 'privacy' && (
              <>
                {/* Clear on exit */}
                <div style={settingRowStyle}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Clear site data on exit</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      Automatically clear cached files and session state when Nooki closes.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.clear_on_exit}
                    onChange={(e) => onUpdateSettings({ ...settings, clear_on_exit: e.target.checked })}
                    style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                  />
                </div>

                {/* Clear Browsing Data Box */}
                <div
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-card)',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    Clear Browsing Data
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <input
                        type="checkbox"
                        checked={clearHistoryData}
                        onChange={(e) => setClearHistoryData(e.target.checked)}
                      />
                      Browsing history
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <input
                        type="checkbox"
                        checked={clearCacheData}
                        onChange={(e) => setClearCacheData(e.target.checked)}
                      />
                      Cached web pages and images
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <input
                        type="checkbox"
                        checked={clearCookiesData}
                        onChange={(e) => setClearCookiesData(e.target.checked)}
                      />
                      Cookies and site storage
                    </label>
                  </div>

                  <button
                    onClick={handleClearData}
                    style={{
                      alignSelf: 'flex-start',
                      marginTop: '6px',
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-control)',
                      background: clearSuccess ? 'var(--accent-primary)' : 'var(--nooki-error-red)',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {clearSuccess ? (
                      <>
                        <Check size={14} /> Cleared Successfully
                      </>
                    ) : (
                      <>
                        <Trash2 size={14} /> Clear Selected Data
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* --- BROWSER SETTINGS TAB --- */}
            {activeTab === 'browser' && (
              <>
                {/* Default Search Engine */}
                <div>
                  <label style={sectionTitleStyle}>Default Search Engine</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '8px' }}>
                    {[
                      { id: 'duckduckgo', name: 'DuckDuckGo', desc: 'Privacy-focused cozy search (Recommended)' },
                      { id: 'brave', name: 'Brave Search', desc: 'Independent non-tracking index' },
                      { id: 'ecosia', name: 'Ecosia', desc: 'Planting trees while browsing' },
                      { id: 'google', name: 'Google', desc: 'Standard web index' },
                    ].map((eng) => (
                      <button
                        key={eng.id}
                        onClick={() => handleSearchEngineChange(eng.id as any)}
                        style={cardSelectStyle(settings.search_engine === eng.id)}
                      >
                        <div style={{ fontWeight: 600 }}>{eng.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{eng.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Startup Behavior */}
                <div>
                  <label style={sectionTitleStyle}>On Startup</label>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    {[
                      { id: 'newtab', label: 'Open New Tab page' },
                      { id: 'restore', label: 'Restore previous session tabs' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleStartupBehaviorChange(s.id as any)}
                        style={cardSelectStyle(settings.startup_behavior === s.id)}
                      >
                        <div style={{ fontWeight: 600 }}>{s.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* --- ABOUT TAB --- */}
            {activeTab === 'about' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '16px',
                      background: 'var(--accent-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Palette size={28} style={{ color: 'var(--accent-primary)' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Nooki Browser
                    </h3>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      Version 0.1.0 · A little nook for the internet.
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                  Nooki is a privacy-first Windows desktop browser engineered with Tauri 2,
                  Rust, React, and Microsoft WebView2. Designed to block intrusive web advertisements
                  and telemetry while offering a calm, cottagecore-inspired browsing sanctuary.
                </p>

                <div
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-control)',
                    background: 'var(--bg-highlight)',
                    fontSize: '12px',
                    color: 'var(--nooki-green)',
                    lineHeight: 1.5,
                  }}
                >
                  🌿 <strong>Nooki Privacy Guarantee:</strong> Zero telemetry. Zero history tracking.
                  All filter rules and wallpaper caches stay strictly local to your machine.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const navItemStyle = (isActive: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '8px 12px',
  borderRadius: 'var(--radius-control)',
  fontSize: '13px',
  fontWeight: isActive ? 600 : 400,
  background: isActive ? 'var(--bg-surface)' : 'transparent',
  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
  boxShadow: isActive ? 'var(--shadow-subtle)' : 'none',
  transition: 'all var(--transition-fast)',
  width: '100%',
  justifyContent: 'flex-start',
});

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--text-primary)',
};

const settingRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 14px',
  borderRadius: 'var(--radius-control)',
  background: 'var(--bg-primary)',
  border: '1px solid var(--border-subtle)',
};

const cardSelectStyle = (isSelected: boolean): React.CSSProperties => ({
  padding: '12px',
  borderRadius: 'var(--radius-control)',
  border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
  background: isSelected ? 'var(--bg-highlight)' : 'var(--bg-primary)',
  color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
  textAlign: 'left',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  cursor: 'pointer',
  transition: 'all var(--transition-fast)',
});
