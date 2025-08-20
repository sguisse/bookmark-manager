import { useTheme } from '../../contexts/ThemeContext';
import { BookmarkGroup } from '../../types/bookmark';

interface SidebarProps {
  groups: BookmarkGroup[];
  selectedGroupId: string | null;
  onSelectGroup: (id: string | null) => void;
  activeTab: 'bookmarks' | 'groups' | 'settings';
  onTabChange: (tab: 'bookmarks' | 'groups' | 'settings') => void;
}

export default function Sidebar({
  groups,
  selectedGroupId,
  onSelectGroup,
  activeTab,
  onTabChange
}: SidebarProps) {
  const { theme } = useTheme();

  const tabs = [
    {
      id: 'bookmarks' as const,
      label: 'Bookmarks',
      icon: '📚',
      description: 'View and manage bookmarks'
    },
    {
      id: 'groups' as const,
      label: 'Groups',
      icon: '📁',
      description: 'Create and manage groups'
    },
    {
      id: 'settings' as const,
      label: 'Layout',
      icon: '⚙️',
      description: 'Configure dashboard layout'
    }
  ];

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.colors.sidebarBackground,
        color: theme.colors.text.primary,
        fontFamily: theme.fonts.family
      }}
    >
      {/* Tab Navigation */}
      <div style={{ padding: '1rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <h3
            style={{
              margin: 0,
              fontSize: theme.fonts.sizes.medium,
              fontWeight: 600,
              color: theme.colors.text.primary
            }}
          >
            Dashboard
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: activeTab === tab.id ? theme.colors.primary : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : theme.colors.text.primary,
                fontSize: theme.fonts.sizes.medium,
                fontFamily: theme.fonts.family,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.backgroundColor = theme.colors.surface;
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>{tab.icon}</span>
              <div>
                <div style={{ fontWeight: 500 }}>{tab.label}</div>
                <div
                  style={{
                    fontSize: theme.fonts.sizes.small,
                    opacity: 0.7,
                    marginTop: '2px'
                  }}
                >
                  {tab.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Groups Section (shown only in bookmarks tab) */}
      {activeTab === 'bookmarks' && (
        <>
          <div
            style={{
              height: '1px',
              backgroundColor: theme.colors.border,
              margin: '0 1rem'
            }}
          />

          <div style={{ flex: 1, padding: '1rem', overflow: 'auto' }}>
            <div style={{ marginBottom: '1rem' }}>
              <h4
                style={{
                  margin: 0,
                  fontSize: theme.fonts.sizes.small,
                  fontWeight: 600,
                  color: theme.colors.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                Groups ({groups.length})
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {groups.map(group => (
                <button
                  key={group.id}
                  onClick={() => onSelectGroup(group.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: selectedGroupId === group.id ? theme.colors.surface : 'transparent',
                    color: theme.colors.text.primary,
                    fontSize: theme.fonts.sizes.medium,
                    fontFamily: theme.fonts.family,
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedGroupId !== group.id) {
                      e.currentTarget.style.backgroundColor = theme.colors.surface;
                      e.currentTarget.style.opacity = '0.8';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedGroupId !== group.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.opacity = '1';
                    }
                  }}
                >
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: group.color,
                      flexShrink: 0
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: selectedGroupId === group.id ? 600 : 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {group.title}
                    </div>
                    <div
                      style={{
                        fontSize: theme.fonts.sizes.small,
                        color: theme.colors.text.secondary,
                        marginTop: '2px'
                      }}
                    >
                      {group.bookmarks.length} items
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {groups.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '2rem 1rem',
                  color: theme.colors.text.secondary,
                  fontSize: theme.fonts.sizes.small
                }}
              >
                <div style={{ marginBottom: '0.5rem', fontSize: '2rem', opacity: 0.5 }}>📁</div>
                <div>No groups yet</div>
                <div>Create a group to get started</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
