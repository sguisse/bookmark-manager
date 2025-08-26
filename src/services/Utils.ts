// Shared utilities for the app

// Small helper to format Date or ISO string to dd/MM/yyyy HH:mm:ss
export function formatDate(d?: Date | string | null): string {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => ('0' + String(n)).slice(-2);
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// Normalize color strings for HTML color inputs. Accepts '#rrggbb', 'rrggbb', or 'rgb' shorthand and returns a string
export function normalizeColorForInput(c?: string): string {
  if (!c) return '';
  const s = String(c).trim();
  if (s.startsWith('#')) return s;
  if (/^[0-9a-fA-F]{3}$/.test(s) || /^[0-9a-fA-F]{6}$/.test(s)) return `#${s}`;
  return s;
}

// Convert hex color to rgba string. Accepts '#rgb', 'rgb', '#rrggbb' and returns rgba(r,g,b,a)
export function hexToRgba(hex?: string, alpha = 0.12): string {
  if (!hex) return `rgba(0,0,0,${alpha})`;
  const clean = String(hex).replace('#', '');
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
  const bigint = parseInt(full, 16);
  if (Number.isNaN(bigint)) return `rgba(0,0,0,${alpha})`;
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// small helpers used by UI components
export const readableTextColor = (bg: string) => {
  const hex = (bg || '').replace('#', '');
  const normalized = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex;
  const bigint = parseInt(normalized || '000000', 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  const l = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return l > 0.6 ? '#000' : '#fff';
};

// Measure how many characters fit into `width` (px) with given CSS font string.
export function calculateVisibleCharacters(text: string, width: number, font: string, ellipsis = '...'): number {
  if (!text || width <= 0) return 0;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return Math.max(0, Math.min(text.length, 40));
  ctx.font = font;

  // First check if the full text fits without ellipsis
  const fullTextWidth = ctx.measureText(text).width;
  if (fullTextWidth <= width) {
    return text.length;
  }

  // Measure ellipsis width once
  const ellipsisWidth = ctx.measureText(ellipsis).width;

  // Adjust available width by subtracting ellipsis width
  const availableWidth = width - ellipsisWidth;

  if (availableWidth <= 0) {
    return 0;
  }

  let low = 0;
  let high = text.length;
  let best = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const substr = text.slice(0, mid);
    const measured = ctx.measureText(substr).width;
    if (measured <= availableWidth) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return best;
}

export default { formatDate, normalizeColorForInput, hexToRgba, readableTextColor, calculateVisibleCharacters };
