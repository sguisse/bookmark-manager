import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Bookmark } from '../../types/bookmark';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmarkId: string) => void;
}

export default function BookmarkCard({ bookmark, onEdit, onDelete }: BookmarkCardProps) {
  const { theme } = useTheme();
  const [isImageError, setIsImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleCardClick = () => {
    window.open(bookmark.url, '_blank', 'noopener,noreferrer');
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(bookmark);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(bookmark.id);
  };

  return (
    <div
      style={{
        backgroundColor: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: '8px',
        padding: '1rem',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered
          ? '0 8px 25px rgba(0, 0, 0, 0.1)'
          : '0 2px 4px rgba(0, 0, 0, 0.05)',
        position: 'relative'
      }}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Action Buttons */}
      <div
        style={{
          position: 'absolute',
          top: '0.5rem',
          right: '0.5rem',
          display: 'flex',
          gap: '0.25rem',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.2s ease'
        }}
      >
        <button
          onClick={handleEditClick}
          style={{
            width: '28px',
            height: '28px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: theme.colors.info,
            color: '#ffffff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            transition: 'all 0.2s ease'
          }}
          title="Edit bookmark"
        >
          ✏️
        </button>
        <button
          onClick={handleDeleteClick}
          style={{
            width: '28px',
            height: '28px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: theme.colors.error,
            color: '#ffffff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            transition: 'all 0.2s ease'
          }}
          title="Delete bookmark"
        >
          🗑️
        </button>
      </div>

      {/* Favicon */}
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          backgroundColor: theme.colors.background,
          border: `1px solid ${theme.colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
          overflow: 'hidden'
        }}
      >
        {bookmark.favicon && !isImageError ? (
          <img
            src={bookmark.favicon}
            alt=""
            style={{
              width: '24px',
              height: '24px',
              objectFit: 'cover'
            }}
            onError={() => setIsImageError(true)}
          />
        ) : (
          <span style={{ fontSize: '20px', opacity: 0.5 }}>🔗</span>
        )}
      </div>

      {/* Content */}
      <div style={{ paddingRight: '2rem' }}>
        {/* Title */}
        <h3
          style={{
            margin: '0 0 0.5rem 0',
            fontSize: theme.fonts.sizes.medium,
            fontWeight: 600,
            color: theme.colors.text.primary,
            lineHeight: '1.4',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
          title={bookmark.title}
        >
          {bookmark.title}
        </h3>

        {/* Description */}
        {bookmark.description && (
          <p
            style={{
              margin: '0 0 0.75rem 0',
              fontSize: theme.fonts.sizes.small,
              color: theme.colors.text.secondary,
              lineHeight: '1.4',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
            title={bookmark.description}
          >
            {bookmark.description}
          </p>
        )}

        {/* URL */}
        <div
          style={{
            fontSize: theme.fonts.sizes.small,
            color: theme.colors.primary,
            textDecoration: 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginBottom: '0.75rem'
          }}
          title={bookmark.url}
        >
          {bookmark.url}
        </div>

        {/* Tags */}
        {bookmark.tags && bookmark.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.5rem' }}>
            {bookmark.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                style={{
                  display: 'inline-block',
                  padding: '0.125rem 0.5rem',
                  fontSize: '0.75rem',
                  backgroundColor: theme.colors.primary,
                  color: '#ffffff',
                  borderRadius: '12px',
                  fontWeight: 500
                }}
              >
                {tag}
              </span>
            ))}
            {bookmark.tags.length > 3 && (
              <span
                style={{
                  display: 'inline-block',
                  padding: '0.125rem 0.5rem',
                  fontSize: '0.75rem',
                  backgroundColor: theme.colors.text.secondary,
                  color: '#ffffff',
                  borderRadius: '12px',
                  fontWeight: 500
                }}
              >
                +{bookmark.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: theme.fonts.sizes.small,
            color: theme.colors.text.secondary,
            marginTop: 'auto'
          }}
        >
          <span>
            {new Date(bookmark.createdAt).toLocaleDateString()}
          </span>
          {bookmark.category && (
            <span
              style={{
                padding: '0.125rem 0.5rem',
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '4px',
                fontSize: '0.75rem'
              }}
            >
              {bookmark.category}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
