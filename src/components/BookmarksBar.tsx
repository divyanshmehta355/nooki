import React from 'react';
import { Globe, Plus } from 'lucide-react';
import { Bookmark } from '../types/browser';

interface BookmarksBarProps {
  bookmarks: Bookmark[];
  onNavigate: (url: string) => void;
  onOpenBookmarksModal: () => void;
}

export const BookmarksBar: React.FC<BookmarksBarProps> = ({
  bookmarks,
  onNavigate,
  onOpenBookmarksModal,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: '30px',
        padding: '0 12px',
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-subtle)',
        gap: '6px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        userSelect: 'none',
      }}
    >
      {bookmarks.map((bm) => (
        <button
          key={bm.id}
          onClick={() => onNavigate(bm.url)}
          title={bm.url}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '2px 8px',
            height: '24px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            background: 'transparent',
            maxWidth: '160px',
            flexShrink: 0,
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-highlight)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          {bm.favicon ? (
            <img
              src={bm.favicon}
              alt=""
              style={{ width: '13px', height: '13px', borderRadius: '2px', flexShrink: 0 }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <Globe size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          )}
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {bm.title}
          </span>
        </button>
      ))}

      <button
        onClick={onOpenBookmarksModal}
        title="Manage Bookmarks"
        style={{
          width: '22px',
          height: '22px',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          flexShrink: 0,
          marginLeft: 'auto',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
      >
        <Plus size={13} />
      </button>
    </div>
  );
};
