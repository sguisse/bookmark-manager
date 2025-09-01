import React from 'react';

export function DndKitPreviewMarker({ top, left, width, effect, count }: { top: number; left: number; width: number; effect: 'move' | 'copy'; count: number }) {
  const markerStyle: React.CSSProperties = {
    position: 'fixed',
    top: Math.round(top) - 1,
    left: Math.round(left),
    width: Math.round(width),
    height: 2,
    background: effect === 'copy' ? 'rgba(0,123,255,0.9)' : 'rgba(0,0,0,0.8)',
    zIndex: 9999,
    pointerEvents: 'none'
  };
  const badgeStyle: React.CSSProperties = {
    position: 'fixed',
    top: Math.round(top) - 18,
    left: Math.round(left) + 8,
    background: '#007bff',
    color: '#fff',
    padding: '2px 6px',
    borderRadius: 10,
    fontSize: 12,
    zIndex: 10000,
    pointerEvents: 'none'
  };
  return (
    <>
      <div style={markerStyle} aria-hidden />
      {count > 1 && <div style={badgeStyle} aria-hidden>{count}</div>}
    </>
  );
}
