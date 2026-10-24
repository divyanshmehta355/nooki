import React, { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, Settings, EyeOff, ListFilter, Activity } from 'lucide-react';
import { BlockedLogEntry, TabShieldStats, SessionShieldStats, FilterListMetadata } from '../types/browser';
import * as api from '../services/api';

interface ShieldPopoverProps {
  tabId: string;
  currentUrl: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: (section?: string) => void;
}

export const ShieldPopover: React.FC<ShieldPopoverProps> = ({
  tabId,
  currentUrl,
  isOpen,
  onClose,
  onOpenSettings,
}) => {
  const [tabStats, setTabStats] = useState<TabShieldStats>({ blocked_ads: 0, blocked_trackers: 0, elements_hidden: 0, total: 0 });
  const [sessionStats, setSessionStats] = useState<SessionShieldStats>({ total_blocked_requests: 0, total_blocked_trackers: 0, total_elements_hidden: 0, total: 0 });
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [filterLists, setFilterLists] = useState<FilterListMetadata[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [recentLogs, setRecentLogs] = useState<BlockedLogEntry[]>([]);

  const domain = React.useMemo(() => {
    try {
      if (currentUrl.startsWith('http://') || currentUrl.startsWith('https://')) {
        return new URL(currentUrl).hostname;
      }
    } catch {
      // ignore
    }
    return '';
  }, [currentUrl]);

  useEffect(() => {
    if (isOpen) {
      api.getTabShieldStats(tabId).then(setTabStats);
      api.getSessionShieldStats().then(setSessionStats);
      api.getFilterLists().then(setFilterLists);
      if (domain) {
        api.isSiteWhitelisted(domain).then(setIsWhitelisted);
      }
      api.getBlockedLogs().then((logs) => {
        setRecentLogs(logs.filter((l) => l.tab_id === tabId).slice(-10));
      });
    }
  }, [isOpen, tabId, domain]);

  if (!isOpen) return null;

  const handleToggleSite = async () => {
    if (!domain) return;
    const nextState = !isWhitelisted;
    await api.toggleSiteShield(domain, nextState);
    setIsWhitelisted(nextState);
    const updatedStats = await api.getTabShieldStats(tabId);
    setTabStats(updatedStats);
  };

  const totalRules = filterLists.reduce((acc, l) => acc + (l.enabled ? l.rule_count : 0), 0);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
        }}
      />

      {/* Popover Card */}
      <div
        className="animate-fade-in"
        style={{
          position: 'absolute',
          top: '46px',
          right: '80px',
          width: '340px',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-popover)',
          zIndex: 1001,
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          userSelect: 'none',
        }}
      >
        {/* Header with Protection Switch */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: isWhitelisted ? 'var(--bg-muted)' : 'var(--accent-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isWhitelisted ? 'var(--text-muted)' : 'var(--accent-primary)',
              }}
            >
              {isWhitelisted ? <ShieldAlert size={20} /> : <ShieldCheck size={20} />}
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Nooki Shield
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {isWhitelisted
                  ? 'Protection paused on this site'
                  : domain
                  ? `Active on ${domain}`
                  : 'Active & Protecting'}
              </div>
            </div>
          </div>

          {/* Toggle Button */}
          {domain && (
            <button
              onClick={handleToggleSite}
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '12px',
                fontWeight: 500,
                background: isWhitelisted ? 'var(--accent-primary)' : 'var(--bg-muted)',
                color: isWhitelisted ? 'var(--text-inverse)' : 'var(--text-primary)',
                transition: 'all var(--transition-fast)',
              }}
            >
              {isWhitelisted ? 'Resume' : 'Pause'}
            </button>
          )}
        </div>

        {/* Current Tab Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            background: 'var(--bg-highlight)',
            padding: '12px',
            borderRadius: 'var(--radius-control)',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-primary)' }}>
              {tabStats.blocked_ads}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Ads Blocked</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--nooki-warm-amber)' }}>
              {tabStats.blocked_trackers}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Trackers</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {tabStats.elements_hidden}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Hidden</div>
          </div>
        </div>

        {/* Session Aggregate Stats */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 10px',
            background: 'var(--bg-primary)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            color: 'var(--text-secondary)',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={14} style={{ color: 'var(--accent-primary)' }} /> Session Total Blocked
          </span>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {sessionStats.total} items
          </span>
        </div>

        {/* Filter Lists Health */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            padding: '0 4px',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ListFilter size={14} /> Active Filter Lists
          </span>
          <span style={{ fontWeight: 500, color: 'var(--accent-primary)' }}>
            4 lists active ({totalRules.toLocaleString()} rules)
          </span>
        </div>

        {/* Recent Blocked Logs Toggle */}
        {recentLogs.length > 0 && (
          <div>
            <button
              onClick={() => setShowLogs(!showLogs)}
              style={{
                width: '100%',
                padding: '6px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                borderRadius: 'var(--radius-sm)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-highlight)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <EyeOff size={13} />
              {showLogs ? 'Hide blocked requests' : `Inspect ${recentLogs.length} blocked items`}
            </button>

            {showLogs && (
              <div
                style={{
                  maxHeight: '130px',
                  overflowY: 'auto',
                  marginTop: '6px',
                  background: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px',
                  fontSize: '11px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                {recentLogs.map((log, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '4px 6px',
                      background: 'var(--bg-surface)',
                      borderRadius: '4px',
                      borderLeft: `3px solid ${
                        log.category === 'tracker' ? 'var(--nooki-warm-amber)' : 'var(--accent-primary)'
                      }`,
                    }}
                  >
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                      {log.domain}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                      {log.category.toUpperCase()} · {log.rule}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer Link to Settings */}
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Nooki Privacy Engine
          </span>
          <button
            onClick={() => {
              onClose();
              onOpenSettings('ad-blocking');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--accent-primary)',
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-highlight)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <Settings size={13} />
            Filter Settings
          </button>
        </div>
      </div>
    </>
  );
};
