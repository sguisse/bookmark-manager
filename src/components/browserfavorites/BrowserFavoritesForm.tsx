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
  // show info when we have timestamps or at least one expanded node in the bookmarksTree
  showInfo: !!(mode === FormDisplayMode.Edit && browserFavorites && ((browserFavorites.bookmarksTree?.some(n => n.isExpanded)) || browserFavorites.createdDate || browserFavorites.lastModifiedDate))
  }));

  // Sync initial values only when the browserFavorites id changes to avoid clobbering user edits
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      filePath: browserFavorites?.filePath || '',
  showInfo: !!(mode === FormDisplayMode.Edit && browserFavorites && ((browserFavorites.bookmarksTree?.some(n => n.isExpanded)) || browserFavorites.createdDate || browserFavorites.lastModifiedDate))
    }));
  }, [browserFavorites?.id, mode]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const validateForm = () => {
    // Validation has been disabled per request — always consider the form valid.
    setErrors({});
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const data: BrowserFavoritesFormData = {
      filePath: formData.filePath.trim(),
      bookmarksTree: browserFavorites?.bookmarksTree || []
    };

    onSave(data, selectedFile || undefined);
  };



  // File path validation has been removed — selection via Browse is the canonical flow.

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Try to get the full path when available (Electron or directory uploads), fall back to webkitRelativePath,
      // then to the file input value (may contain C:\\fakepath\\name), and finally to the file.name
  // Normalize selected file path for UI. Some environments expose file.path or webkitRelativePath.
  const displayPath = file.name; // prefer user-visible name
      // Update form state so the controlled input reflects the new path immediately
      setFormData(prev => ({ ...prev, filePath: displayPath }));
      // clear any previous filePath errors
      setErrors(prev => ({ ...prev, filePath: '' }));
      setSelectedFile(file);

      // Immediately notify parent to load/update the tree view with the selected file
      const data: BrowserFavoritesFormData = {
        filePath: displayPath,
        bookmarksTree: browserFavorites?.bookmarksTree || []
      };
      onSave(data, file);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '6px',
    backgroundColor: theme.colors.surface ?? theme.colors.background,
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
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: 'transparent', border: 'none', width: '100%', textAlign: 'left', padding: '12px 16px' }}
          >
            <strong>Favoris selection</strong>
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
                    HTML extract File
                  </label>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
                    <input
                      id="browser-favorites-filepath"
                      type="text"
                      value={formData.filePath}
                      readOnly
                      style={{
                        ... (errors.filePath ? errorInputStyle : { ...inputStyle, flex: 1 }),
                        cursor: 'default'
                      }}
                      placeholder="Use Browse button to load bookmarks"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const fileInput = document.getElementById('browser-favorites-file-input') as HTMLInputElement;
                        if (fileInput) {
                          fileInput.value = '';
                          fileInput.click();
                        }
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
  {mode === FormDisplayMode.Edit && browserFavorites && ((browserFavorites.bookmarksTree?.some(n => n.isExpanded)) || browserFavorites.createdDate || browserFavorites.lastModifiedDate) && (
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

                  {/* Opened nodes UI removed — manager now uses node.isExpanded on bookmarksTree */}

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
