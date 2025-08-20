import { useTheme } from '../../contexts/ThemeContext';
import { BookmarkGroup } from '../../types/bookmark';

interface HeaderPanelProps {
  activeTab: 'bookmarks' | 'groups' | 'settings';
  selectedGroup?: BookmarkGroup;
}

export default function HeaderPanel({ activeTab, selectedGroup }: HeaderPanelProps) {
  const { theme } = useTheme();

  const getHeaderContent = () => {
    switch (activeTab) {
      case 'bookmarks':
        if (selectedGroup) {
          return {
            title: selectedGroup.title,
            subtitle: `${selectedGroup.bookmarks.length} bookmarks`,
            color: selectedGroup.color
          };
        }
        return {
          title: 'Bookmarks',
          subtitle: 'Select a group to view bookmarks',
          color: theme.colors.primary
        };

      case 'groups':
        return {
          title: 'Group Management',
          subtitle: 'Create and manage bookmark groups',
          color: theme.colors.secondary
        };

      case 'settings':
        return {
          title: 'Layout Settings',
          subtitle: 'Configure dashboard layout',
          color: theme.colors.info
        };

      default:
        return {
          title: 'Dashboard',
          subtitle: '',
          color: theme.colors.primary
        };
    }
  };

  const content = getHeaderContent();

  return (
    <header
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        padding: '0 1.5rem',
        backgroundColor: theme.colors.headerBackground,
        borderBottom: `1px solid ${theme.colors.border}`,
        color: theme.colors.text.primary
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Icon/Indicator */}
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: content.color,
            flexShrink: 0
          }}
        />

        {/* Title and Subtitle */}
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: theme.fonts.sizes.large,
              fontWeight: 600,
              color: theme.colors.text.primary,
              fontFamily: theme.fonts.family
            }}
          >
            {content.title}
          </h1>
          {content.subtitle && (
            <p
              style={{
                margin: 0,
                fontSize: theme.fonts.sizes.small,
                color: theme.colors.text.secondary,
                fontFamily: theme.fonts.family
              }}
            >
              {content.subtitle}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
