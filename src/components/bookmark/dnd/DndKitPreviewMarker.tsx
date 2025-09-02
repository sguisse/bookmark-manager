import React from 'react';

export function DndKitPreviewMarker({ top, left, width, effect, count, height }: { top: number; left: number; width: number; effect: 'move' | 'copy'; count: number; height: number }) {
  // The provider now passes an explicit top and height that correspond to the insertion placeholder
  const placeholderStyle: React.CSSProperties = {
    position: 'fixed',
    top: Math.round(top),
    left: Math.round(left),
    width: Math.round(width),
    height: Math.round(height),
    background: effect === 'copy' ? 'rgba(0,123,255,0.06)' : 'rgba(0,0,0,0.04)',
    border: `1px dashed ${effect === 'copy' ? '#007bff' : '#888'}`,
    borderRadius: 6,
    zIndex: 9998,
    pointerEvents: 'none',
    transition: 'top 160ms cubic-bezier(.2,.8,.2,1), left 160ms cubic-bezier(.2,.8,.2,1), opacity 140ms ease'
  };

  const markerStyle: React.CSSProperties = {
    position: 'fixed',
    top: Math.round(top) - 1,
    left: Math.round(left),
    width: Math.round(width),
    height: 2,
    background: effect === 'copy' ? 'rgba(0,123,255,0.95)' : 'rgba(0,0,0,0.9)',
    zIndex: 9999,
    pointerEvents: 'none',
    transition: 'top 160ms cubic-bezier(.2,.8,.2,1), left 160ms cubic-bezier(.2,.8,.2,1), opacity 120ms ease'
  };

  const badgeStyle: React.CSSProperties = {
    position: 'fixed',
    top: Math.round(top) - 22,
    left: Math.round(left) + Math.min(12, Math.round(width) - 28),
    background: '#007bff',
    color: '#fff',
    padding: '2px 6px',
    borderRadius: 10,
    fontSize: 12,
    zIndex: 10000,
    pointerEvents: 'none',
    transition: 'top 160ms ease, left 160ms ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
  };

  // Small count bubble anchored to the right for multi-drag
  const countBubbleStyle: React.CSSProperties = {
    position: 'fixed',
    top: Math.round(top) + Math.round(height / 2) - 10,
    left: Math.round(left) + Math.max(8, Math.round(width) - 36),
    background: '#222',
    color: '#fff',
    width: 20,
    height: 20,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    zIndex: 10001,
    pointerEvents: 'none',
    transition: 'top 160ms ease, left 160ms ease, opacity 120ms ease'
  };

  return (
    <>
      <div style={placeholderStyle} aria-hidden />
      <div style={markerStyle} aria-hidden />
      {count > 1 && <div style={badgeStyle} aria-hidden>{count}</div>}
      {count > 1 && <div style={countBubbleStyle} aria-hidden>{count}</div>}
    </>
  );
}
