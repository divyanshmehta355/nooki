import React, { useState } from 'react';
import { X, Search, Bookmark as BookmarkIcon, Plus, Trash2, Globe } from 'lucide-react';
import { Bookmark } from '../types/browser';
import * as api from '../services/api';

interface BookmarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (url: string) => void;
  onRefreshBookmarks: () => void;
}

export const BookmarksModal: React.FC<BookmarksModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onRefreshBookmarks,
}) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      api.getBookmarks().then(setBookmarks);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim() && newUrl.trim()) {
      let formattedUrl = newUrl.trim();
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = `https://${formattedUrl}`;
      }
      await api.addBookmark(newTitle.trim(), formattedUrl);
      const updated = await api.getBookmarks();
      setBookmarks(updated);
      onRefreshBookmarks();
      setNewTitle('');
      setNewUrl('');
      setShowAddForm(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await api.removeBookmark(id);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
    onRefreshBookmarks();
  };

  const filtered = bookmarks.filter(
    (b) =>
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          width: '600px',
          height: '500px',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-popover)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookmarkIcon size={18} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Bookmarks
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: 500,
                padding: '6px 12px',
                borderRadius: 'var(--radius-control)',
                background: 'var(--accent-primary)',
                color: 'var(--text-inverse)',
              }}
            >
              <Plus size={14} /> Add Bookmark
            </button>
            <button
              onClick={onClose}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-control)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Add Form Accordion */}
        {showAddForm && (
          <form
            onSubmit={handleAddBookmark}
            style={{
              padding: '14px 20px',
              background: 'var(--bg-primary)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              gap: '10px',
            }}
          >
            <input
              type="text"
              placeholder="Name"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{
                flex: 1,
                height: '34px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-strong)',
                background: 'var(--bg-surface)',
                padding: '0 10px',
                fontSize: '13px',
              }}
            />
            <input
              type="text"
              placeholder="https://..."
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              style={{
                flex: 1.5,
                height: '34px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-strong)',
                background: 'var(--bg-surface)',
                padding: '0 10px',
                fontSize: '13px',
              }}
            />
            <button
              type="submit"
              style={{
                padding: '0 14px',
                height: '34px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-primary)',
                color: 'var(--text-inverse)',
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              Save
            </button>
          </form>
        )}

        {/* Search Field */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--bg-primary)',
              borderRadius: 'var(--radius-control)',
              padding: '0 12px',
              height: '36px',
            }}
          >
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Filter bookmarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                fontSize: '13px',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>

        {/* Bookmarks List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
          {filtered.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--text-muted)',
                gap: '8px',
              }}
            >
              <BookmarkIcon size={32} opacity={0.4} />
              <div style={{ fontSize: '14px' }}>No bookmarks found</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {filtered.map((bm) => (
                <div
                  key={bm.id}
                  onClick={() => {
                    onClose();
                    onNavigate(bm.url);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-control)',
                    cursor: 'pointer',
                    transition: 'background var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-highlight)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                    {bm.favicon ? (
                      <img
                        src={bm.favicon}
                        alt=""
                        style={{ width: '16px', height: '16px', borderRadius: '3px' }}
                      />
                    ) : (
                      <Globe size={16} style={{ color: 'var(--text-muted)' }} />
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 500,
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {bm.title}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {bm.url}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDelete(bm.id, e)}
                    title="Remove bookmark"
                    style={{
                      color: 'var(--text-muted)',
                      padding: '4px',
                      borderRadius: '4px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--nooki-error-red)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
