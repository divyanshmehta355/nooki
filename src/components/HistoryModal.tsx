import React, { useState } from 'react';
import { X, Search, Trash2, Clock, Calendar } from 'lucide-react';
import { HistoryItem } from '../types/browser';
import * as api from '../services/api';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (url: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      api.getHistory().then(setHistory);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      api.getHistory().then(setHistory);
    } else {
      api.searchHistory(q).then(setHistory);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await api.deleteHistoryItem(id);
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  const handleClearAll = async () => {
    await api.clearHistory();
    setHistory([]);
  };

  const handleClearLastHour = async () => {
    await api.clearHistory(1);
    const updated = await api.getHistory();
    setHistory(updated);
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
          width: '640px',
          height: '520px',
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
            <Clock size={18} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Browsing History
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleClearLastHour}
              style={{
                fontSize: '12px',
                padding: '5px 10px',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)',
                background: 'var(--bg-primary)',
              }}
            >
              Clear Last Hour
            </button>
            <button
              onClick={handleClearAll}
              style={{
                fontSize: '12px',
                padding: '5px 10px',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--nooki-error-red)',
                background: 'var(--bg-primary)',
              }}
            >
              Clear All
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
              placeholder="Search history by title or URL..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              style={{
                flex: 1,
                fontSize: '13px',
                color: 'var(--text-primary)',
              }}
              autoFocus
            />
          </div>
        </div>

        {/* History List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
          {history.length === 0 ? (
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
              <Calendar size={32} opacity={0.4} />
              <div style={{ fontSize: '14px' }}>No history entries found</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onClose();
                    onNavigate(item.url);
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
                      {item.title}
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
                      {item.url}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(item.visited_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      title="Delete from history"
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
