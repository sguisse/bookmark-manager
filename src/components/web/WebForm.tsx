import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { formatDate } from '../../services/Utils';
import { WebTabConfig, WebTabFormData } from '../../types/web';
import { FormDisplayMode } from '../../types/app';

interface WebFormProps {
  webTab?: WebTabConfig | null;
  mode?: FormDisplayMode;
  onSave: (data: WebTabFormData) => void;
  onCancel: () => void;
}

export default function WebForm(props: Readonly<WebFormProps>) {
  const { webTab, mode = FormDisplayMode.Edit, onSave, onCancel } = props;
  const id = webTab?.id;
  const createdDate = webTab?.createdDate;
  const lastModifiedDate = webTab?.lastModifiedDate;
  const { theme } = useTheme();

  const [formData, setFormData] = useState<WebTabFormData>(() => ({
    url: mode === FormDisplayMode.Create ? '' : (webTab?.url || '')
  }));

  // sync initial values only when the webTab id changes or the mode changes
  useEffect(() => {
    const newForm: WebTabFormData = {
      url: mode === FormDisplayMode.Create ? '' : (webTab?.url || '')
    };
    setFormData(newForm);
  }, [webTab?.url, mode]);

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
  } as const;

  const readonlyStyle = {
    ...inputStyle,
    backgroundColor: theme.colors.surface ?? theme.colors.background,
    cursor: 'default'
  } as const;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const update: WebTabFormData = {
      url: (formData.url || '').trim()
    };
    onSave(update);
  };

  // close on Escape
    useEffect(() => {
      const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel && onCancel(); };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }, [onCancel]);

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <button onClick={() => onCancel && onCancel()} aria-label="Close modal" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', border: 'none', padding: 0, cursor: 'pointer' }} />
      <div style={{ position: 'relative', background: theme.colors.surface, padding: 20, borderRadius: 8, minWidth: 360, width: 420, boxShadow: '0 6px 24px rgba(0,0,0,0.12)' }}>
        <h2 style={{ margin: '0 0 1.5rem 0', fontSize: theme.fonts.sizes.large, fontWeight: 600, color: theme.colors.text.primary }}>{mode === FormDisplayMode.Create ? 'Add Web URL' : 'Edit Web URL'}</h2>

        {/* show id after the popup title as a readonly field when available */}
        {id && (
          <div style={{ marginTop: '0.5rem', marginBottom: '0.75rem' }}>
            <label htmlFor="web-id" style={{ display: 'block', marginBottom: '0.5rem', fontSize: theme.fonts.sizes.small, fontWeight: 500, color: theme.colors.text.primary }}>ID</label>
            <input id="web-id" type="text" readOnly value={id} style={{ ...readonlyStyle, width: '100%' }} />
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="web-url" style={{ display: 'block', marginBottom: '0.5rem', fontSize: theme.fonts.sizes.small, fontWeight: 500, color: theme.colors.text.primary }}>URL</label>
            <input id="web-url" type="url" value={formData.url ?? ''} onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))} placeholder="https://example.com" style={inputStyle} autoFocus />
          </div>

          {/* Dates (readonly) */}
          {(createdDate || lastModifiedDate) && (
            <div style={{ marginBottom: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label htmlFor="web-created" style={{ display: 'block', marginBottom: '0.5rem', fontSize: theme.fonts.sizes.small, fontWeight: 500, color: theme.colors.text.primary }}>Created</label>
                <input id="web-created" readOnly value={formatDate(createdDate)} style={{ ...readonlyStyle }} />
              </div>
              <div>
                <label htmlFor="web-updated" style={{ display: 'block', marginBottom: '0.5rem', fontSize: theme.fonts.sizes.small, fontWeight: 500, color: theme.colors.text.primary }}>Updated</label>
                <input id="web-updated" readOnly value={formatDate(lastModifiedDate)} style={{ ...readonlyStyle }} />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onCancel} style={{ padding: '0.75rem 1.5rem', border: `1px solid ${theme.colors.border}`, borderRadius: '6px', backgroundColor: 'transparent', color: theme.colors.text.primary }}>Cancel</button>
            <button type="submit" style={{ padding: '0.75rem 1.5rem', border: 'none', borderRadius: '6px', backgroundColor: theme.colors.primary, color: '#ffffff' }}>Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
