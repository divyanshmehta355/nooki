import React, { useEffect, useState, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Home,
  Shield,
  Star,
  Clock,
  Download,
  Settings,
  Lock,
  Search,
  X,
  Bookmark as BookmarkIcon,
} from 'lucide-react';
import { BrowserTab } from '../types/browser';
import * as api from '../services/api';

interface ToolbarProps {
  activeTab?: BrowserTab;
  blockedCount: number;
  onNavigate: (url: string) => void;
  onReload: () => void;
  onGoBack: () => void;
  onGoForward: () => void;
  onGoHome: () => void;
  onToggleShield: () => void;
  onToggleBookmarks: () => void;
  onToggleHistory: () => void;
  onToggleDownloads: () => void;
  onToggleSettings: () => void;
  isShieldOpen: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTab,
  blockedCount,
  onNavigate,
  onReload,
  onGoBack,
  onGoForward,
  onGoHome,
  onToggleShield,
  onToggleBookmarks,
  onToggleHistory,
  onToggleDownloads,
  onToggleSettings,
  isShieldOpen,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab) {
      if (activeTab.url === 'nooki://newtab') {
        setInputValue('');
      } else {
        setInputValue(activeTab.url);
      }
      api.isBookmarked(activeTab.url).then(setIsBookmarked);
    }
  }, [activeTab?.url]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onNavigate(inputValue.trim());
      inputRef.current?.blur();
    }
  };

  const handleToggleBookmark = async () => {
    if (!activeTab || activeTab.url === 'nooki://newtab') return;
    if (isBookmarked) {
      const all = await api.getBookmarks();
      const match = all.find((b) => b.url === activeTab.url);
      if (match) {
        await api.removeBookmark(match.id);
        setIsBookmarked(false);
      }
    } else {
      await api.addBookmark(activeTab.title || activeTab.url, activeTab.url);
      setIsBookmarked(true);
    }
  };

  const isSecure = activeTab?.url.startsWith('https://');

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: '46px',
        padding: '0 12px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        gap: '8px',
        userSelect: 'none',
      }}
    >
      {/* Navigation Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        <button
          title="Back (Alt+Left)"
          disabled={!activeTab?.can_go_back}
          onClick={onGoBack}
          style={navBtnStyle}
        >
          <ArrowLeft size={16} />
        </button>
        <button
          title="Forward (Alt+Right)"
          disabled={!activeTab?.can_go_forward}
          onClick={onGoForward}
          style={navBtnStyle}
        >
          <ArrowRight size={16} />
        </button>
        <button
          title="Reload (Ctrl+R / F5)"
          onClick={onReload}
          style={navBtnStyle}
        >
          <RotateCw size={15} className={activeTab?.is_loading ? 'animate-spin' : ''} />
        </button>
        <button
          title="Home (New tab)"
          onClick={onGoHome}
          style={navBtnStyle}
        >
          <Home size={16} />
        </button>
      </div>

      {/* Cozy Pill Address Bar */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          alignItems: 'center',
          flex: 1,
          height: '34px',
          background: isFocused ? 'var(--bg-surface-elevated)' : 'var(--bg-primary)',
          borderRadius: 'var(--radius-pill)',
          padding: '0 12px',
          gap: '8px',
          border: isFocused ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
          boxShadow: isFocused ? '0 0 0 3px var(--accent-subtle)' : 'var(--shadow-subtle)',
          transition: 'all var(--transition-fast)',
        }}
      >
        {/* Security / Search Icon */}
        {inputValue && isSecure ? (
          <Lock size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
        ) : (
          <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        )}

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          placeholder="Search DuckDuckGo or enter cozy URL..."
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            inputRef.current?.select();
          }}
          onBlur={() => setIsFocused(false)}
          style={{
            flex: 1,
            fontSize: '13.5px',
            color: 'var(--text-primary)',
            background: 'transparent',
          }}
        />

        {/* Clear Button */}
        {inputValue && isFocused && (
          <button
            type="button"
            onClick={() => setInputValue('')}
            style={{ color: 'var(--text-muted)', padding: '2px' }}
          >
            <X size={13} />
          </button>
        )}

        {/* Bookmark Star Button */}
        {activeTab && activeTab.url !== 'nooki://newtab' && (
          <button
            type="button"
            title={isBookmarked ? 'Bookmarked' : 'Bookmark current tab (Ctrl+D)'}
            onClick={handleToggleBookmark}
            style={{
              color: isBookmarked ? 'var(--nooki-warm-amber)' : 'var(--text-muted)',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Star size={15} fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
        )}
      </form>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
        {/* Shield Button with Live Blocked Badge */}
        <button
          title="Nooki Shield & Ad Blocking"
          onClick={onToggleShield}
          style={{
            ...actionBtnStyle,
            background: isShieldOpen ? 'var(--accent-subtle)' : 'transparent',
            color: isShieldOpen ? 'var(--accent-primary)' : 'var(--text-secondary)',
            gap: '5px',
            padding: '0 8px',
            width: 'auto',
            minWidth: '32px',
          }}
        >
          <Shield size={16} fill="currentColor" opacity={0.2} />
          {blockedCount > 0 && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--accent-primary)',
              }}
            >
              {blockedCount}
            </span>
          )}
        </button>

        {/* Bookmarks Bar Button */}
        <button
          title="Bookmarks (Ctrl+B)"
          onClick={onToggleBookmarks}
          style={actionBtnStyle}
        >
          <BookmarkIcon size={16} />
        </button>

        {/* History Button */}
        <button
          title="History (Ctrl+H)"
          onClick={onToggleHistory}
          style={actionBtnStyle}
        >
          <Clock size={16} />
        </button>

        {/* Downloads Button */}
        <button
          title="Downloads (Ctrl+J)"
          onClick={onToggleDownloads}
          style={actionBtnStyle}
        >
          <Download size={16} />
        </button>

        {/* Settings Button */}
        <button
          title="Settings (Ctrl+,)"
          onClick={onToggleSettings}
          style={actionBtnStyle}
        >
          <Settings size={16} />
        </button>
      </div>
    </div>
  );
};

const navBtnStyle: React.CSSProperties = {
  width: '30px',
  height: '30px',
  borderRadius: 'var(--radius-control)',
  color: 'var(--text-secondary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all var(--transition-fast)',
};

const actionBtnStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: 'var(--radius-control)',
  color: 'var(--text-secondary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all var(--transition-fast)',
};
