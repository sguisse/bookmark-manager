import { useTheme } from '../../contexts/ThemeContext';

interface BottomPanelProps {
}

export default function BottomPanel(_props: BottomPanelProps) {
  const { theme } = useTheme();

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
