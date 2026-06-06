import React, { useState } from 'react';
import { BOARD_ROWS, TILE_CENTERS, hexPoints, getSettlementPixel, BOARD_CENTER, DARK_TILES } from '../shared/boardGeometry';
import { getRankColor } from '../shared/constants';
import PortBadge, { computePortBadgePos } from './PortBadge';

export default function HexBoard({ tiles, positions, ports, onPositionClick, onTileClick, rotation = 0 }) {
  const [hoveredPos, setHoveredPos] = useState(null);
  const [tooltipData, setTooltipData] = useState(null);

  if (!tiles || tiles.length === 0) return null;

  const hexData = [];
  let tileIdx = 0;
  for (let row = 0; row < BOARD_ROWS.length; row++) {
    const count = BOARD_ROWS[row];
    for (let col = 0; col < count; col++) {
      const tileNum = tileIdx + 1;
      const center = TILE_CENTERS[tileNum];
      hexData.push({ ...center, tile: tiles[tileIdx] });
      tileIdx++;
    }
  }

  const handleMouseEnter = (pos, info, pixel) => {
    setHoveredPos(pos);
    setTooltipData({ pos, info, pixel });
  };

  const handleMouseLeave = () => {
    setHoveredPos(null);
    setTooltipData(null);
  };

  // Calculate tooltip position (keep within SVG bounds)
  const getTooltipPos = (pixel) => {
    const tooltipW = 130;
    const tooltipH = 120;
    let tx = pixel.x + 18;
    let ty = pixel.y - tooltipH / 2;

    // If too far right, flip to left side
    if (tx + tooltipW > 880) tx = pixel.x - tooltipW - 18;
    // Keep within vertical bounds
    if (ty < -10) ty = -10;
    if (ty + tooltipH > 700) ty = 700 - tooltipH;

    return { x: tx, y: ty };
  };

  // Counter-rotation for text so it stays upright
  const cx = BOARD_CENTER.x;
  const cy = BOARD_CENTER.y;
  const rot = rotation;
  const textRotate = (x, y) => `rotate(${-rot}, ${x}, ${y})`;

  return (
    <svg viewBox="-40 -20 940 740" className="hex-board-svg">
      <defs>
        <filter id="hexShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#4e342e" floodOpacity="0.15" />
        </filter>
        <filter id="markerGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000" floodOpacity="0.25" />
        </filter>
        <filter id="tooltipShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.2" />
        </filter>
        <filter id="port-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.2" />
        </filter>
      </defs>

      <g transform={`rotate(${rot}, ${cx}, ${cy})`} style={{ transition: 'transform 0.4s ease' }}>

      {/* Draw hexagons */}
      {hexData.map((hex, i) => {
        const isHot = hex.tile.value === 6 || hex.tile.value === 8;
        const isDark = DARK_TILES.has(hex.tile.board_color);
        const hasRobber = hex.tile.has_robber;
        return (
          <g
            key={`hex-${i}`}
            filter="url(#hexShadow)"
            onClick={() => onTileClick && onTileClick(hex.tile.index)}
            style={{ cursor: onTileClick ? 'pointer' : 'default' }}
          >
            <polygon
              points={hexPoints(hex.x, hex.y)}
              fill={hex.tile.board_color}
              stroke={hasRobber ? '#1a1a1a' : '#4a4a4a'}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Grey overlay when robber is on the tile */}
            {hasRobber && (
              <polygon
                points={hexPoints(hex.x, hex.y)}
                fill="rgba(0,0,0,0.35)"
                stroke="#1a1a1a"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
            )}
            {/* Counter-rotate resource name + dice value as a group around tile center */}
            <g transform={textRotate(hex.x, hex.y)}>
              <text
                x={hex.x}
                y={hex.y - 14}
                textAnchor="middle"
                fontSize="14"
                fontWeight="600"
                fontFamily="'Inter', sans-serif"
                fill={hasRobber ? 'rgba(255,255,255,0.7)' : isDark ? 'rgba(255,255,255,0.9)' : '#3e2723'}
              >
                {hex.tile.text}
              </text>
              {hex.tile.value > 0 && (
                <>
                  <circle cx={hex.x} cy={hex.y + 18} r="22" fill={hasRobber ? '#e0e0e0' : '#faf8f5'} stroke={hasRobber ? '#1a1a1a' : isHot ? '#c62828' : '#5d4037'} strokeWidth={hasRobber ? 2 : 1.5} />
                  <text
                    x={hex.x}
                    y={hex.y + 18}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="20"
                    fontWeight="600"
                    fontFamily="'Inter', sans-serif"
                    fill={hasRobber ? '#1a1a1a' : isHot ? '#c62828' : '#3e2723'}
                  >
                    {hex.tile.value}
                  </text>
                  {hasRobber && (
                    <g>
                      {/* Black interdit circle */}
                      <circle cx={hex.x} cy={hex.y + 18} r="22" fill="none" stroke="#1a1a1a" strokeWidth="3" />
                      {/* Diagonal cross line */}
                      <line x1={hex.x - 15} y1={hex.y + 33} x2={hex.x + 15} y2={hex.y + 3} stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" />
                    </g>
                  )}
                </>
              )}
              {hex.tile.value === 0 && hasRobber && (
                <g>
                  <circle cx={hex.x} cy={hex.y + 18} r="22" fill="none" stroke="#1a1a1a" strokeWidth="3" />
                  <line x1={hex.x - 15} y1={hex.y + 33} x2={hex.x + 15} y2={hex.y + 3} stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" />
                </g>
              )}
            </g>
          </g>
        );
      })}

      {/* Draw ports */}
      {ports && ports.map((port) => {
        if (port.type === 'none') return null;
        const pos = computePortBadgePos(port.positions[0], port.positions[1], 55);
        if (!pos) return null;

        return (
          <g key={`port-${port.index}`}>
            <PortBadge
              portType={port.type}
              badgeX={pos.badgeX}
              badgeY={pos.badgeY}
              pA={pos.pA}
              pB={pos.pB}
              textTransform={textRotate(pos.badgeX, pos.badgeY)}
            />
          </g>
        );
      })}

      {/* Draw settlement positions */}
      {positions && Object.entries(positions).map(([pos, info]) => {
        const pixel = getSettlementPixel(pos);
        if (!pixel) return null;

        const { status } = info;
        const isClickable = status === 'available' || status === 'colony' || status === 'city' || status === 'opponent';
        const isHovered = hoveredPos === pos;
        const rankColors = getRankColor(info.rank, info.total_ranks || 1);

        return (
          <g
            key={`pos-${pos}`}
            onClick={() => isClickable ? onPositionClick(pos) : null}
            style={{ cursor: isClickable ? 'pointer' : 'default' }}
            filter={status === 'colony' || status === 'city' || status === 'opponent' ? 'url(#markerGlow)' : undefined}
            onMouseEnter={() => status === 'available' ? handleMouseEnter(pos, info, pixel) : null}
            onMouseLeave={handleMouseLeave}
          >
            {status === 'colony' ? (
              <g transform={textRotate(pixel.x, pixel.y)}>
                <rect x={pixel.x - 13} y={pixel.y - 13} width="26" height="26" rx="5" fill="#7b1fa2" stroke="#6a1b9a" strokeWidth="2" />
                <text x={pixel.x} y={pixel.y + 1} textAnchor="middle" dominantBaseline="middle" fontSize="13" fill="white" fontWeight="bold">
                  {'\u25B2'}
                </text>
              </g>
            ) : status === 'city' ? (
              <g transform={textRotate(pixel.x, pixel.y)}>
                <rect x={pixel.x - 13} y={pixel.y - 13} width="26" height="26" rx="5" fill="#1565c0" stroke="#0d47a1" strokeWidth="2" />
                <text x={pixel.x} y={pixel.y + 1} textAnchor="middle" dominantBaseline="middle" fontSize="15" fill="white" fontWeight="bold">
                  {'\u2605'}
                </text>
              </g>
            ) : status === 'opponent' ? (
              <g transform={textRotate(pixel.x, pixel.y)}>
                <rect x={pixel.x - 13} y={pixel.y - 13} width="26" height="26" rx="5" fill="#212121" stroke="#000" strokeWidth="2" />
                <text x={pixel.x} y={pixel.y + 1} textAnchor="middle" dominantBaseline="middle" fontSize="13" fill="white" fontWeight="bold">
                  {'\u2716'}
                </text>
              </g>
            ) : status === 'blocked' ? (
              <circle cx={pixel.x} cy={pixel.y} r="5" fill="#ccc" opacity="0.5" />
            ) : status === 'available' ? (
              <g transform={textRotate(pixel.x, pixel.y)}>
                <circle
                  cx={pixel.x}
                  cy={pixel.y}
                  r={isHovered ? 14 : 12}
                  fill={rankColors.fill}
                  stroke={rankColors.stroke}
                  strokeWidth="2"
                  opacity={isHovered ? 1 : 0.9}
                />
                <text
                  x={pixel.x}
                  y={pixel.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={isHovered ? 12 : 11}
                  fontWeight="700"
                  fontFamily="'Inter', sans-serif"
                  fill={rankColors.text}
                >
                  {info.rank}
                </text>
              </g>
            ) : null}
          </g>
        );
      })}

      {/* Tooltip */}
      {tooltipData && (() => {
        const { info, pixel } = tooltipData;
        const tileDetails = info.tile_details || [];
        const nonDesert = tileDetails.filter(t => t.value > 0);
        const rowHeight = 20;
        const headerH = 28;
        const footerH = 22;
        const tooltipW = 130;
        const tooltipH = headerH + nonDesert.length * rowHeight + footerH + 4;
        const tp = getTooltipPos(pixel);

        const tooltipCx = tp.x + tooltipW / 2;
        const tooltipCy = tp.y + tooltipH / 2;

        return (
          <g filter="url(#tooltipShadow)" style={{ pointerEvents: 'none' }} transform={textRotate(tooltipCx, tooltipCy)}>
            <rect
              x={tp.x}
              y={tp.y}
              width={tooltipW}
              height={tooltipH}
              rx="8"
              fill="var(--svg-tooltip-bg)"
              stroke="var(--svg-tooltip-border)"
              strokeWidth="1"
            />
            {/* Header */}
            <text
              x={tp.x + tooltipW / 2}
              y={tp.y + 17}
              textAnchor="middle"
              fontSize="12"
              fontWeight="700"
              fontFamily="'Inter', sans-serif"
              fill="var(--text-primary)"
            >
              {`Rank #${info.rank}  \u00B7  Score ${info.score}`}
            </text>
            <line x1={tp.x + 8} y1={tp.y + headerH} x2={tp.x + tooltipW - 8} y2={tp.y + headerH} stroke="var(--border-divider)" strokeWidth="1" />

            {/* Resource rows */}
            {nonDesert.map((tile, i) => {
              const ry = tp.y + headerH + 4 + i * rowHeight;
              return (
                <g key={i}>
                  {/* Resource color dot */}
                  <circle cx={tp.x + 14} cy={ry + 9} r="5" fill={tile.color} />
                  {/* Resource name */}
                  <text
                    x={tp.x + 24}
                    y={ry + 9}
                    dominantBaseline="central"
                    fontSize="11"
                    fontWeight="600"
                    fontFamily="'Inter', sans-serif"
                    fill={tile.has_robber ? 'var(--text-disabled)' : 'var(--text-primary)'}
                    textDecoration={tile.has_robber ? 'line-through' : 'none'}
                  >
                    {tile.text}
                  </text>
                  {/* Dice value */}
                  <text
                    x={tp.x + tooltipW - 14}
                    y={ry + 9}
                    dominantBaseline="central"
                    textAnchor="end"
                    fontSize="11"
                    fontWeight="700"
                    fontFamily="'Inter', sans-serif"
                    fill={tile.has_robber ? 'var(--text-disabled)' : (tile.value === 6 || tile.value === 8) ? '#c62828' : 'var(--text-body)'}
                  >
                    {tile.value}
                  </text>
                </g>
              );
            })}

            {/* Footer: total */}
            <line
              x1={tp.x + 8}
              y1={tp.y + headerH + nonDesert.length * rowHeight + 4}
              x2={tp.x + tooltipW - 8}
              y2={tp.y + headerH + nonDesert.length * rowHeight + 4}
              stroke="var(--border-divider)"
              strokeWidth="1"
            />
            <text
              x={tp.x + tooltipW / 2}
              y={tp.y + tooltipH - 8}
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              fontFamily="'Inter', sans-serif"
              fill="var(--text-secondary)"
            >
              Total: {info.score}/36
            </text>
          </g>
        );
      })()}
      </g>
    </svg>
  );
}
