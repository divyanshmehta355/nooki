import React, { useState } from 'react';
import { X, Download, File, CheckCircle2, AlertCircle } from 'lucide-react';
import { DownloadItem } from '../types/browser';
import * as api from '../services/api';

interface DownloadsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadsModal: React.FC<DownloadsModalProps> = ({ isOpen, onClose }) => {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);

  React.useEffect(() => {
    if (isOpen) {
      api.getDownloads().then(setDownloads);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClearCompleted = async () => {
    await api.clearCompletedDownloads();
    setDownloads((prev) => prev.filter((d) => d.status === 'downloading'));
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
          width: '560px',
          height: '460px',
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
            <Download size={18} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Downloads
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {downloads.some((d) => d.status === 'completed') && (
              <button
                onClick={handleClearCompleted}
                style={{
                  fontSize: '12px',
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-primary)',
                }}
              >
                Clear Completed
              </button>
            )}
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

        {/* Downloads List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {downloads.length === 0 ? (
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
              <Download size={32} opacity={0.35} />
              <div style={{ fontSize: '14px' }}>No downloads yet</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Downloaded files will appear here
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {downloads.map((item) => (
                <div
                  key={item.id}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: 'var(--bg-highlight)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent-primary)',
                        flexShrink: 0,
                      }}
                    >
                      <File size={18} />
                    </div>

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
                        {item.filename}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {item.status === 'completed' && 'Completed'}
                        {item.status === 'downloading' && 'Downloading...'}
                        {item.status === 'failed' && (item.error_message || 'Download failed')}
                      </div>
                    </div>
                  </div>

                  {item.status === 'completed' && (
                    <CheckCircle2 size={16} style={{ color: 'var(--accent-primary)' }} />
                  )}
                  {item.status === 'failed' && (
                    <AlertCircle size={16} style={{ color: 'var(--nooki-error-red)' }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
