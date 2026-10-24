import React from 'react';
import { Plus, X, Globe, Loader2 } from 'lucide-react';
import { BrowserTab } from '../types/browser';

interface TabBarProps {
  tabs: BrowserTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: '42px',
        padding: '0 8px',
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-subtle)',
        gap: '4px',
        userSelect: 'none',
      }}
    >
      {/* Tabs Container */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          flex: 1,
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollbarWidth: 'none',
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const isNewTab = tab.url === 'nooki://newtab';

          return (
            <div
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                height: '34px',
                minWidth: '140px',
                maxWidth: '220px',
                flex: 1,
                padding: '0 10px',
                borderRadius: 'var(--radius-control)',
                background: isActive ? 'var(--bg-surface)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: isActive ? 'var(--shadow-subtle)' : 'none',
                border: isActive ? '1px solid var(--border-subtle)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--bg-highlight)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {/* Favicon or Loading Icon */}
              {tab.is_loading ? (
                <Loader2
                  size={14}
                  className="animate-spin"
                  style={{ color: 'var(--accent-primary)', flexShrink: 0 }}
                />
              ) : tab.favicon ? (
                <img
                  src={tab.favicon}
                  alt=""
                  style={{ width: '14px', height: '14px', borderRadius: '3px', flexShrink: 0 }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <Globe size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              )}

              {/* Title */}
              <span
                style={{
                  flex: 1,
                  fontSize: '13px',
                  fontWeight: isActive ? 500 : 400,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {isNewTab ? 'New Tab' : tab.title || tab.url}
              </span>

              {/* Close Button */}
              <button
                title="Close tab (Ctrl+W)"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  transition: 'background var(--transition-fast), color var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-muted)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>

      {/* New Tab Button */}
      <button
        title="New tab (Ctrl+T)"
        onClick={onNewTab}
        style={{
          width: '30px',
          height: '30px',
          borderRadius: 'var(--radius-control)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
          background: 'transparent',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--bg-highlight)';
          e.currentTarget.style.color = 'var(--accent-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}
      >
        <Plus size={16} />
      </button>
    </div>
  );
};
