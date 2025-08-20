import { useTheme } from '../../contexts/ThemeContext';

interface BottomPanelProps {
}

export default function BottomPanel(props: BottomPanelProps) {
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
              backgroundColor: theme.colors.success
            }}
          />
          <span>Last saved: todo</span>
        </div>
      </div>

      {/* Right side - Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        Actions
      </div>
    </div>
  );
}
