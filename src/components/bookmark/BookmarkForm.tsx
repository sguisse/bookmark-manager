import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Bookmark, BookmarkFormData } from '../../types/bookmark';
import { FormDisplayMode } from '../../types/app';
import { formatDate, normalizeColorForInput } from '../../services/Utils';

// small helper to render icon preview
function IconPreview(props: Readonly<{ src?: string; errored: boolean; onError: () => void }>) {
  const { src, errored, onError } = props;
  if (!src || errored) return <span style={{ fontSize: 18, opacity: 0.45 }}>🌐</span>;
  if (src.startsWith('http') || src.startsWith('data:')) {
    return <img src={src} alt="icon" style={{ width: 24, height: 24, objectFit: 'cover' }} onError={onError} />;
  }
  return <span style={{ fontSize: 18 }}>{src}</span>;
}

interface BookmarkFormProps {
  bookmark?: Bookmark | null;
  mode?: FormDisplayMode;
  onSave: (bookmarkData: BookmarkFormData) => void;
  onCancel: () => void;
}

export default function BookmarkForm(props: Readonly<BookmarkFormProps>) {
  const { bookmark, mode = FormDisplayMode.Edit, onSave, onCancel } = props;
  const { theme } = useTheme();
  const [formData, setFormData] = useState(() => ({
    title: mode === FormDisplayMode.Create ? '' : (bookmark?.title || ''),
    color: mode === FormDisplayMode.Create ? '' : (normalizeColorForInput(String(bookmark?.color || ''))),
    icon: mode === FormDisplayMode.Create ? '' : (bookmark?.icon || ''),
    url: mode === FormDisplayMode.Create ? '' : (bookmark?.url || ''),
    description: mode === FormDisplayMode.Create ? '' : (bookmark?.description || ''),
    tags: mode === FormDisplayMode.Create ? '' : (bookmark?.tags?.join(', ') || '')
  }));

  // use the explicit mode prop (caller controls create vs edit)

  // sync initial values only when the bookmark id changes to avoid clobbering user edits
  useEffect(() => {
    setFormData({
      title: mode === FormDisplayMode.Create ? '' : (bookmark?.title || ''),
      color: mode === FormDisplayMode.Create ? '' : (normalizeColorForInput(String(bookmark?.color || ''))),
      icon: mode === FormDisplayMode.Create ? '' : (bookmark?.icon || ''),
      url: mode === FormDisplayMode.Create ? '' : (bookmark?.url || ''),
      description: mode === FormDisplayMode.Create ? '' : (bookmark?.description || ''),
      tags: mode === FormDisplayMode.Create ? '' : (bookmark?.tags?.join(', ') || '')
    });
  }, [bookmark?.id, mode]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [iconError, setIconError] = useState(false);

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
      color: formData.color.trim() || undefined,
      icon: formData.icon.trim() || undefined,
      url: formData.url.trim(),
      description: formData.description.trim() || undefined,
      tags: formData.tags
        ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : undefined
    };

  onSave(bookmarkData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (field === 'icon') {
      // reset image error when user edits the icon field
      setIconError(false);
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
  {mode === FormDisplayMode.Edit ? 'Edit Bookmark' : 'Add New Bookmark'}
      </h2>
  {/* show id after the popup title (Edit mode) as a readonly field */}
  {mode === FormDisplayMode.Edit && bookmark && (
        <div style={{ marginTop: '0.5rem', marginBottom: '0.75rem' }}>
          <label htmlFor="bookmark-id" style={{ display: 'block', marginBottom: '0.5rem', fontSize: theme.fonts.sizes.small, fontWeight: 500, color: theme.colors.text.primary }}>ID</label>
          <input id="bookmark-id" type="text" readOnly value={bookmark.id} style={{ ...inputStyle, width: '100%', backgroundColor: theme.colors.surface ?? theme.colors.background, cursor: 'default' }} />
        </div>
      )}
      <form onSubmit={handleSubmit}>
        {/* Title Field */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: theme.fonts.sizes.small, fontWeight: 500, color: theme.colors.text.primary }} htmlFor="bookmark-title">Title *</label>
          <input id="bookmark-title" type="text" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} style={errors.title ? errorInputStyle : inputStyle} placeholder="Enter bookmark title" autoFocus />
          {errors.title && (<div style={{ marginTop: '0.25rem', fontSize: theme.fonts.sizes.small, color: theme.colors.error }}>{errors.title}</div>)}
        </div>

        {/* Color Field */}
          <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: theme.fonts.sizes.small, fontWeight: 500, color: theme.colors.text.primary }} htmlFor="bookmark-color">Color</label>
          <input id="bookmark-color" type="color" value={formData.color || normalizeColorForInput(String(bookmark?.color || '')) || '#3b82f6'} onChange={(e) => handleChange('color', e.target.value)} style={{ ...inputStyle, padding: '0.25rem', width: '56px', height: '36px' }} />
        </div>

        {/* Icon Field with preview */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: theme.fonts.sizes.small, fontWeight: 500, color: theme.colors.text.primary }} htmlFor="bookmark-icon">Icon</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 6, border: `1px solid ${theme.colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.colors.background, overflow: 'hidden' }}>
              <IconPreview src={formData.icon} errored={iconError} onError={() => setIconError(true)} />
            </div>

            <input id="bookmark-icon" type="text" value={formData.icon} onChange={(e) => handleChange('icon', e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 0 }} placeholder="emoji (e.g. 🔖) or https://example.com/icon.png" />
          </div>
        </div>

        {/* URL Field */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: theme.fonts.sizes.small, fontWeight: 500, color: theme.colors.text.primary }} htmlFor="bookmark-url">URL *</label>
          <input id="bookmark-url" type="url" value={formData.url} onChange={(e) => handleChange('url', e.target.value)} style={errors.url ? errorInputStyle : inputStyle} placeholder="https://example.com" />
          {errors.url && (<div style={{ marginTop: '0.25rem', fontSize: theme.fonts.sizes.small, color: theme.colors.error }}>{errors.url}</div>)}
        </div>

        {/* Description Field */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: theme.fonts.sizes.small, fontWeight: 500, color: theme.colors.text.primary }} htmlFor="bookmark-description">Description</label>
          <textarea id="bookmark-description" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="Optional description" rows={3} />
        </div>

        {/* Tags Field */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: theme.fonts.sizes.small, fontWeight: 500, color: theme.colors.text.primary }} htmlFor="bookmark-tags">Tags</label>
          <input id="bookmark-tags" type="text" value={formData.tags} onChange={(e) => handleChange('tags', e.target.value)} style={inputStyle} placeholder="Enter tags separated by commas" />
          <div style={{ marginTop: '0.25rem', fontSize: theme.fonts.sizes.small, color: theme.colors.text.secondary }}>Separate multiple tags with commas (e.g., work, documentation, reference)</div>
        </div>

  {/* show created/updated timestamps when editing existing bookmark as two readonly fields */}
  {mode === FormDisplayMode.Edit && bookmark && (
    <div style={{ marginBottom: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
      <div>
        <label htmlFor="bookmark-created" style={{ display: 'block', marginBottom: '0.5rem', fontSize: theme.fonts.sizes.small, fontWeight: 500, color: theme.colors.text.primary }}>Created</label>
        <input id="bookmark-created" type="text" readOnly value={formatDate(bookmark.createdDate)} style={{ ...inputStyle, backgroundColor: theme.colors.surface ?? theme.colors.background, cursor: 'default' }} />
      </div>
      <div>
        <label htmlFor="bookmark-updated" style={{ display: 'block', marginBottom: '0.5rem', fontSize: theme.fonts.sizes.small, fontWeight: 500, color: theme.colors.text.primary }}>Updated</label>
        <input id="bookmark-updated" type="text" readOnly value={formatDate(bookmark.lastModifiedDate)} style={{ ...inputStyle, backgroundColor: theme.colors.surface ?? theme.colors.background, cursor: 'default' }} />
      </div>
    </div>
  )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} style={{ padding: '0.75rem 1.5rem', border: `1px solid ${theme.colors.border}`, borderRadius: '6px', backgroundColor: 'transparent', color: theme.colors.text.primary }}>Cancel</button>
          <button type="submit" style={{ padding: '0.75rem 1.5rem', border: 'none', borderRadius: '6px', backgroundColor: theme.colors.primary, color: '#ffffff' }}>{mode === FormDisplayMode.Edit ? 'Update Bookmark' : 'Add Bookmark'}</button>
        </div>
      </form>
    </div>
  );
}
