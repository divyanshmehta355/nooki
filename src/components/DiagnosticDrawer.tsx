import React, { useState, useEffect, useRef } from 'react';
import { Terminal, X, Copy, Trash2, Check, ChevronUp, ChevronDown } from 'lucide-react';
import { DiagnosticLog, subscribeDiagnosticLogs } from '../services/api';

interface DiagnosticDrawerProps {
  activeTabId?: string;
  activeUrl?: string;
}

export const DiagnosticDrawer: React.FC<DiagnosticDrawerProps> = ({ activeTabId, activeUrl }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<DiagnosticLog[]>([]);
  const [copied, setCopied] = useState(false);
  const isTauri = typeof window !== 'undefined' && Boolean((window as any).__TAURI_INTERNALS__);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeDiagnosticLogs((updated) => {
      setLogs(updated);
    });
    return unsubscribe;
  }, []);

  // Auto-scroll when open
  useEffect(() => {
    if (isOpen) {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen]);

  // Global toggle shortcut Ctrl+Shift+L
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleCopyLogs = () => {
    const text = logs.map((l) => `[${l.time}] [${l.level.toUpperCase()}] [${l.source}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const errorCount = logs.filter((l) => l.level === 'error').length;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '12px',
        right: '16px',
        zIndex: 9999,
        fontFamily: 'var(--font-sans)',
        fontSize: '12px',
      }}
    >
      {/* Expanded Log Drawer */}
      {isOpen && (
        <div
          style={{
            width: '520px',
            maxWidth: 'calc(100vw - 32px)',
            height: '340px',
            background: 'rgba(26, 36, 31, 0.95)',
            backdropFilter: 'blur(16px)',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-popover)',
            color: '#E5EEE5',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            marginBottom: '8px',
            animation: 'fadeIn var(--transition-fast) forwards',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(20, 28, 24, 0.6)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Terminal size={15} style={{ color: 'var(--accent-primary)' }} />
              <span style={{ fontWeight: 600, fontSize: '13px' }}>Nooki Live Diagnostics & Logs</span>
              <span
                style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-pill)',
                  background: isTauri ? 'rgba(40, 118, 95, 0.3)' : 'rgba(184, 121, 55, 0.3)',
                  color: isTauri ? '#91C5A5' : '#E09E58',
                  fontWeight: 600,
                }}
              >
                {isTauri ? 'Tauri WebView2 Native' : 'Browser Web Preview'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={handleCopyLogs}
                title="Copy all logs"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: copied ? '#91C5A5' : '#A7B5AA',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span style={{ fontSize: '11px' }}>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={() => setLogs([])}
                title="Clear current log view"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#A7B5AA',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <Trash2 size={14} />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#A7B5AA',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Subheader info bar */}
          <div
            style={{
              padding: '6px 14px',
              fontSize: '11px',
              color: '#8E9A8E',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              gap: '16px',
            }}
          >
            <span>Active Tab: <strong style={{ color: '#E5EEE5' }}>{activeTabId || 'none'}</strong></span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '280px' }}>
              URL: <strong style={{ color: '#E5EEE5' }}>{activeUrl || 'none'}</strong>
            </span>
          </div>

          {/* Logs scroll area */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '10px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontFamily: 'Consolas, monospace',
              fontSize: '11.5px',
            }}
          >
            {logs.length === 0 ? (
              <div style={{ color: '#77857A', fontStyle: 'italic', padding: '20px 0', textAlign: 'center' }}>
                No events logged yet. Perform an action to see diagnostic traces.
              </div>
            ) : (
              logs.map((log) => {
                const color =
                  log.level === 'error'
                    ? '#E66A6A'
                    : log.level === 'warn'
                    ? '#E09E58'
                    : '#C7D9CE';
                return (
                  <div key={log.id} style={{ display: 'flex', gap: '8px', lineHeight: 1.4 }}>
                    <span style={{ color: '#66776C', flexShrink: 0 }}>[{log.time}]</span>
                    <span
                      style={{
                        color: log.level === 'error' ? '#E66A6A' : 'var(--accent-primary)',
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      [{log.source}]
                    </span>
                    <span style={{ color, wordBreak: 'break-all' }}>{log.message}</span>
                  </div>
                );
              })
            )}
            <div ref={logEndRef} />
          </div>
        </div>
      )}

      {/* Collapsed Pill Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: 'var(--radius-pill)',
          background: errorCount > 0 ? 'rgba(200, 75, 75, 0.9)' : 'rgba(32, 41, 35, 0.92)',
          backdropFilter: 'blur(10px)',
          border: errorCount > 0 ? '1px solid #E66A6A' : '1px solid rgba(255, 255, 255, 0.15)',
          color: '#FFFEFA',
          boxShadow: 'var(--shadow-card)',
          cursor: 'pointer',
          transition: 'all var(--transition-fast)',
        }}
      >
        <Terminal size={14} style={{ color: errorCount > 0 ? '#FFFFFF' : 'var(--accent-primary)' }} />
        <span style={{ fontWeight: 500, fontSize: '11.5px' }}>
          Diagnostics {isTauri ? '(Native)' : '(Web)'}
        </span>

        {errorCount > 0 ? (
          <span
            style={{
              background: '#FFFFFF',
              color: '#C84B4B',
              fontSize: '10px',
              fontWeight: 700,
              padding: '1px 5px',
              borderRadius: 'var(--radius-pill)',
            }}
          >
            {errorCount} {errorCount === 1 ? 'error' : 'errors'}
          </span>
        ) : (
          <span style={{ color: '#A7B5AA', fontSize: '11px' }}>
            {logs.length} events
          </span>
        )}

        {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>
    </div>
  );
};
