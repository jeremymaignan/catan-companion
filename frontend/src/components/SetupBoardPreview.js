import React from 'react';
import { BOARD_ROWS, TILE_CENTERS, hexPoints, getSettlementPixel, ALL_COASTAL_EDGES, DARK_TILES } from '../shared/boardGeometry';
import { RESOURCE_BOARD_COLORS, RESOURCE_LABELS, PORT_COLORS, PORT_EMOJI_LABELS } from '../shared/constants';
import PortBadge, { computePortBadgePos } from './PortBadge';

const edgeKey = (a, b) => `${a}-${b}`;

export default function SetupBoardPreview({ resources, values, ports, blockedEdges, onPortClick }) {
  // Build hex data
  const hexData = [];
  let tileIdx = 0;
  for (let row = 0; row < BOARD_ROWS.length; row++) {
    const count = BOARD_ROWS[row];
    for (let col = 0; col < count; col++) {
      const tileNum = tileIdx + 1;
      const center = TILE_CENTERS[tileNum];
      hexData.push({
        ...center,
        resource: resources[tileIdx],
        value: parseInt(values[tileIdx], 10),
      });
      tileIdx++;
    }
  }

  return (
    <svg viewBox="-50 10 960 660" className="hex-board-svg setup-board-svg">
      <defs>
        <filter id="port-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.2" />
        </filter>
      </defs>
      {/* Hexagons */}
      {hexData.map((hex, i) => {
        const boardColor = RESOURCE_BOARD_COLORS[hex.resource] || '#ccc';
        const isDark = DARK_TILES.has(boardColor);
        const isHot = hex.value === 6 || hex.value === 8;
        const label = RESOURCE_LABELS[hex.resource] || '';
        return (
          <g key={`hex-${i}`}>
            <polygon
              points={hexPoints(hex.x, hex.y)}
              fill={boardColor}
              stroke="#4a4a4a"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Resource name */}
            <text
              x={hex.x} y={hex.y - (hex.value > 0 ? 24 : 0)}
              textAnchor="middle" dominantBaseline="central"
              fontSize="13" fontWeight="600"
              fontFamily="'Inter', sans-serif"
              fill={isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.55)'}
            >
              {label}
            </text>
            {hex.value > 0 && (
              <>
                <circle
                  cx={hex.x} cy={hex.y + 8} r="20"
                  fill="#faf8f5"
                  stroke={isHot ? '#c62828' : '#5d4037'}
                  strokeWidth={isHot ? 2 : 1}
                />
                <text
                  x={hex.x} y={hex.y + 8}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize="18" fontWeight={isHot ? '800' : '600'}
                  fontFamily="'Inter', sans-serif"
                  fill={isHot ? '#c62828' : '#3e2723'}
                >
                  {hex.value}
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* Port indicators - all 30 coastal edges */}
      {ALL_COASTAL_EDGES.map(([posA, posB], i) => {
        const pA = getSettlementPixel(posA);
        const pB = getSettlementPixel(posB);
        if (!pA || !pB) return null;

        const key = edgeKey(posA, posB);
        const portType = ports[key] || 'none';
        const isBlocked = blockedEdges && blockedEdges.has(key) && portType === 'none';
        const isNone = portType === 'none';

        if (isBlocked) return null;

        const pos = computePortBadgePos(posA, posB, isNone ? 28 : 55);
        if (!pos) return null;

        return (
          <g
            key={`port-${i}`}
            onClick={() => onPortClick(key)}
            style={{ cursor: 'pointer' }}
          >
            {isNone ? (
              <>
                {/* Lines from each vertex to the "+" circle */}
                <line x1={pA.x} y1={pA.y} x2={pos.badgeX} y2={pos.badgeY} stroke="#ccc" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
                <line x1={pB.x} y1={pB.y} x2={pos.badgeX} y2={pos.badgeY} stroke="#ccc" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
                <circle cx={pA.x} cy={pA.y} r="3" fill="#ccc" opacity="0.4" />
                <circle cx={pB.x} cy={pB.y} r="3" fill="#ccc" opacity="0.4" />
                <circle cx={pos.badgeX} cy={pos.badgeY} r="16" fill="var(--page-bg)" stroke="var(--border-light)" strokeWidth="1.5" />
                <text
                  x={pos.badgeX} y={pos.badgeY}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize="18" fontWeight="600"
                  fontFamily="'Inter', sans-serif"
                  fill="var(--text-disabled)"
                >
                  +
                </text>
              </>
            ) : (
              <PortBadge
                portType={portType}
                badgeX={pos.badgeX}
                badgeY={pos.badgeY}
                pA={pos.pA}
                pB={pos.pB}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
