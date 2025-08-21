import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Bookmark, BookmarkInput } from '../../types/bookmark';

interface TabProperties {
  title?: string;
  icon?: string;
  color?: string;
  bgcolor?: string;
  collapsed?: boolean;
}

interface BookmarkFormProps {
  bookmark?: Bookmark | null;
  onSubmit: (bookmarkData: BookmarkInput | TabProperties) => void;
  onCancel: () => void;
  // mode: 'bookmark' (default) or 'tab' to edit tab properties
  mode?: 'bookmark' | 'tab';
  initialTabProps?: TabProperties;
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

  const [tabData, setTabData] = useState<TabProperties>({ title: '', icon: '', color: '', bgcolor: '', collapsed: false });

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
    // initialize tab data when provided
    if (props.initialTabProps) {
      setTabData({ ...(props.initialTabProps || {}) });
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

    if (props.mode === 'tab') {
      // submit tab properties
      const tabProps: TabProperties = {
        title: tabData.title?.trim(),
        icon: tabData.icon?.trim(),
        color: tabData.color || '',
        bgcolor: tabData.bgcolor || '',
        collapsed: !!tabData.collapsed
      };
      onSubmit(tabProps);
      return;
    }

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
    if (props.mode === 'tab') {
      setTabData(prev => ({ ...prev, [field]: value } as any));
      return;
    }
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleTabCheckbox = (field: string, value: boolean) => {
    setTabData(prev => ({ ...prev, [field]: value } as any));
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
        {(() => {
          if (props.mode === 'tab') return 'Edit Tab Properties';
          if (bookmark) return 'Edit Bookmark';
          return 'Add New Bookmark';
        })()}
      </h2>

      <form onSubmit={handleSubmit}>
        {props.mode === 'tab' ? (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: theme.fonts.sizes.small, fontWeight: 500, color: theme.colors.text.primary }} htmlFor="tab-title">Tab title</label>
              <input id="tab-title" type="text" value={tabData.title || ''} onChange={(e) => handleChange('title', e.target.value)} style={inputStyle} placeholder="Tab title" autoFocus />
            </div>

            <div style={{ marginBottom: '1rem', display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ flex: '0 0 140px' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: theme.fonts.sizes.small, fontWeight: 500, color: theme.colors.text.primary }} htmlFor="tab-icon">Icon</label>
                <input id="tab-icon" type="text" value={tabData.icon || ''} onChange={(e) => handleChange('icon', e.target.value)} style={inputStyle} placeholder="Emoji or text" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: theme.fonts.sizes.small, fontWeight: 500, color: theme.colors.text.primary }} htmlFor="tab-color">Color</label>
                <input id="tab-color" type="color" value={tabData.color || ''} onChange={(e) => handleChange('color', e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: theme.fonts.sizes.small, fontWeight: 500, color: theme.colors.text.primary }} htmlFor="tab-bgcolor">BG color</label>
                <input id="tab-bgcolor" type="color" value={tabData.bgcolor || ''} onChange={(e) => setTabData(prev => ({ ...prev, bgcolor: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <label htmlFor="tab-collapsed" style={{ fontSize: theme.fonts.sizes.small, color: theme.colors.text.primary }}>Collapsed</label>
                <input id="tab-collapsed" type="checkbox" checked={!!tabData.collapsed} onChange={(e) => handleTabCheckbox('collapsed', e.target.checked)} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={onCancel} style={{ padding: '0.75rem 1.5rem', border: `1px solid ${theme.colors.border}`, borderRadius: '6px', backgroundColor: 'transparent', color: theme.colors.text.primary }}>Cancel</button>
              <button type="submit" style={{ padding: '0.75rem 1.5rem', border: 'none', borderRadius: '6px', backgroundColor: theme.colors.primary, color: '#ffffff' }}>{'Save'}</button>
            </div>
          </>
        ) : (
          // bookmark editing
          <>
            {/* Title Field */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: theme.fonts.sizes.small, fontWeight: 500, color: theme.colors.text.primary }} htmlFor="bookmark-title">Title *</label>
              <input id="bookmark-title" type="text" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} style={errors.title ? errorInputStyle : inputStyle} placeholder="Enter bookmark title" autoFocus />
              {errors.title && (<div style={{ marginTop: '0.25rem', fontSize: theme.fonts.sizes.small, color: theme.colors.error }}>{errors.title}</div>)}
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

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={onCancel} style={{ padding: '0.75rem 1.5rem', border: `1px solid ${theme.colors.border}`, borderRadius: '6px', backgroundColor: 'transparent', color: theme.colors.text.primary }}>Cancel</button>
              <button type="submit" style={{ padding: '0.75rem 1.5rem', border: 'none', borderRadius: '6px', backgroundColor: theme.colors.primary, color: '#ffffff' }}>{bookmark ? 'Update Bookmark' : 'Add Bookmark'}</button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
