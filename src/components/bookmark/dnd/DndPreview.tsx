import React from 'react';
import type { DndState } from './useDndKitBookmarks';

export default function DndPreview({ dndState }: { dndState: DndState }) {
  const { previewIndex, effect } = dndState;
  if (previewIndex === null) return null;

  const style: React.CSSProperties = {
    position: 'absolute',
    height: 2,
    background: effect === 'copy' ? 'rgba(0,123,255,0.9)' : 'rgba(0,0,0,0.8)'
  };

  return <div style={style} aria-hidden />;
}
