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

export default { formatDate, normalizeColorForInput, hexToRgba };
