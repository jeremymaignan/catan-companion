import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { RANK_COLORS } from '../shared/constants';

const ITEMS = [
  {
    label: 'Available',
    render: () => (
      <svg width="24" height="24" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill={RANK_COLORS.good.fill} stroke={RANK_COLORS.good.stroke} strokeWidth="1.5" />
        <text x="12" y="12" textAnchor="middle" dominantBaseline="central" fontSize="9" fontWeight="700" fill="#fff">1</text>
      </svg>
    ),
  },
  {
    label: 'Colony',
    render: () => (
      <svg width="24" height="24" viewBox="0 0 24 24">
        <rect x="2" y="2" width="20" height="20" rx="4" fill="#7b1fa2" stroke="#6a1b9a" strokeWidth="1.5" />
        <text x="12" y="13" textAnchor="middle" dominantBaseline="central" fontSize="11" fill="white" fontWeight="bold">{'\u25B2'}</text>
      </svg>
    ),
  },
  {
    label: 'City',
    render: () => (
      <svg width="24" height="24" viewBox="0 0 24 24">
        <rect x="2" y="2" width="20" height="20" rx="4" fill="#1565c0" stroke="#0d47a1" strokeWidth="1.5" />
        <text x="12" y="13" textAnchor="middle" dominantBaseline="central" fontSize="13" fill="white" fontWeight="bold">{'\u2605'}</text>
      </svg>
    ),
  },
  {
    label: 'Opponent',
    render: () => (
      <svg width="24" height="24" viewBox="0 0 24 24">
        <rect x="2" y="2" width="20" height="20" rx="4" fill="#212121" stroke="#000" strokeWidth="1.5" />
        <text x="12" y="13" textAnchor="middle" dominantBaseline="central" fontSize="11" fill="white" fontWeight="bold">{'\u2716'}</text>
      </svg>
    ),
  },
  {
    label: 'Robber',
    render: () => (
      <svg width="24" height="24" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="none" stroke="#1a1a1a" strokeWidth="2" />
        <line x1="5" y1="19" x2="19" y2="5" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function BoardLegend() {
  const [expanded, setExpanded] = useState(false);
  const [pos, setPos] = useState({ left: 0, bottom: 0 });
  const wrapperRef = useRef(null);

  // Center the popover on the toolbar (aligned with the board column),
  // anchored just above it — rather than centered on the legend button.
  useLayoutEffect(() => {
    if (!expanded) return;
    const reposition = () => {
      if (!wrapperRef.current) return;
      const toolbar = wrapperRef.current.parentElement;
      const rect = (toolbar || wrapperRef.current).getBoundingClientRect();
      setPos({
        left: rect.left + rect.width / 2,
        bottom: window.innerHeight - rect.top + 10,
      });
    };
    reposition();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [expanded]);

  // Close on click outside
  useEffect(() => {
    if (!expanded) return;
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [expanded]);

  return (
    <div style={styles.wrapper} ref={wrapperRef}>
      <button
        style={styles.toggle}
        onClick={() => setExpanded(v => !v)}
        title="Legend"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>

      {expanded && (
        <div style={{ ...styles.popover, left: pos.left, bottom: pos.bottom }}>
          <button
            style={styles.closeBtn}
            onClick={() => setExpanded(false)}
            title="Close legend"
          >
            &times;
          </button>
          <div style={styles.grid}>
            {ITEMS.map(item => (
              <div key={item.label} style={styles.item}>
                <div style={styles.icon}>{item.render()}</div>
                <div>
                  <div style={styles.label}>{item.label}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={styles.rankHint}>
            <span style={styles.rankDot(RANK_COLORS.good.fill)} />
            <span style={styles.rankLabel}>Best</span>
            <span style={styles.rankDot(RANK_COLORS.medium.fill)} />
            <span style={styles.rankLabel}>Medium</span>
            <span style={styles.rankDot(RANK_COLORS.poor.fill)} />
            <span style={styles.rankLabel}>Worst</span>
            <span style={styles.rankSuffix}> Position rank by production value</span>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    position: 'relative',
  },
  toggle: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    border: 'none',
    borderRadius: 8,
    background: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.15s',
    color: 'var(--text-body)',
    padding: 0,
  },
  popover: {
    position: 'fixed',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '28px 18px 14px',
    background: 'var(--card-bg)',
    borderRadius: 12,
    border: '1px solid var(--border-main)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    width: 'max-content',
    maxWidth: '90vw',
    zIndex: 600,
  },
  closeBtn: {
    position: 'absolute',
    top: 6,
    right: 8,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 20,
    lineHeight: 1,
    color: 'var(--text-hint)',
    padding: '2px 6px',
    borderRadius: 6,
  },
  grid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 10px',
    borderRadius: 8,
    background: 'var(--card-inner-bg)',
    border: '1px solid var(--border-subtle)',
    flex: '0 0 auto',
  },
  icon: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--text-primary)',
    fontFamily: "'Inter', sans-serif",
  },
  rankHint: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTop: '1px solid var(--border-subtle)',
    fontSize: 11,
    color: 'var(--text-muted)',
    fontWeight: 500,
    fontFamily: "'Inter', sans-serif",
    flexWrap: 'wrap',
  },
  rankDot: (color) => ({
    width: 10,
    height: 10,
    borderRadius: '50%',
    backgroundColor: color,
    display: 'inline-block',
    flexShrink: 0,
  }),
  rankLabel: {
    fontWeight: 600,
    color: 'var(--text-body)',
    marginRight: 4,
  },
  rankSuffix: {
    color: 'var(--text-hint)',
  },
};
