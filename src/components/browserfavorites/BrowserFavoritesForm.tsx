import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { BrowserFavorites, BrowserFavoritesFormData } from '../../types/browser';
import { FormDisplayMode } from '../../types/app';
import { formatDate } from '../../services/Utils';
import { ChevronDown, ChevronRight } from 'lucide-react';

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
    filePath: browserFavorites?.filePath || '',
    showFileSelection: true, // Collapsible section state
    showInfo: !!(mode === FormDisplayMode.Edit && browserFavorites && (browserFavorites.nodesOpened.length > 0 || browserFavorites.createdDate || browserFavorites.lastModifiedDate))
  }));

  // Sync initial values only when the browserFavorites id changes to avoid clobbering user edits
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      filePath: browserFavorites?.filePath || '',
      showInfo: !!(mode === FormDisplayMode.Edit && browserFavorites && (browserFavorites.nodesOpened.length > 0 || browserFavorites.createdDate || browserFavorites.lastModifiedDate))
    }));
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
    if (!validateForm()) {
      return;
    }

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

  return (
    <div>

      <form onSubmit={handleSubmit}>
        {/* File Selection block with chevron */}
        <div className="card mb-4" style={{ borderColor: theme.colors.border, marginTop: '0' }}>
          <div
            className="card-header"
            role="button"
            tabIndex={0}
            aria-expanded={formData.showFileSelection}
            onClick={() => setFormData(f => ({ ...f, showFileSelection: !f.showFileSelection }))}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFormData(f => ({ ...f, showFileSelection: !f.showFileSelection })); } }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
          >
            <strong>File Selection</strong>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {formData.showFileSelection ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
          </div>
          {formData.showFileSelection && (
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                <div>
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
                    Select a Chrome bookmarks HTML file or enter the file path *
                  </label>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
                    <input
                      id="browser-favorites-filepath"
                      type="text"
                      value={formData.filePath}
                      onFocus={(e) => handleChange('filePath', e.target.value)}
                      style={errors.filePath ? errorInputStyle : { ...inputStyle, flex: 1 }}
                      placeholder="Enter file path or select file"
                      autoFocus
                    />
                    <label style={{
                                    padding: '0.75rem 1.5rem',
                                    border: 'none',
                                    borderRadius: '6px',
                                    backgroundColor: theme.colors.primary,
                                    color: '#ffffff',
                                    cursor: 'pointer'

                                  }}>
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

                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </form>
    </div>
  );
}
