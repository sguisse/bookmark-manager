import React from 'react';
import * as LucideIcons from 'lucide-react';

export interface ImageProps {
  value?: string | null;
  size?: number;
  rounded?: boolean;
  className?: string;
  alt?: string;
  style?: React.CSSProperties;
}

const isEmoji = (s?: string) => {
  if (!s) return false;
  return /\p{Extended_Pictographic}/u.test(s);
};

const isImageUrl = (s?: string) => {
  if (!s) return false;
  const trimmed = s.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('data:')) return true;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) return true;
  if (/\.(jpeg|jpg|gif|png|svg|webp|bmp)(\?.*)?$/i.test(trimmed)) return true;
  return false;
};

const findLucideComponent = (name?: string) => {
  if (!name) return null;
  const normalized = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  for (const k of Object.keys(LucideIcons)) {
    if (k.toLowerCase() === normalized) return (LucideIcons as any)[k];
  }
  return (LucideIcons as any)[name as any] || null;
};

export default function Image({ value, size = 20, rounded = true, className, alt, style }: ImageProps) {
  const v = value || '';

  if (!v) return <div style={{ width: size, height: size }} className={className} />;

  if (isImageUrl(v)) {
    return (
      <img
        src={v}
        alt={alt || 'icon'}
        style={{ width: size, height: size, objectFit: 'cover', borderRadius: rounded ? 6 : 0, display: 'inline-block', ...style }}
        className={className}
      />
    );
  }

  if (isEmoji(v)) {
    return (
      <span style={{ fontSize: size - 2, lineHeight: 1, display: 'inline-block', width: size, height: size, textAlign: 'center', ...style }} className={className}>
        {v}
      </span>
    );
  }

  const C = findLucideComponent(v);
  if (C) return <C size={size} style={style} className={className} />;

  return <div style={{ width: size, height: size }} className={className} />;
}
