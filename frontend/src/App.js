import React, { useState, useEffect, useCallback, useRef } from 'react';
import HexBoard from './components/HexBoard';
import SetupForm from './components/SetupForm';
import StatsPanel from './components/StatsPanel';
import TradingCard from './components/TradingCard';
import ScarcityCard from './components/ScarcityCard';
import SettlementsCard from './components/SettlementsCard';
import TipsCard from './components/TipsCard';
import BoardLegend from './components/BoardLegend';
import CollapsibleCard from './components/CollapsibleCard';
import { ThemeProvider, useTheme } from './shared/ThemeContext';
import { createGame, createGameFromImage, getGame, cycleSettlement, moveRobber, cloneGame, onApiError } from './api';
import { styles } from './styles/App.styles';
import './responsive.css';

function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <button onClick={toggle} style={styles.themeBtn} title={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
      {dark ? '\u2600\uFE0F' : '\u{1F319}'}
    </button>
  );
}

function AppContent() {
  const [gameId, setGameId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const urlGameId = params.get('game');
    if (urlGameId) return urlGameId;
    return localStorage.getItem('catan_game_id');
  });
  const [boardState, setBoardState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);
  const boardAreaRef = useRef(null);

  const addToast = useCallback((message) => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  // Subscribe to global API errors
  useEffect(() => {
    onApiError((msg) => addToast(msg));
  }, [addToast]);

  // Scroll board to center when zoom changes
  useEffect(() => {
    const el = boardAreaRef.current;
    if (!el) return;
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    el.scrollTop = (el.scrollHeight - el.clientHeight) / 2;
  }, [zoom]);

  const updateUrl = (id) => {
    const url = new URL(window.location);
    if (id) {
      url.searchParams.set('game', id);
    } else {
      url.searchParams.delete('game');
    }
    window.history.replaceState({}, '', url);
  };

  useEffect(() => {
    if (gameId && !boardState) {
      setLoading(true);
      updateUrl(gameId);
      getGame(gameId)
        .then(state => {
          setBoardState(state);
          localStorage.setItem('catan_game_id', gameId);
        })
        .catch((err) => {
          if (err.status === 404 || err.status === 400) {
            localStorage.removeItem('catan_game_id');
            setNotFound(true);
          } else {
            localStorage.removeItem('catan_game_id');
            updateUrl(null);
            setGameId(null);
          }
        })
        .finally(() => setLoading(false));
    }
  // eslint-disable-next-line
  }, []);

  const saveGameId = (id) => {
    setGameId(id);
    localStorage.setItem('catan_game_id', id);
    updateUrl(id);
  };

  const handleCreateGame = async (resources, values, ports) => {
    setLoading(true);
    try {
      const data = await createGame(resources, values, ports);
      saveGameId(data.id);
      const state = await getGame(data.id);
      setBoardState(state);
    } catch { /* toast fires automatically via onApiError */ }
    setLoading(false);
  };

  const handleUploadImage = async (file) => {
    setLoading(true);
    try {
      const data = await createGameFromImage(file);
      saveGameId(data.id);
      const state = await getGame(data.id);
      setBoardState(state);
    } catch { /* toast fires automatically via onApiError */ }
    setLoading(false);
  };

  const handlePositionClick = async (position) => {
    if (!gameId) return;
    try {
      const data = await cycleSettlement(gameId, position);
      setBoardState(data);
    } catch { /* toast fires automatically via onApiError */ }
  };

  const handleTileClick = async (tileIndex) => {
    if (!gameId) return;
    try {
      const data = await moveRobber(gameId, tileIndex);
      setBoardState(data);
    } catch { /* toast fires automatically via onApiError */ }
  };

  const handleNewGame = () => {
    localStorage.removeItem('catan_game_id');
    updateUrl(null);
    setGameId(null);
    setBoardState(null);
    setNotFound(false);
  };

  const handleShare = async () => {
    if (!gameId || copied) return;
    try {
      const data = await cloneGame(gameId);
      const shareUrl = new URL(window.location);
      shareUrl.searchParams.set('game', data.id);
      const url = shareUrl.toString();
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* toast fires automatically via onApiError */ }
  };

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div className="header-inner" style={styles.headerInner}>
          <h1 className="header-title" style={styles.headerTitle}>Catan Companion</h1>
          <div className="header-actions" style={styles.headerActions}>
            {gameId && (
              <>
                <div className="share-wrap" style={styles.shareWrap}>
                  <button onClick={handleShare} style={styles.shareBtn}>
                    {copied ? 'Copied!' : 'Share'}
                    <span style={styles.shareInfo}>?</span>
                  </button>
                  <div className="share-tooltip" style={styles.shareTooltip}>
                    Share the board layout with other players. Creates a fresh copy with the same tiles and ports. Your settlements won't be shared.
                  </div>
                </div>
                <button onClick={handleNewGame} style={styles.newGameBtn}>
                  New Game
                </button>
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {notFound ? (
          <div style={styles.notFoundWrap}>
            <div style={styles.notFoundCard}>
              <div style={styles.notFoundIcon}>&#127922;</div>
              <h2 style={styles.notFoundTitle}>Game Not Found</h2>
              <p style={styles.notFoundText}>
                This game doesn't exist or the link may have expired.
              </p>
              <button onClick={handleNewGame} style={styles.notFoundBtn}>
                Create a New Game
              </button>
            </div>
          </div>
        ) : !gameId ? (
          <SetupForm
            onCreateGame={handleCreateGame}
            onUploadImage={handleUploadImage}
            loading={loading}
          />
        ) : boardState ? (
          <div className="game-layout">
            <div className="board-section">
              <div className="board-area" ref={boardAreaRef}>
                <div style={{ width: `${zoom}%`, margin: '0 auto' }}>
                  <HexBoard
                    tiles={boardState.tiles}
                    positions={boardState.positions}
                    ports={boardState.ports}
                    onPositionClick={handlePositionClick}
                    onTileClick={handleTileClick}
                    rotation={rotation}
                  />
                </div>
              </div>
              <div className="board-toolbar">
                <BoardLegend />
                <div style={styles.toolbarDivider} />
                <button
                  onClick={() => setZoom(z => Math.max(50, z - 10))}
                  style={{ ...styles.toolbarBtn, ...(zoom <= 50 ? styles.toolbarBtnDisabled : {}) }}
                  title="Zoom out"
                  disabled={zoom <= 50}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                </button>
                <button
                  onClick={() => setZoom(z => Math.min(200, z + 10))}
                  style={{ ...styles.toolbarBtn, ...(zoom >= 200 ? styles.toolbarBtnDisabled : {}) }}
                  title="Zoom in"
                  disabled={zoom >= 200}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="11" y1="8" x2="11" y2="14" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                </button>
                <div style={styles.toolbarDivider} />
                <button
                  onClick={() => setRotation((r) => r + 90)}
                  style={styles.toolbarBtn}
                  title="Rotate board 90°"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 4v6h6" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="stats-section">
              {boardState.settlements && Object.keys(boardState.settlements).length > 0 && (
                <CollapsibleCard title="Settlements">
                  <SettlementsCard
                    settlements={boardState.settlements}
                    points={boardState.points}
                  />
                </CollapsibleCard>
              )}
              <div style={{ marginTop: 16 }}>
                <CollapsibleCard title="Tips">
                  <TipsCard
                    statistics={boardState.statistics}
                    ports={boardState.ports}
                    settlements={boardState.settlements}
                    boardScarcity={boardState.board_scarcity}
                    positions={boardState.positions}
                    tiles={boardState.tiles}
                  />
                </CollapsibleCard>
              </div>
              <div style={{ marginTop: 16 }}>
                <CollapsibleCard title="Statistics">
                  <StatsPanel
                    statistics={boardState.statistics}
                    settlements={boardState.settlements}
                  />
                </CollapsibleCard>
              </div>
              <div style={{ marginTop: 16 }}>
                <CollapsibleCard title="Trading Rates">
                  <TradingCard
                    ports={boardState.ports}
                    settlements={boardState.settlements}
                  />
                </CollapsibleCard>
              </div>
              <div style={{ marginTop: 16 }}>
                <CollapsibleCard title="Resource Availability" defaultOpen={false}>
                  <ScarcityCard
                    boardScarcity={boardState.board_scarcity}
                  />
                </CollapsibleCard>
              </div>
            </div>
          </div>
        ) : (
          <div style={styles.loadingWrap}>
            <div style={styles.spinner} />
            <p style={{ color: 'var(--text-muted)', marginTop: 12, fontSize: 14 }}>Loading game...</p>
          </div>
        )}
      </main>

      {/* Toast notifications */}
      {toasts.length > 0 && (
        <div style={styles.toastContainer}>
          {toasts.map(t => (
            <div key={t.id} className="toast-slide-in" style={styles.toast}>
              <span style={styles.toastIcon}>&#x26A0;&#xFE0F;</span>
              <span style={styles.toastMsg}>{t.message}</span>
              <button
                onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                style={styles.toastClose}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <a
            href="https://www.buymeacoffee.com/jeremy2"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.coffeeBtn}
          >
            Buy me a coffee
          </a>
          <a
            href="https://github.com/jeremymaignan/catan-companion"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.githubLink}
            title="View on GitHub"
          >
            <svg style={styles.githubIcon} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
          </a>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

