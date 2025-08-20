import { useTheme } from '../../contexts/ThemeContext';

interface BottomPanelProps {
  onExport: () => void;
  onImport: () => void;
  onClearCache: () => void;
  lastSaved: Date | null;
  onThemeToggle: () => void;
}

export default function BottomPanel({
  onExport,
  onImport,
  onClearCache,
  lastSaved,
  onThemeToggle
}: BottomPanelProps) {
  const { theme } = useTheme();

  const formatLastSaved = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const buttonStyle = {
    padding: '0.5rem 0.75rem',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '4px',
    backgroundColor: theme.colors.surface,
    color: theme.colors.text.primary,
    fontSize: theme.fonts.sizes.small,
    fontFamily: theme.fonts.family,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1rem',
        backgroundColor: theme.colors.footerBackground,
        borderTop: `1px solid ${theme.colors.border}`,
        color: theme.colors.text.secondary,
        fontSize: theme.fonts.sizes.small,
        fontFamily: theme.fonts.family
      }}
    >
      {/* Left side - Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: lastSaved ? theme.colors.success : theme.colors.warning
            }}
          />
          <span>Last saved: {formatLastSaved(lastSaved)}</span>
        </div>
      </div>

      {/* Right side - Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          onClick={onThemeToggle}
          style={{
            ...buttonStyle,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.primary;
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.surface;
            e.currentTarget.style.color = theme.colors.text.primary;
          }}
        >
          <span>{theme.name === 'light' ? '🌙' : '☀️'}</span>
          {theme.name === 'light' ? 'Dark' : 'Light'}
        </button>

        <button
          onClick={onImport}
          style={buttonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.info;
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.surface;
            e.currentTarget.style.color = theme.colors.text.primary;
          }}
        >
          📥 Import
        </button>

        <button
          onClick={onExport}
          style={buttonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.success;
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.surface;
            e.currentTarget.style.color = theme.colors.text.primary;
          }}
        >
          📤 Export
        </button>

        <button
          onClick={onClearCache}
          style={buttonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.error;
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.surface;
            e.currentTarget.style.color = theme.colors.text.primary;
          }}
        >
          🗑️ Clear
        </button>
      </div>
    </div>
  );
}
