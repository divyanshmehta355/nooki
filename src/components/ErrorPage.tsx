import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface ErrorPageProps {
  url: string;
  onGoHome: () => void;
  onWhitelistAndRetry: (domain: string) => void;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({
  url,
  onGoHome,
  onWhitelistAndRetry,
}) => {
  const params = React.useMemo(() => {
    try {
      const q = url.split('?')[1];
      const search = new URLSearchParams(q);
      return {
        domain: search.get('domain') || 'This website',
        rule: search.get('rule') || 'Matched security or malware blocklist',
      };
    } catch {
      return {
        domain: 'This website',
        rule: 'Security filter rule',
      };
    }
  }, [url]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        padding: '24px',
        textAlign: 'center',
        userSelect: 'none',
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          maxWidth: '480px',
          width: '100%',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-card)',
          padding: '36px 28px',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'var(--bg-highlight)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--nooki-warm-amber)',
          }}
        >
          <ShieldAlert size={30} />
        </div>

        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Page Blocked by Nooki Shield
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
            <strong>{params.domain}</strong> was stopped to protect your privacy and security.
          </p>
        </div>

        <div
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-control)',
            background: 'var(--bg-primary)',
            fontSize: '12px',
            color: 'var(--text-muted)',
            fontFamily: 'monospace',
            width: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          Rule: {params.rule}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '8px', width: '100%' }}>
          <button
            onClick={onGoHome}
            style={{
              flex: 1,
              height: '40px',
              borderRadius: 'var(--radius-control)',
              background: 'var(--accent-primary)',
              color: 'var(--text-inverse)',
              fontWeight: 500,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <ArrowLeft size={15} /> Back to Safety
          </button>

          <button
            onClick={() => onWhitelistAndRetry(params.domain)}
            style={{
              flex: 1,
              height: '40px',
              borderRadius: 'var(--radius-control)',
              background: 'var(--bg-primary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              fontWeight: 500,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            Allow Site
          </button>
        </div>
      </div>
    </div>
  );
};
