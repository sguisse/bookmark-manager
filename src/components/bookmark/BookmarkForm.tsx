import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Bookmark, BookmarkInput } from '../../types/bookmark';

interface BookmarkFormProps {
  bookmark?: Bookmark | null;
  onSubmit: (bookmarkData: BookmarkInput) => void;
  onCancel: () => void;
}

export default function BookmarkForm(props: Readonly<BookmarkFormProps>) {
  const { bookmark, onSubmit, onCancel } = props;
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    tags: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (bookmark) {
      setFormData({
        title: bookmark.title || '',
        url: bookmark.url || '',
        description: bookmark.description || '',
        tags: bookmark.tags?.join(', ') || ''
      });
    }
  }, [bookmark]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.url.trim()) {
      newErrors.url = 'URL is required';
    } else {
      try {
        new URL(formData.url);
      } catch {
        newErrors.url = 'Please enter a valid URL';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const bookmarkData = {
      title: formData.title.trim(),
      url: formData.url.trim(),
      description: formData.description.trim() || undefined,
      tags: formData.tags
        ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : undefined
    };

    onSubmit(bookmarkData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '6px',
    backgroundColor: theme.colors.background,
    color: theme.colors.text.primary,
    fontSize: theme.fonts.sizes.medium,
    fontFamily: theme.fonts.family,
    outline: 'none',
    transition: 'border-color 0.2s ease'
  };

  const errorInputStyle = {
    ...inputStyle,
    borderColor: theme.colors.error
  };

  return (
    <div>
      <h2
        style={{
          margin: '0 0 1.5rem 0',
          fontSize: theme.fonts.sizes.large,
          fontWeight: 600,
          color: theme.colors.text.primary
        }}
      >
        {bookmark ? 'Edit Bookmark' : 'Add New Bookmark'}
      </h2>

      <form onSubmit={handleSubmit}>
        {/* Title Field */}
        <div style={{ marginBottom: '1rem' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: theme.fonts.sizes.small,
              fontWeight: 500,
              color: theme.colors.text.primary
            }}
            htmlFor="bookmark-title"
          >
            Title *
          </label>
          <input
            id="bookmark-title"
            type="text"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            style={errors.title ? errorInputStyle : inputStyle}
            placeholder="Enter bookmark title"
            autoFocus
          />
          {errors.title && (
            <div
              style={{
                marginTop: '0.25rem',
                fontSize: theme.fonts.sizes.small,
                color: theme.colors.error
              }}
            >
              {errors.title}
            </div>
          )}
        </div>

        {/* URL Field */}
        <div style={{ marginBottom: '1rem' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: theme.fonts.sizes.small,
              fontWeight: 500,
              color: theme.colors.text.primary
            }}
            htmlFor="bookmark-url"
          >
            URL *
          </label>
          <input
            id="bookmark-url"
            type="url"
            value={formData.url}
            onChange={(e) => handleChange('url', e.target.value)}
            style={errors.url ? errorInputStyle : inputStyle}
            placeholder="https://example.com"
          />
          {errors.url && (
            <div
              style={{
                marginTop: '0.25rem',
                fontSize: theme.fonts.sizes.small,
                color: theme.colors.error
              }}
            >
              {errors.url}
            </div>
          )}
        </div>

        {/* Description Field */}
        <div style={{ marginBottom: '1rem' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: theme.fonts.sizes.small,
              fontWeight: 500,
              color: theme.colors.text.primary
            }}
            htmlFor="bookmark-description"
          >
            Description
          </label>
          <textarea
            id="bookmark-description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            style={{
              ...inputStyle,
              minHeight: '80px',
              resize: 'vertical'
            }}
            placeholder="Optional description"
            rows={3}
          />
        </div>

        {/* Tags Field */}
        <div style={{ marginBottom: '2rem' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: theme.fonts.sizes.small,
              fontWeight: 500,
              color: theme.colors.text.primary
            }}
            htmlFor="bookmark-tags"
          >
            Tags
          </label>
          <input
            id="bookmark-tags"
            type="text"
            value={formData.tags}
            onChange={(e) => handleChange('tags', e.target.value)}
            style={inputStyle}
            placeholder="Enter tags separated by commas"
          />
          <div
            style={{
              marginTop: '0.25rem',
              fontSize: theme.fonts.sizes.small,
              color: theme.colors.text.secondary
            }}
          >
            Separate multiple tags with commas (e.g., work, documentation, reference)
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end'
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '0.75rem 1.5rem',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '6px',
              backgroundColor: 'transparent',
              color: theme.colors.text.primary,
              fontSize: theme.fonts.sizes.medium,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.surface;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: theme.colors.primary,
              color: '#ffffff',
              fontSize: theme.fonts.sizes.medium,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.primary;
            }}
          >
            {bookmark ? 'Update Bookmark' : 'Add Bookmark'}
          </button>
        </div>
      </form>
    </div>
  );
}
