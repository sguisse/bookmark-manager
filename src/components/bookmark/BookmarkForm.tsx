import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Bookmark, BookmarkFormData } from '../../types/bookmark';
import { FormDisplayMode } from '../../types/app';
import { formatDate, normalizeColorForInput } from '../../services/Utils';
import Image from '../common/image/Image';


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
    title: bookmark?.title || '', // could be prefilled in creation mode (DnD)
    icon: bookmark?.icon || '', // could be prefilled in creation mode (DnD)
    url: bookmark?.url || '', // could be prefilled in creation mode (DnD)
    color: mode === FormDisplayMode.Create ? '' : (normalizeColorForInput(String(bookmark?.color || ''))),
    bgColor: mode === FormDisplayMode.Create ? '' : (normalizeColorForInput(String(bookmark?.bgColor || ''))),
    description: bookmark?.description || '',
    tags: bookmark?.tags?.join(', ') || ''
  }));

  // sync initial values only when the bookmark id changes to avoid clobbering user edits
  useEffect(() => {
    setFormData({
      title: bookmark?.title || '', // could be prefilled in creation mode (DnD)
      icon: bookmark?.icon || '', // could be prefilled in creation mode (DnD)
      url: bookmark?.url || '', // could be prefilled in creation mode (DnD)
      color: mode === FormDisplayMode.Create ? '' : (normalizeColorForInput(String(bookmark?.color || ''))),
      bgColor: mode === FormDisplayMode.Create ? '' : (normalizeColorForInput(String(bookmark?.bgColor || ''))),
      description: bookmark?.description || '',
      tags: bookmark?.tags?.join(', ') || ''
    });
  }, [bookmark?.id, mode]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  // NOTE: iconError state was removed because it's not currently used.

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
      bgColor: formData.bgColor.trim() || undefined,
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
          margin: '0 0 0.8rem 0',
          fontSize: theme.fonts.sizes.large,
          fontWeight: 600,
          color: theme.colors.text.primary
        }}
      >
  {mode === FormDisplayMode.Edit ? 'Edit Bookmark' : 'Add New Bookmark'}
      </h2>
  {/* show id after the popup title (Edit mode) as a readonly field */}
  {mode === FormDisplayMode.Edit && bookmark && (
        <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
          <label htmlFor="bookmark-id" style={{ display: 'block', marginBottom: '0.5rem', fontSize: theme.fonts.sizes.small, fontWeight: 500, color: theme.colors.text.primary }}>ID</label>
          <input id="bookmark-id" type="text" readOnly value={bookmark.id} style={{ ...inputStyle, width: '100%', backgroundColor: theme.colors.surface ?? theme.colors.background, cursor: 'default' }} />
        </div>
      )}
      <form onSubmit={handleSubmit}>
        {/* Two-column responsive grid layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 200px',
          rowGap: '0rem',
          columnGap: '1rem',
          marginBottom: '1rem'
        }}>
          {/* Title Field - spans full width */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: theme.fonts.sizes.small, fontWeight: 500, color: theme.colors.text.primary }} htmlFor="bookmark-title">Title *</label>
            <input id="bookmark-title" type="text" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} style={errors.title ? errorInputStyle : inputStyle} placeholder="Enter bookmark title" autoFocus />
            {errors.title && (<div style={{ marginTop: '0.25rem', fontSize: theme.fonts.sizes.small, color: theme.colors.error }}>{errors.title}</div>)}
          </div>

          {/* Color Field - left column */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: theme.fonts.sizes.small, fontWeight: 500, color: theme.colors.text.primary }} htmlFor="bookmark-color">Color</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {/* color input requires a valid hex value; use a sensible fallback for the picker but keep formData.color empty to represent default */}
              <input
                id="bookmark-color"
                type="color"
                aria-label="Bookmark color"
                value={formData.color || ''}
                onChange={(e) => handleChange('color', e.target.value)}
                style={{ width: 48, height: 36, padding: 0, borderRadius: 6, border: `1px solid ${theme.colors.border}` }}
              />
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: theme.fonts.sizes.small, color: theme.colors.text.primary }}>
                <input
                  type="checkbox"
                  checked={!formData.color}
                  onChange={(e) => handleChange('color', e.target.checked ? '' : (formData.color || ''))}
                  aria-label="Default bookmark color"
                />
                <span>Default</span>
              </label>
            </div>
          </div>


          {/* URL Field - spans full width */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: theme.fonts.sizes.small, fontWeight: 500, color: theme.colors.text.primary }} htmlFor="bookmark-url">URL *</label>
            <input id="bookmark-url" type="url" value={formData.url} onChange={(e) => handleChange('url', e.target.value)} style={errors.url ? errorInputStyle : inputStyle} placeholder="https://example.com" />
            {errors.url && (<div style={{ marginTop: '0.25rem', fontSize: theme.fonts.sizes.small, color: theme.colors.error }}>{errors.url}</div>)}
          </div>

          {/* Icon Field with preview - right column */}
          <div>
            <label htmlFor="sf-icon" style={{ display: 'block', marginBottom: 4 }}>Icon (optional)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Image value={formData.icon } size={20} rounded style={{ display: 'inline-block' }} />
              <input id="sf-icon" value={formData.icon} onChange={(e) => setFormData(f => ({ ...f, icon: e.target.value }))}
                     style={inputStyle} placeholder="camera or https://..." />
            </div>
          </div>

          {/* Description Field - spans full width */}
          <div style={{ gridColumn: '1 / -1', marginBottom: '0.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: theme.fonts.sizes.small, fontWeight: 500, color: theme.colors.text.primary }} htmlFor="bookmark-description">Description</label>
            <textarea id="bookmark-description" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="Optional description" rows={3} />
          </div>

          {/* Tags Field - spans full width */}
          <div style={{ gridColumn: '1 / -1', marginBottom: '0.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: theme.fonts.sizes.small, fontWeight: 500, color: theme.colors.text.primary }} htmlFor="bookmark-tags">Tags</label>
            <input id="bookmark-tags" type="text" value={formData.tags} onChange={(e) => handleChange('tags', e.target.value)} style={inputStyle} placeholder="Enter tags separated by commas" />
            <div style={{ marginTop: '0.25rem', fontSize: theme.fonts.sizes.small, color: theme.colors.text.secondary }}>Separate multiple tags with commas (e.g., work, documentation, reference)</div>
          </div>
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
