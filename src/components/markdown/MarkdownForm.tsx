import { useEffect, useState } from 'react';
import { MarkdownTabFormData, MarkdownTabConfig } from '../../types/markdown';
import { useTheme } from '../../contexts/ThemeContext';
import { formatDate } from '../../services/Utils';
import { FormDisplayMode } from '../../types/app';
import MDEditor from '@uiw/react-md-editor';

// Presentational: edit view (extracted from MarkdownViewer)
export interface MarkdownFormProps {
  markdownTab: MarkdownTabConfig;
  mode?: FormDisplayMode;
  onSave: (data: MarkdownTabFormData) => void;
  onCancel: () => void;
}

export function MarkdownForm(props: Readonly<MarkdownFormProps>) {
  const { markdownTab, mode = FormDisplayMode.Edit, onCancel, onSave } = props;
  const id = markdownTab?.id;
  const createdDate = markdownTab?.createdDate;
  const lastModifiedDate = markdownTab?.lastModifiedDate;
  const { theme } = useTheme();

  const [formData, setFormData] = useState<MarkdownTabFormData>(() => ({
      content: mode === FormDisplayMode.Create ? '' : (markdownTab?.content || '')
    }));

  useEffect(() => {
    setFormData({
      content: mode === FormDisplayMode.Create ? '' : (markdownTab?.content || '')
    });
  }, [markdownTab?.id, mode]);

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
    onSave({ content: (formData.content || '').trim() });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
      {/* show id after the popup title as a readonly field when available */}
      {id && (
        <div style={{ marginTop: '0.5rem', marginBottom: '0.75rem' }}>
          <label htmlFor="web-id" style={{ display: 'block', marginBottom: '0.5rem', fontSize: theme.fonts.sizes.small, fontWeight: 500, color: theme.colors.text.primary }}>ID</label>
          <input id="web-id" type="text" readOnly value={id} style={{ ...readonlyStyle, width: '100%' }} />
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <MDEditor
              value={formData.content}
              onChange={(val: any) => setFormData((prev) => ({ ...prev, content: String(val || '') }))}
              height="100%"
              style={{ flex: 1 }}
            />
          </div>
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

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} style={{ padding: '0.5rem 1rem' }}>Cancel</button>
          <button type="submit" style={{ padding: '0.75rem 1.5rem', border: 'none', borderRadius: '6px', backgroundColor: theme.colors.primary, color: '#ffffff' }}>Save</button>
        </div>
      </form>
    </div>
  );
}
