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
    } else {
      // Validate file path format and existence
      const filePath = formData.filePath.trim();

      // Check if it's a valid file path format
      if (!/\.(html|htm)$/i.test(filePath) || filePath.length < 6) {
        newErrors.filePath = 'Please enter a valid HTML file path (.html or .htm extension required)';
      }

      // Additional validation: Check if path looks like a valid file path
      if (!newErrors.filePath) {
        const isAbsolutePath = /^([a-zA-Z]:\\|\/|~\/)/.test(filePath);
        const isRelativePath = /^\.{0,2}\//.test(filePath) || !/[\\/]/.test(filePath);

        if (!isAbsolutePath && !isRelativePath && filePath.includes('/') || filePath.includes('\\')) {
          // It's a path but doesn't look like a proper absolute or relative path
          if (filePath.length < 3) {
            newErrors.filePath = 'File path is too short';
          }
        }
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

  const handleFilePathValidation = async (filePath: string) => {
    const trimmedPath = filePath.trim();

    if (!trimmedPath) {
      setErrors(prev => ({ ...prev, filePath: 'File path is required' }));
      return false;
    }

    // Check file extension
    if (!/\.(html|htm)$/i.test(trimmedPath)) {
      setErrors(prev => ({ ...prev, filePath: 'Please select an HTML file (.html or .htm extension required)' }));
      return false;
    }

    // Validate file path format
    try {
      if (trimmedPath.startsWith('file://') || (!trimmedPath.startsWith('http'))) {
        // For local files, validate the path format
        if (trimmedPath.length < 5) {
          setErrors(prev => ({ ...prev, filePath: 'File path is too short' }));
          return false;
        }

        // Clear any previous errors if format looks good
        setErrors(prev => ({ ...prev, filePath: '' }));
        return true;
      }

      // For HTTP URLs, validate URL format
      if (trimmedPath.startsWith('http')) {
        try {
          new URL(trimmedPath);
          setErrors(prev => ({ ...prev, filePath: '' }));
          return true;
        } catch {
          setErrors(prev => ({ ...prev, filePath: 'Invalid URL format' }));
          return false;
        }
      }

      setErrors(prev => ({ ...prev, filePath: '' }));
      return true;
    } catch {
      setErrors(prev => ({ ...prev, filePath: 'Unable to validate file path' }));
      return false;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleChange('filePath', file.name);
      setSelectedFile(file);
      // Validate the selected file
      handleFilePathValidation(file.name);
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
          <button
            type="button"
            className="card-header"
            aria-expanded={formData.showFileSelection}
            onClick={() => setFormData(f => ({ ...f, showFileSelection: !f.showFileSelection }))}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
              width: '100%',
              textAlign: 'left',
              padding: '12px 16px'
            }}
          >
            <strong>File Selection</strong>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {formData.showFileSelection ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
          </button>
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
                      onChange={(e) => handleChange('filePath', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleFilePathValidation(formData.filePath).then(() => {
                            handleSubmit(e);
                          });
                        }
                      }}
                      onBlur={() => {
                        if (formData.filePath.trim()) {
                          handleFilePathValidation(formData.filePath).then((isValid) => {
                            if (isValid) {
                              const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                              handleSubmit(fakeEvent);
                            }
                          });
                        }
                      }}
                      style={errors.filePath ? errorInputStyle : { ...inputStyle, flex: 1 }}
                      placeholder="Enter file path or select file"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const fileInput = document.getElementById('browser-favorites-file-input') as HTMLInputElement;
                        fileInput?.click();
                      }}
                      style={{
                        padding: '0.75rem 1.5rem',
                        border: 'none',
                        borderRadius: '6px',
                        backgroundColor: theme.colors.primary,
                        color: '#ffffff',
                        cursor: 'pointer',
                        fontSize: theme.fonts.sizes.medium,
                        fontFamily: theme.fonts.family
                      }}
                    >
                      Browse
                    </button>
                    <input
                      id="browser-favorites-file-input"
                      type="file"
                      accept="text/html"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />

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

        {/* Information block with chevron (Edit mode only) */}
        {mode === FormDisplayMode.Edit && browserFavorites && (browserFavorites.nodesOpened.length > 0 || browserFavorites.createdDate || browserFavorites.lastModifiedDate) && (
          <div className="card mb-4" style={{ borderColor: theme.colors.border, marginTop: '0' }}>
            <button
              type="button"
              className={`card-header`}
              aria-expanded={formData.showInfo}
              onClick={() => setFormData(f => ({ ...f, showInfo: !f.showInfo }))}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                background: 'transparent',
                border: 'none',
                width: '100%',
                textAlign: 'left',
                padding: '12px 16px'
              }}
            >
              <strong>Information</strong>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {formData.showInfo ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>
            </button>
            {formData.showInfo && (
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                  {/* id section */}
                   {browserFavorites.id && (
                    <div id="browser-favorites-id">
                      <label
                        htmlFor="browser-favorites-id-input"
                        style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontSize: theme.fonts.sizes.small,
                        fontWeight: 500,
                        color: theme.colors.text.primary
                      }}>
                        ID
                      </label>
                      <input
                        id="browser-favorites-id-input"
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

                  {/* Opened nodes section */}
                  {browserFavorites.nodesOpened.length > 0 && (
                    <div id="browser-favorites-opened-nodes">
                      <div style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontSize: theme.fonts.sizes.small,
                        fontWeight: 500,
                        color: theme.colors.text.primary
                      }}>
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

                  {/* Timestamps section */}
                  {(browserFavorites.createdDate || browserFavorites.lastModifiedDate) && (
                    <div style={{
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
                </div>
              </div>
            )}
          </div>
        )}

      </form>
    </div>
  );
}
