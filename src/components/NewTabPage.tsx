import React, { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  MapPin,
  Image as ImageIcon,
} from 'lucide-react';
import { NookiLogo } from './NookiLogo';
import { ScenicWallpaper, ShortcutItem } from '../types/browser';

interface NewTabPageProps {
  onNavigate: (url: string) => void;
  activeWallpaper: ScenicWallpaper;
  wallpapers: ScenicWallpaper[];
  onChangeWallpaper: (wallpaper: ScenicWallpaper) => void;
  wallpaperMode: 'daily' | 'custom' | 'plain';
  onTogglePlainMode: () => void;
  blockedCount: number;
}

const DEFAULT_SHORTCUTS: ShortcutItem[] = [
  { id: '1', title: 'DuckDuckGo', url: 'https://duckduckgo.com', iconBg: '#DE5833' },
  { id: '2', title: 'Wikipedia', url: 'https://en.wikipedia.org', iconBg: '#333333' },
  { id: '3', title: 'Hacker News', url: 'https://news.ycombinator.com', iconBg: '#FF6600' },
  { id: '4', title: 'GitHub', url: 'https://github.com', iconBg: '#24292E' },
  { id: '5', title: 'YouTube', url: 'https://youtube.com', iconBg: '#FF0000' },
  { id: '6', title: 'Reddit', url: 'https://reddit.com', iconBg: '#FF4500' },
];

export const NewTabPage: React.FC<NewTabPageProps> = ({
  onNavigate,
  activeWallpaper,
  wallpapers,
  onChangeWallpaper,
  wallpaperMode,
  onTogglePlainMode,
  blockedCount,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [shortcuts, setShortcuts] = useState<ShortcutItem[]>(() => {
    try {
      const saved = localStorage.getItem('nooki_shortcuts');
      return saved ? JSON.parse(saved) : DEFAULT_SHORTCUTS;
    } catch {
      return DEFAULT_SHORTCUTS;
    }
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [timeString, setTimeString] = useState('');
  const [dateString, setDateString] = useState('');

  // Update clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
      setDateString(
        now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate(searchQuery.trim());
    }
  };

  const handleAddShortcut = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim() && newUrl.trim()) {
      let formattedUrl = newUrl.trim();
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = `https://${formattedUrl}`;
      }
      const updated = [
        ...shortcuts,
        {
          id: `sc-${Date.now()}`,
          title: newTitle.trim(),
          url: formattedUrl,
          iconBg: 'var(--accent-primary)',
        },
      ];
      setShortcuts(updated);
      localStorage.setItem('nooki_shortcuts', JSON.stringify(updated));
      setShowAddModal(false);
      setNewTitle('');
      setNewUrl('');
    }
  };

  const handleDeleteShortcut = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = shortcuts.filter((s) => s.id !== id);
    setShortcuts(updated);
    localStorage.setItem('nooki_shortcuts', JSON.stringify(updated));
  };

  const handlePrevWallpaper = () => {
    const idx = wallpapers.findIndex((w) => w.id === activeWallpaper.id);
    const prevIdx = (idx - 1 + wallpapers.length) % wallpapers.length;
    onChangeWallpaper(wallpapers[prevIdx]);
  };

  const handleNextWallpaper = () => {
    const idx = wallpapers.findIndex((w) => w.id === activeWallpaper.id);
    const nextIdx = (idx + 1) % wallpapers.length;
    onChangeWallpaper(wallpapers[nextIdx]);
  };

  // Time of day greeting
  const greeting = React.useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const isPlain = wallpaperMode === 'plain';

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: isPlain ? 'var(--bg-primary)' : '#19221D',
        transition: 'background var(--transition-smooth)',
      }}
    >
      {/* Scenic Background Wallpaper */}
      {!isPlain && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url(${activeWallpaper.image_path})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'contrast(1.05) saturate(1.02)',
            transition: 'background-image 400ms ease',
          }}
        />
      )}

      {/* Gentle Atmospheric Overlay for Perfect Text Contrast */}
      {!isPlain && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: `radial-gradient(ellipse at center, rgba(32, 41, 35, 0.45) 0%, rgba(20, 26, 22, 0.72) 100%)`,
            backdropFilter: 'blur(1px)',
          }}
        />
      )}

      {/* Center Content Container */}
      <div
        className="animate-fade-in"
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: '680px',
          width: '90%',
          gap: '24px',
          textAlign: 'center',
          marginTop: '-40px',
        }}
      >
        {/* Cute Mascot Logo & Greeting */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <NookiLogo size={48} />
          <div>
            <h1
              style={{
                fontSize: '32px',
                fontWeight: 600,
                color: isPlain ? 'var(--text-primary)' : '#FFFFFF',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                textShadow: isPlain ? 'none' : '0 2px 10px rgba(0,0,0,0.3)',
              }}
            >
              {greeting}, welcome to your little nook.
            </h1>
            <p
              style={{
                fontSize: '15px',
                color: isPlain ? 'var(--text-secondary)' : '#D7E5DC',
                marginTop: '6px',
                textShadow: isPlain ? 'none' : '0 1px 4px rgba(0,0,0,0.3)',
              }}
            >
              A calmer corner of the internet.
            </p>
          </div>
        </div>

        {/* Large Cozy Rounded Search / Address Input */}
        <form
          onSubmit={handleSearchSubmit}
          style={{
            width: '100%',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '18px',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
              color: 'var(--accent-primary)',
            }}
          >
            <Search size={18} />
          </div>

          <input
            type="text"
            value={searchQuery}
            placeholder="Search DuckDuckGo or enter URL..."
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: '52px',
              borderRadius: 'var(--radius-pill)',
              background: isPlain ? 'var(--bg-surface)' : 'rgba(255, 254, 250, 0.94)',
              backdropFilter: 'blur(12px)',
              border: isPlain ? '1.5px solid var(--border-subtle)' : '1px solid rgba(255, 255, 255, 0.4)',
              boxShadow: 'var(--shadow-card)',
              paddingLeft: '48px',
              paddingRight: '120px',
              fontSize: '16px',
              color: 'var(--nooki-forest-ink)',
              transition: 'all var(--transition-fast)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 4px var(--accent-subtle), var(--shadow-card)';
              e.currentTarget.style.borderColor = 'var(--accent-primary)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow-card)';
              e.currentTarget.style.borderColor = isPlain
                ? 'var(--border-subtle)'
                : 'rgba(255, 255, 255, 0.4)';
            }}
          />

          {/* Engine indicator pill */}
          <div
            style={{
              position: 'absolute',
              right: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--bg-highlight)',
              color: 'var(--nooki-green)',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            <Sparkles size={12} />
            <span>Private</span>
          </div>
        </form>

        {/* Website Shortcuts Grid */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '12px',
            maxWidth: '580px',
            width: '100%',
          }}
        >
          {shortcuts.map((sc) => (
            <div
              key={sc.id}
              onClick={() => onNavigate(sc.url)}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                width: '78px',
                padding: '10px 4px',
                borderRadius: 'var(--radius-card)',
                background: isPlain ? 'var(--bg-surface)' : 'rgba(255, 254, 250, 0.82)',
                backdropFilter: 'blur(8px)',
                border: isPlain ? '1px solid var(--border-subtle)' : '1px solid rgba(255, 255, 255, 0.25)',
                boxShadow: 'var(--shadow-subtle)',
                cursor: 'pointer',
                transition: 'transform var(--transition-fast), background var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.background = isPlain ? 'var(--bg-highlight)' : 'rgba(255, 254, 250, 0.96)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = isPlain ? 'var(--bg-surface)' : 'rgba(255, 254, 250, 0.82)';
              }}
            >
              {/* Shortcut Icon Badge */}
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: sc.iconBg || 'var(--accent-subtle)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: '15px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                }}
              >
                {sc.title.charAt(0).toUpperCase()}
              </div>

              {/* Title */}
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--nooki-forest-ink)',
                  maxWidth: '70px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {sc.title}
              </span>

              {/* Delete Button on Hover */}
              <button
                title="Remove shortcut"
                onClick={(e) => handleDeleteShortcut(sc.id, e)}
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: 'var(--nooki-error-red)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity var(--transition-fast)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
              >
                <Trash2 size={10} />
              </button>
            </div>
          ))}

          {/* Add Shortcut Tile */}
          <button
            onClick={() => setShowAddModal(true)}
            title="Add shortcut"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '78px',
              padding: '10px 4px',
              borderRadius: 'var(--radius-card)',
              background: isPlain ? 'transparent' : 'rgba(255, 254, 250, 0.45)',
              border: '1.5px dashed var(--border-strong)',
              color: isPlain ? 'var(--text-secondary)' : '#E5EEE5',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isPlain ? 'var(--bg-highlight)' : 'rgba(255, 254, 250, 0.7)';
              e.currentTarget.style.color = 'var(--accent-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isPlain ? 'transparent' : 'rgba(255, 254, 250, 0.45)';
              e.currentTarget.style.color = isPlain ? 'var(--text-secondary)' : '#E5EEE5';
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Plus size={20} />
            </div>
            <span style={{ fontSize: '11px', fontWeight: 500 }}>Add</span>
          </button>
        </div>

        {/* Protection Status Indicator Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-pill)',
            background: isPlain ? 'var(--bg-surface)' : 'rgba(36, 59, 51, 0.55)',
            backdropFilter: 'blur(8px)',
            border: isPlain ? '1px solid var(--border-subtle)' : '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: 'var(--shadow-subtle)',
            fontSize: '12px',
            color: isPlain ? 'var(--accent-primary)' : '#91C5A5',
          }}
        >
          <ShieldCheck size={14} />
          <span>
            Nooki Shield active · {blockedCount > 0 ? `${blockedCount} ads blocked on this tab` : 'Tracker & Ad Filtering On'}
          </span>
        </div>
      </div>

      {/* Bottom Scenic Wallpaper Control Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '20px',
          right: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
          userSelect: 'none',
        }}
      >
        {/* Clock & Date Widget */}
        <div
          style={{
            fontSize: '13px',
            color: isPlain ? 'var(--text-muted)' : '#D7E5DC',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textShadow: isPlain ? 'none' : '0 1px 4px rgba(0,0,0,0.4)',
          }}
        >
          <span style={{ fontWeight: 600 }}>{timeString}</span>
          <span>·</span>
          <span>{dateString}</span>
        </div>

        {/* Wallpaper Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 8px',
            borderRadius: 'var(--radius-pill)',
            background: isPlain ? 'var(--bg-surface)' : 'rgba(36, 59, 51, 0.65)',
            backdropFilter: 'blur(10px)',
            border: isPlain ? '1px solid var(--border-subtle)' : '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: 'var(--shadow-subtle)',
          }}
        >
          {!isPlain && (
            <>
              <button
                onClick={handlePrevWallpaper}
                title="Previous scenic wallpaper"
                style={wallpaperBtnStyle}
              >
                <ChevronLeft size={16} />
              </button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  color: isPlain ? 'var(--text-secondary)' : '#E5EEE5',
                  padding: '0 4px',
                }}
              >
                <MapPin size={12} style={{ color: 'var(--accent-primary)' }} />
                <span>{activeWallpaper.location}</span>
              </div>

              <button
                onClick={handleNextWallpaper}
                title="Next scenic wallpaper"
                style={wallpaperBtnStyle}
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}

          <button
            onClick={onTogglePlainMode}
            title={isPlain ? 'Show Scenic Wallpaper' : 'Plain Warm Background'}
            style={{
              ...wallpaperBtnStyle,
              marginLeft: '4px',
              color: isPlain ? 'var(--accent-primary)' : '#E5EEE5',
            }}
          >
            <ImageIcon size={14} />
          </button>
        </div>
      </div>

      {/* Add Shortcut Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <form
            onSubmit={handleAddShortcut}
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-card)',
              padding: '24px',
              width: '360px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: 'var(--shadow-popover)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Add Cozy Shortcut
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                Name
              </label>
              <input
                type="text"
                placeholder="e.g. GitHub"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                style={modalInputStyle}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                URL
              </label>
              <input
                type="text"
                placeholder="https://example.com"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                style={modalInputStyle}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-control)',
                  color: 'var(--text-secondary)',
                  fontSize: '13px',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '8px 18px',
                  borderRadius: 'var(--radius-control)',
                  background: 'var(--accent-primary)',
                  color: 'var(--text-inverse)',
                  fontWeight: 500,
                  fontSize: '13px',
                }}
              >
                Add Shortcut
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const wallpaperBtnStyle: React.CSSProperties = {
  width: '26px',
  height: '26px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#FFFFFF',
  background: 'transparent',
  transition: 'background var(--transition-fast)',
};

const modalInputStyle: React.CSSProperties = {
  height: '38px',
  borderRadius: 'var(--radius-control)',
  border: '1px solid var(--border-strong)',
  background: 'var(--bg-primary)',
  padding: '0 12px',
  fontSize: '13px',
  color: 'var(--text-primary)',
};
