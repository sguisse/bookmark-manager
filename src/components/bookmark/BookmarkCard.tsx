import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Bookmark } from '../../types/bookmark';

type ViewMode = 'card' | 'table';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmarkId: string) => void;
  view?: ViewMode; // 'card' (default) or 'table'
}

// Stateless favicon component moved out to satisfy lint rules
function Favicon(props: Readonly<{ src?: string; size?: number; onError?: () => void }>) {
  const { src, size = 24, onError } = props;
  const [errored, setErrored] = useState(false);
  const handleError = () => {
    setErrored(true);
    onError && onError();
  };
  return (
    <div
      style={{
        width: `${Math.max(32, size + 16)}px`,
        height: `${Math.max(32, size + 16)}px`,
        borderRadius: '8px',
        backgroundColor: 'transparent',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}
    >
      {src && !errored ? (
        <img src={src} alt="" style={{ width: size, height: size, objectFit: 'cover' }} onError={handleError} />
      ) : (
        <span style={{ fontSize: Math.max(16, size - 4), opacity: 0.55 }}>🔗</span>
      )}
    </div>
  );
}

// Card view component moved out; accepts props rather than closing over parent scope
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
        padding: '1rem',
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
      <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.25rem', opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s ease' }}>
        {onCollapse && (
          <button onClick={(e) => { e.stopPropagation(); onCollapse(); }} title="Collapse to row" style={actionButtonStyle(theme.colors.surface)}>🔺</button>
        )}
        <button onClick={handleEditClick} title="Edit bookmark" style={actionButtonStyle(theme.colors.info)}>✏️</button>
        <button onClick={handleDeleteClick} title="Delete bookmark" style={actionButtonStyle(theme.colors.error)}>🗑️</button>
      </div>

        <div style={{ width: '40px', height: '40px', marginBottom: '1rem' }}>
          <Favicon src={bookmark.favicon} size={24} />
        </div>

      <div style={{ paddingRight: '2rem' }}>
        <h3 style={titleStyle(theme)} title={bookmark.title}>{bookmark.title}</h3>
        {bookmark.description && <p style={descriptionStyle(theme)} title={bookmark.description}>{bookmark.description}</p>}
        <div style={{ ...urlStyle(theme) }} title={bookmark.url}>{bookmark.url}</div>

        {bookmark.tags && bookmark.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.5rem' }}>
            {bookmark.tags.slice(0, 3).map((tag) => (
              <span key={tag} style={tagPillStyle(theme)}>{tag}</span>
            ))}
            {bookmark.tags.length > 3 && <span style={{ ...tagPillStyle(theme), backgroundColor: theme.colors.text.secondary }}>+{bookmark.tags.length - 3}</span>}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', fontSize: theme.fonts.sizes.small, color: theme.colors.text.secondary }}>
          <span>{new Date(bookmark.createdAt).toLocaleDateString()}</span>
          {bookmark.category && <span style={categoryStyle(theme)}>{bookmark.category}</span>}
        </div>
      </div>
    </button>
  );
}

// Table row view moved out
function TableRowView(props: Readonly<{ bookmark: Bookmark; onEdit: (b: Bookmark) => void; onDelete: (id: string) => void; onToggleExpand: () => void; expanded: boolean; theme: any; }>) {
  const { bookmark, onEdit, onDelete, onToggleExpand, expanded, theme } = props;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
        <div style={{ width: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Favicon src={bookmark.favicon} size={18} />
        </div>
        <div style={{ flex: 1 }}>
          <div title={bookmark.description || ''} style={{ fontWeight: 600, color: theme.colors.text.primary }}>{bookmark.title}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={(e) => { e.stopPropagation(); onToggleExpand(); }} title={expanded ? 'Collapse' : 'Expand'} style={smallIconButtonStyle(theme)}>
          {expanded ? '▴' : '▾'}
        </button>
        <button onClick={(e) => { e.stopPropagation(); onEdit(bookmark); }} title="Edit" style={smallIconButtonStyle(theme)}>✏️</button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(bookmark.id); }} title="Delete" style={smallIconButtonStyle(theme)}>🗑️</button>
      </div>
    </div>
  );
}

export default function BookmarkCard(props: Readonly<BookmarkCardProps>) {
  const { bookmark, onEdit, onDelete, view = 'table' } = props;
  const { theme } = useTheme();
  const [expandedInRow, setExpandedInRow] = useState(false);

  const openUrl = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

  return (
    <div>
      {view === 'card' ? (
        <CardView bookmark={bookmark} onEdit={onEdit} onDelete={onDelete} onOpen={openUrl} theme={theme} />
      ) : (
        <>
          {expandedInRow ? (
            <CardView bookmark={bookmark} onEdit={onEdit} onDelete={onDelete} onOpen={openUrl} onCollapse={() => setExpandedInRow(false)} theme={theme} />
          ) : (
            <TableRowView bookmark={bookmark} onEdit={onEdit} onDelete={onDelete} onToggleExpand={() => setExpandedInRow(v => !v)} expanded={expandedInRow} theme={theme} />
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

const categoryStyle = (theme: any) => ({
  padding: '0.125rem 0.5rem',
  backgroundColor: theme.colors.surface,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: '4px',
  fontSize: '0.75rem'
} as React.CSSProperties);
