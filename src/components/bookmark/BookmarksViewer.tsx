import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Bookmark } from '../../types/bookmark';
import { formatDate } from '../../services/Utils';
import { Edit, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

/*
 * BookmarksViewer Structure:
 *
 * Each line in the bookmark list is a BookmarkTableRow, which can display:
 * - RowView: Compact view showing icon, title, and action buttons
 * - CardView: Expanded view showing full details, description, tags, dates
 *
 * The user can toggle between these views within each table row.
 */

type TableRowViewMode = 'row' | 'card';

interface BookmarkTableRowProps {
  bookmark: Bookmark;
  view?: TableRowViewMode; // 'row' (default) or 'card'
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmarkId: string) => void;
  onToggleCollapsed: (bookmarkId: string) => void; // New callback for toggling individual bookmark collapsed state
}

// Helper function to truncate title if longer than 50 characters
function truncateTitle(title: string, maxLength: number = 50): string {
  if (title.length <= maxLength) {
    return title;
  }
  return title.substring(0, maxLength) + '...';
}

// Tooltip component with 1-second delay
function DelayedTooltip({
  children,
  title,
  url,
  delay = 1000
}: {
  children: React.ReactNode;
  title: string;
  url: string;
  delay?: number;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });

    timeoutRef.current = window.setTimeout(() => {
      setShowTooltip(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setShowTooltip(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: 'inherit' }}
      >
        {children}
      </div>
      {showTooltip && (
        <div
          style={{
            position: 'fixed',
            left: position.x,
            top: position.y,
            transform: 'translateX(-50%) translateY(-100%)',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            lineHeight: '1.4',
            maxWidth: '300px',
            wordWrap: 'break-word',
            zIndex: 1000,
            pointerEvents: 'none',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
          }}
        >
          <div style={{ fontWeight: '600', marginBottom: '4px' }}>{title}</div>
          <div style={{ opacity: 0.8, fontSize: '11px' }}>{url}</div>
        </div>
      )}
    </div>
  );
}

// helper to render an icon element (emoji/text or image). Keeps JSX readable and avoids nested ternaries.
function renderIconElement(src: string | undefined, size: number) {
  if (!src) return <span style={{ fontSize: Math.max(16, size - 4), opacity: 0.55 }}>🌐</span>;
  if (!(src.startsWith('http') || src.startsWith('data:'))) {
    return <span style={{ fontSize: size }}>{src}</span>;
  }
  return <img src={src} alt="icon" style={{ width: size, height: size, objectFit: 'cover', borderRadius: Math.max(4, Math.floor(size / 6)) }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />;
}


// Card view component (expanded view within a table row)
function CardView(props: Readonly<{ bookmark: Bookmark; onEdit: (b: Bookmark) => void; onDelete: (id: string) => void; onOpen: (url: string) => void; onCollapse?: () => void; theme: any; }>) {
  const { bookmark, onEdit, onDelete, onOpen, onCollapse, theme } = props;
  const [isHovered, setIsHovered] = useState(false);

  const handleEditClick = (e: React.MouseEvent) => { e.stopPropagation(); onEdit(bookmark); };
  const handleDeleteClick = (e: React.MouseEvent) => { e.stopPropagation(); onDelete(bookmark.id); };

  return (
    <button
      type="button"
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { onOpen(bookmark.url); } }}
      style={{
        backgroundColor: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
  borderRadius: '8px',
  padding: '5px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 8px 25px rgba(0, 0, 0, 0.1)' : '0 2px 4px rgba(0, 0, 0, 0.05)',
        position: 'relative',
        textAlign: 'left',
        width: '100%',
        borderStyle: 'solid'
      }}
      onClick={() => onOpen(bookmark.url)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >

      {/* header: icon + title on the left, actions on the right (vertically centered) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {renderIconElement(bookmark.icon, 20)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <DelayedTooltip
              title={bookmark.title}
              url={bookmark.url}
            >
              <h3
                style={{
                  ...titleStyle(theme),
                  whiteSpace: 'normal',
                  margin: 0,
                  paddingLeft: '5px',
                  color: bookmark.color || theme.colors.text.primary
                }}
              >
                {truncateTitle(bookmark.title)}
              </h3>
            </DelayedTooltip>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', opacity: isHovered ? 1 : 0, transition: 'opacity 0.18s ease' }}>
          {onCollapse && (
            <button onClick={(e) => { e.stopPropagation(); onCollapse(); }} title="Collapse to row view" style={actionButtonStyle(theme.colors.info)}>
              <ChevronUp size={16} />
            </button>
          )}
          <button onClick={handleEditClick} title="Edit bookmark" style={actionButtonStyle(theme.colors.info)}>
            <Edit size={16} />
          </button>
          <button onClick={handleDeleteClick} title="Delete bookmark" style={actionButtonStyle(theme.colors.error)}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div style={{ paddingRight: '0px' }}>
        {/* show URL first, then description */}
        <div style={{ ...urlStyle(theme) }} title={bookmark.url}>{bookmark.url}</div>
        {bookmark.description && <p style={descriptionStyle(theme)} title={bookmark.description}>{bookmark.description}</p>}

        {bookmark.tags && bookmark.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.5rem' }}>
            {bookmark.tags.slice(0, 3).map((tag) => (
              <span key={tag} style={tagPillStyle(theme)}>{tag}</span>
            ))}
            {bookmark.tags.length > 3 && <span style={{ ...tagPillStyle(theme), backgroundColor: theme.colors.text.secondary }}>+{bookmark.tags.length - 3}</span>}
          </div>
        )}

        {/* creation and last modified aligned */}
        <div style={{ marginTop: 'auto', fontSize: theme.fonts.sizes.small, color: theme.colors.text.secondary }}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', columnGap: '0.5rem', rowGap: '0.25rem', alignItems: 'center' }}>
            <div style={{ color: theme.colors.text.secondary }}>Creation date :</div>
            <div style={{ color: theme.colors.text.primary }}>{formatDate(bookmark.createdDate)}</div>
            <div style={{ color: theme.colors.text.secondary }}>Last modified :</div>
            <div style={{ color: theme.colors.text.primary }}>{formatDate(bookmark.lastModifiedDate)}</div>
          </div>
          {/* category is not part of Bookmark type; skip showing it here */}
        </div>
      </div>
    </button>
  );
}

// Row view component (compact view within a table row)
function RowView(props: Readonly<{ bookmark: Bookmark; onEdit: (b: Bookmark) => void; onDelete: (id: string) => void; onToggleExpand: () => void; expanded: boolean; theme: any; onOpen: (url: string) => void }>) {
  const { bookmark, onEdit, onDelete, onToggleExpand, expanded, theme, onOpen } = props;
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div
      className="bookmark-row-view"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, flex: 1 }}>
        <div style={{ width: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {renderIconElement(bookmark.icon, 16)}
        </div>
        <div style={{ flex: 1 }}>
          <DelayedTooltip
            title={bookmark.title}
            url={bookmark.url}
          >
            <button
              className="bookmark-title"
              onClick={(e) => { e.stopPropagation(); onOpen(bookmark.url); }}
              style={{ color: bookmark.color || theme.colors.text.primary }}
            >
              {truncateTitle(bookmark.title)}
            </button>
          </DelayedTooltip>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 1, alignItems: 'center', opacity: isHovered ? 1 : 0, transition: 'opacity 120ms ease', pointerEvents: isHovered ? 'auto' : 'none' }}>
        <button onClick={(e) => { e.stopPropagation(); onToggleExpand(); }} title={expanded ? 'Collapse' : 'Expand'} style={smallIconButtonStyle(theme)}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        <button onClick={(e) => { e.stopPropagation(); onEdit(bookmark); }} title="Edit" style={smallIconButtonStyle(theme)}>
          <Edit size={16} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(bookmark.id); }} title="Delete" style={smallIconButtonStyle(theme)}>
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

// Each BookmarkTableRow can display either a RowView (compact) or CardView (expanded)
export default function BookmarkTableRow(props: Readonly<BookmarkTableRowProps>) {
  const { bookmark, onEdit, onDelete, onToggleCollapsed, view = 'row' } = props;
  const { theme } = useTheme();

  const openUrl = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

  // Use bookmark.collapsed to determine if expanded (collapsed=false means expanded in card view)
  const isCollapsed = bookmark.collapsed ?? true; // Default to collapsed (row view)

  return (
    <div>
      {view === 'card' ? (
        <CardView bookmark={bookmark} onEdit={onEdit} onDelete={onDelete} onOpen={openUrl} theme={theme} />
      ) : (
        <>
          {!isCollapsed ? (
            <CardView bookmark={bookmark} onEdit={onEdit} onDelete={onDelete} onOpen={openUrl} onCollapse={() => onToggleCollapsed(bookmark.id)} theme={theme} />
          ) : (
            <RowView
              bookmark={bookmark}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleExpand={() => onToggleCollapsed(bookmark.id)}
              expanded={!isCollapsed}
              theme={theme}
              onOpen={openUrl}
            />
          )}
        </>
      )}
    </div>
  );
}

// Small style helpers
const actionButtonStyle = (bg: string) => ({
  width: '28px',
  height: '28px',
  border: 'none',
  borderRadius: '4px',
  backgroundColor: bg,
  color: '#ffffff',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
  transition: 'all 0.2s ease'
} as React.CSSProperties);

const smallIconButtonStyle = (theme: any) => ({
  width: 36,
  height: 28,
  border: 'none',
  borderRadius: 6,
  backgroundColor: theme.colors.surface,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
} as React.CSSProperties);

const titleStyle = (theme: any) => ({
  margin: '0 0 0.5rem 0',
  fontSize: theme.fonts.sizes.medium,
  fontWeight: 600,
  color: theme.colors.text.primary,
  lineHeight: '1.4',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
} as React.CSSProperties);

const descriptionStyle = (theme: any) => ({
  margin: '0 0 0.75rem 0',
  fontSize: theme.fonts.sizes.small,
  color: theme.colors.text.secondary,
  lineHeight: '1.4',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden'
} as React.CSSProperties);

const urlStyle = (theme: any) => ({
  fontSize: theme.fonts.sizes.small,
  color: theme.colors.primary,
  textDecoration: 'none',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  marginBottom: '0.75rem'
} as React.CSSProperties);

const tagPillStyle = (theme: any) => ({
  display: 'inline-block',
  padding: '0.125rem 0.5rem',
  fontSize: '0.75rem',
  backgroundColor: theme.colors.primary,
  color: '#ffffff',
  borderRadius: '12px',
  fontWeight: 500
} as React.CSSProperties);
