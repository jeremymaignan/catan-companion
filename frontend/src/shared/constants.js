/**
 * Shared resource, port, and color constants.
 * Single source of truth used across all components.
 */

// ── Resources ───────────────────────────────────────────────────────

export const RESOURCES = [
  { code: 'wo', label: 'Wood',   emoji: '\u{1F332}', color: '#1b5e20', boardColor: '#4a9e4a', portType: 'wo_port' },
  { code: 'b',  label: 'Brick',  emoji: '\u{1F9F1}', color: '#a0522d', boardColor: '#d4a373', portType: 'b_port' },
  { code: 'o',  label: 'Ore',    emoji: '\u{26F0}\uFE0F',  color: '#757575', boardColor: '#c5c5c5', portType: 'o_port' },
  { code: 's',  label: 'Sheep',  emoji: '\u{1F411}', color: '#aed581', boardColor: '#c5e1a5', portType: 's_port' },
  { code: 'w',  label: 'Wheat',  emoji: '\u{1F33E}', color: '#fdd835', boardColor: '#ffe082', portType: 'w_port' },
];

export const DESERT = { code: 'r', label: 'Desert', emoji: '\u{1F3DC}\uFE0F', color: '#a1887f', boardColor: '#efebe9' };

/** All resources including desert (for setup form) */
export const ALL_RESOURCES = [...RESOURCES, DESERT];

/** Lookup by resource code */
export const RESOURCE_BY_CODE = {};
RESOURCES.forEach(r => { RESOURCE_BY_CODE[r.code] = r; });
RESOURCE_BY_CODE[DESERT.code] = DESERT;

/** Emoji lookup by resource code */
export const RESOURCE_EMOJIS = {};
RESOURCES.forEach(r => { RESOURCE_EMOJIS[r.code] = r.emoji; });

/** Board color lookup by resource code */
export const RESOURCE_BOARD_COLORS = {};
ALL_RESOURCES.forEach(r => { RESOURCE_BOARD_COLORS[r.code] = r.boardColor; });

/** Resource label lookup by resource code */
export const RESOURCE_LABELS = {};
ALL_RESOURCES.forEach(r => { RESOURCE_LABELS[r.code] = r.label; });

// ── Ports ───────────────────────────────────────────────────────────

export const PORT_COLORS = {
  'none':    { fill: '#e8e0d8', stroke: '#d7ccc8', text: '#bbb' },
  '3:1':    { fill: '#fff',    stroke: '#4a4a4a', text: '#4a4a4a' },
  'wo_port': { fill: '#1b5e20', stroke: '#1b5e20', text: '#fff' },
  'b_port':  { fill: '#a0522d', stroke: '#a0522d', text: '#fff' },
  'o_port':  { fill: '#9e9e9e', stroke: '#757575', text: '#fff' },
  's_port':  { fill: '#aed581', stroke: '#7cb342', text: '#33691e' },
  'w_port':  { fill: '#fdd835', stroke: '#f9a825', text: '#4e342e' },
};

export const PORT_EMOJI_LABELS = {
  'none': '+',
  '3:1': '3:1',
  'wo_port': '\u{1F332} Wood',
  'b_port': '\u{1F9F1} Brick',
  'o_port': '\u{26F0}\uFE0F Ore',
  's_port': '\u{1F411} Sheep',
  'w_port': '\u{1F33E} Wheat',
};

export const PORT_SUBLABELS = {
  'wo_port': '2:1', 'b_port': '2:1', 'o_port': '2:1',
  's_port': '2:1', 'w_port': '2:1',
};

/** Port type code -> resource code */
export const PORT_TO_RESOURCE = {
  'wo_port': 'wo', 'b_port': 'b', 'o_port': 'o', 's_port': 's', 'w_port': 'w',
};

// ── UI colors ───────────────────────────────────────────────────────

/** Dice value color tiers */
const DICE_COLORS = {
  rare:    '#c62828',   // 2, 12 — red
  hot:     '#388e3c',   // 5, 6, 8, 9 — green
  seven:   '#1a1a1a',   // 7 — black
  common:  '#e6a817',   // 3, 4, 10, 11 — yellow/amber
};

/** Return the accent color for a given dice value */
export function getDiceColor(value) {
  const v = Number(value);
  if (v === 2 || v === 12) return DICE_COLORS.rare;
  if (v === 5 || v === 6 || v === 8 || v === 9) return DICE_COLORS.hot;
  if (v === 7) return DICE_COLORS.seven;
  return DICE_COLORS.common;
}

/** Rank color tiers for settlement position scores */
export const RANK_COLORS = {
  good:   { fill: '#43a047', stroke: '#2e7d32', text: '#fff' },
  medium: { fill: '#f9a825', stroke: '#f57f17', text: '#fff' },
  poor:   { fill: '#e53935', stroke: '#c62828', text: '#fff' },
};

/** Validation status colors (setup form, settlements) — uses CSS variables for dark mode */
export const VALIDATION_COLORS = {
  valid:   { accent: 'var(--validation-ok-accent)',  bg: 'var(--validation-ok-bg)',  text: 'var(--validation-ok-text)' },
  invalid: { accent: 'var(--validation-err-accent)', bg: 'var(--validation-err-bg)', text: 'var(--validation-err-text)' },
  over:    'var(--validation-err-text)',
};

/**
 * Return rank color set based on rank percentile.
 * rank=1 is best, totalRanks is worst.
 */
export function getRankColor(rank, totalRanks) {
  if (totalRanks <= 1) return { ...RANK_COLORS.good, text: '#2e7d32' };
  const pct = (rank - 1) / (totalRanks - 1); // 0 = best, 1 = worst
  if (pct < 0.33) return RANK_COLORS.good;
  if (pct < 0.66) return RANK_COLORS.medium;
  return RANK_COLORS.poor;
}

// ── Trading ─────────────────────────────────────────────────────────

/**
 * Compute trading rates for each resource based on port access.
 * Returns { resourceCode: 2|3|4 }
 */
export function computeTradingRates(ports, settlements) {
  const rates = {};
  RESOURCES.forEach(r => { rates[r.code] = 4; });
  if (!ports || !settlements) return rates;

  const settled = new Set(
    Object.entries(settlements)
      .filter(([, t]) => t === 'colony' || t === 'city')
      .map(([pos]) => pos)
  );

  for (const port of ports) {
    if (!port.positions || port.type === 'none') continue;
    const hasAccess = settled.has(port.positions[0]) || settled.has(port.positions[1]);
    if (!hasAccess) continue;

    if (port.type === '3:1') {
      RESOURCES.forEach(r => { if (rates[r.code] > 3) rates[r.code] = 3; });
    } else {
      const rc = PORT_TO_RESOURCE[port.type];
      if (rc && rates[rc] > 2) rates[rc] = 2;
    }
  }
  return rates;
}
