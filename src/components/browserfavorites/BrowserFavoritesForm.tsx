import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { BrowserFavorites, BrowserFavoritesFormData } from '../../types/browser';
import { FormDisplayMode } from '../../types/app';
import { formatDate } from '../../services/Utils';

interface BrowserFavoritesFormProps {
  browserFavorites?: BrowserFavorites | null;
  mode?: FormDisplayMode;
  onSave: (data: BrowserFavoritesFormData, file?: File) => void;
  onCancel?: () => void; // Made optional since it's not used in embedded mode
}

export default function BrowserFavoritesForm(props: Readonly<BrowserFavoritesFormProps>) {
  const { browserFavorites, mode = FormDisplayMode.Edit, onSave } = props;
  const { theme } = useTheme();

  const [formData, setFormData] = useState(() => ({
    filePath: browserFavorites?.filePath || ''
  }));

  // Sync initial values only when the browserFavorites id changes to avoid clobbering user edits
  useEffect(() => {
    setFormData({
      filePath: browserFavorites?.filePath || ''
    });
  }, [browserFavorites?.id, mode]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.filePath.trim()) {
      newErrors.filePath = 'File path is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const data: BrowserFavoritesFormData = {
      filePath: formData.filePath.trim()
    };

    onSave(data, selectedFile || undefined);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleChange('filePath', file.name);
      setSelectedFile(file);
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

  const buttonStyle = {
    padding: '0.5rem 1rem',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '6px',
    backgroundColor: theme.colors.background,
    color: theme.colors.text.primary,
    cursor: 'pointer',
    fontSize: theme.fonts.sizes.small
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
        {mode === FormDisplayMode.Edit ? 'Edit Browser Favorites' : 'Add Browser Favorites'}
      </h2>

      {/* Show id after the popup title (Edit mode) as a readonly field */}
      {mode === FormDisplayMode.Edit && browserFavorites && (
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="browser-favorites-id" style={{ display: 'block', marginBottom: '0.5rem', fontSize: theme.fonts.sizes.small, fontWeight: 500, color: theme.colors.text.primary }}>ID</label>
          <input
            id="browser-favorites-id"
            type="text"
            readOnly
            value={browserFavorites.id}
            style={{
              ...inputStyle,
              backgroundColor: theme.colors.surface ?? theme.colors.background,
              cursor: 'default'
            }}
          />
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* File Path Field */}
        <div style={{ marginBottom: '1rem' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: theme.fonts.sizes.small,
              fontWeight: 500,
              color: theme.colors.text.primary
            }}
            htmlFor="browser-favorites-filepath"
          >
            File Path *
          </label>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
            <input
              id="browser-favorites-filepath"
              type="text"
              value={formData.filePath}
              onChange={(e) => handleChange('filePath', e.target.value)}
              style={errors.filePath ? errorInputStyle : { ...inputStyle, flex: 1 }}
              placeholder="Enter file path or select file"
              autoFocus
            />
            <label style={buttonStyle}>
              Browse
              <input
                type="file"
                accept="text/html"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {errors.filePath && (
            <div style={{
              marginTop: '0.25rem',
              fontSize: theme.fonts.sizes.small,
              color: theme.colors.error
            }}>
              {errors.filePath}
            </div>
          )}

          <div style={{
            marginTop: '0.25rem',
            fontSize: theme.fonts.sizes.small,
            color: theme.colors.text.secondary
          }}>
            Select a Chrome bookmarks HTML file or enter the file path
          </div>
        </div>

        {/* Show opened nodes information in edit mode */}
        {mode === FormDisplayMode.Edit && browserFavorites && browserFavorites.nodesOpened.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <div
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: theme.fonts.sizes.small,
                fontWeight: 500,
                color: theme.colors.text.primary
              }}
            >
              Currently Opened Nodes
            </div>
            <div style={{
              padding: '0.75rem',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '6px',
              backgroundColor: theme.colors.surface ?? theme.colors.background,
              fontSize: theme.fonts.sizes.small,
              color: theme.colors.text.secondary
            }}>
              {browserFavorites.nodesOpened.join(' > ')}
            </div>
          </div>
        )}

        {/* Show created/updated timestamps when editing existing browserFavorites */}
        {mode === FormDisplayMode.Edit && browserFavorites && (
          <div style={{
            marginBottom: '1rem',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem'
          }}>
            <div>
              <label
                htmlFor="browser-favorites-created"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: theme.fonts.sizes.small,
                  fontWeight: 500,
                  color: theme.colors.text.primary
                }}
              >
                Created
              </label>
              <input
                id="browser-favorites-created"
                type="text"
                readOnly
                value={formatDate(browserFavorites.createdDate)}
                style={{
                  ...inputStyle,
                  backgroundColor: theme.colors.surface ?? theme.colors.background,
                  cursor: 'default'
                }}
              />
            </div>
            <div>
              <label
                htmlFor="browser-favorites-updated"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: theme.fonts.sizes.small,
                  fontWeight: 500,
                  color: theme.colors.text.primary
                }}
              >
                Updated
              </label>
              <input
                id="browser-favorites-updated"
                type="text"
                readOnly
                value={formatDate(browserFavorites.lastModifiedDate)}
                style={{
                  ...inputStyle,
                  backgroundColor: theme.colors.surface ?? theme.colors.background,
                  cursor: 'default'
                }}
              />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => {
              // Reset form to initial state
              setFormData({
                filePath: browserFavorites?.filePath || ''
              });
              setErrors({});
              setSelectedFile(null);
            }}
            style={{
              padding: '0.75rem 1.5rem',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '6px',
              backgroundColor: 'transparent',
              color: theme.colors.text.primary,
              cursor: 'pointer'
            }}
          >
            Reset
          </button>
          <button
            type="submit"
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: theme.colors.primary,
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            {mode === FormDisplayMode.Edit ? 'Update Browser Favorites' : 'Add Browser Favorites'}
          </button>
        </div>
      </form>
    </div>
  );
}
