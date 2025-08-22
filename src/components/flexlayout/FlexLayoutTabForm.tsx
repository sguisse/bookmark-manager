import React, { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { FlexTabComponent, FlexTabFormData, FlexTabConfig } from '../../types/flexTab';
import { FormDisplayMode } from '../../types/app';
import { formatDate, normalizeColorForInput } from '../../services/Utils';

interface FlexTabFormProps {
  flexTabConfig: Partial<FlexTabConfig>;
  mode?: FormDisplayMode;
  onSave: (flexTabFormData: FlexTabFormData) => void;
  onCancel: () => void;
}

// Build components list derived from the FlexTabComponent enum to fill the combo box
  const componentsPair = (Object.keys(FlexTabComponent) as Array<keyof typeof FlexTabComponent>).map((k) => {
    const v = k;
    const label = k;
    return { value: v, label };
  });

export default function FlexLayoutTabForm(props: Readonly<FlexTabFormProps>) {
  const { flexTabConfig, mode = FormDisplayMode.Edit, onSave, onCancel } = props;
  const { theme } = useTheme();

  const [formData, setFormData] = useState<{ title: string; color: string; bgcolor: string; icon: string; component: string }>(() => ({
    title: mode === FormDisplayMode.Create ? '' : (flexTabConfig?.title || ''),
  color: mode === FormDisplayMode.Create ? '' : (normalizeColorForInput(String(flexTabConfig?.color || '')) || '#3b82f6'),
  bgcolor: mode === FormDisplayMode.Create ? '' : (normalizeColorForInput(String(flexTabConfig?.bgcolor || '')) || ''),
    icon: mode === FormDisplayMode.Create ? '' : (flexTabConfig?.icon || ''),
    component: mode === FormDisplayMode.Create ? '' : (String(flexTabConfig?.component || ''))
  }));

  // sync initial values only when the tab id changes to avoid clobbering user edits
  useEffect(() => {
    // sync when a new tab is opened (id change) or when mode or key fields change
    const newForm = {
      title: mode === FormDisplayMode.Create ? '' : (flexTabConfig?.title || ''),
      color: mode === FormDisplayMode.Create ? '' : (normalizeColorForInput(String(flexTabConfig?.color || '')) || '#3b82f6'),
      bgcolor: mode === FormDisplayMode.Create ? '' : (normalizeColorForInput(String(flexTabConfig?.bgcolor || '')) || ''),
      icon: mode === FormDisplayMode.Create ? '' : (flexTabConfig?.icon || ''),
      component: mode === FormDisplayMode.Create ? '' : (String(flexTabConfig?.component || ''))
    };
    try { console.debug('[FlexLayoutTabForm] sync formData from flexTabConfig', { flexTabConfig, newForm }); } catch (err) {}
    setFormData(newForm);
  }, [flexTabConfig?.id, flexTabConfig?.title, flexTabConfig?.component, flexTabConfig?.color, flexTabConfig?.bgcolor, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const update: FlexTabFormData = {
      id: flexTabConfig?.id || '',
      title: formData.title || undefined,
      color: formData.color || undefined,
      bgcolor: formData.bgcolor || undefined,
      icon: formData.icon || undefined,
      component: (formData.component as any) || undefined
    };
  try { console.log('[FlexLayoutTabForm] saving', update); } catch (err) { console.warn('log failed', err); }
    onSave && onSave(update);
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
      <div style={{ position: 'relative', background: theme.colors.surface, padding: 20, borderRadius: 8, minWidth: 360, boxShadow: '0 6px 24px rgba(0,0,0,0.2)' }}>
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>{mode === FormDisplayMode.Create ? 'Add new Tab' : 'Edit Tab'}</h3>
        {/* ID (readonly) */}
        {flexTabConfig?.id && (
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="flex-id" style={{ display: 'block', marginBottom: 6, color: theme.colors.text.primary }}>ID</label>
            <input id="flex-id" readOnly value={flexTabConfig.id} style={{ width: '100%', padding: 8, borderRadius: 6, border: `1px solid ${theme.colors.border}`, backgroundColor: theme.colors.surface, cursor: 'default' }} />
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label htmlFor="flex-title" style={{ display: 'block', marginBottom: 6, color: theme.colors.text.primary }}>Title</label>
            <input id="flex-title" value={formData.title} onChange={(e) => setFormData(d => ({ ...d, title: e.target.value }))} style={{ width: '100%', padding: 8, borderRadius: 6, border: `1px solid ${theme.colors.border}` }} />
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div>
              <label htmlFor="flex-color" style={{ display: 'block', marginBottom: 6, color: theme.colors.text.primary }}>Color</label>
              <input id="flex-color" type="color" value={formData.color || normalizeColorForInput(String(flexTabConfig?.color || '')) || '#3b82f6'} onChange={(e) => setFormData(d => ({ ...d, color: e.target.value }))} style={{ width: 80, height: 36, border: 'none', padding: 0 }} />
            </div>
            <div>
              <label htmlFor="flex-bgcolor" style={{ display: 'block', marginBottom: 6, color: theme.colors.text.primary }}>Background</label>
              <input id="flex-bgcolor" type="color" value={formData.bgcolor || normalizeColorForInput(String(flexTabConfig?.bgcolor || '')) || ''} onChange={(e) => setFormData(d => ({ ...d, bgcolor: e.target.value }))} style={{ width: 80, height: 36, border: 'none', padding: 0 }} />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="flex-icon" style={{ display: 'block', marginBottom: 6, color: theme.colors.text.primary }}>Icon</label>
              <input id="flex-icon" value={formData.icon} onChange={(e) => setFormData(d => ({ ...d, icon: e.target.value }))} placeholder="emoji or text" style={{ width: '100%', padding: 8, borderRadius: 6, border: `1px solid ${theme.colors.border}` }} />
            </div>
          </div>

          <div>
            <label htmlFor="flex-component" style={{ display: 'block', marginBottom: 6, color: theme.colors.text.primary }}>Tab Component</label>
            <select id="flex-component" value={formData.component || String(flexTabConfig?.component || '')} onChange={(e) => setFormData(d => ({ ...d, component: e.target.value }))} disabled={mode === FormDisplayMode.Edit} aria-disabled={mode === FormDisplayMode.Edit} style={{ padding: 8, borderRadius: 6, border: `1px solid ${theme.colors.border}`, width: '100%', opacity: mode === FormDisplayMode.Edit ? 0.6 : 1 }}>
              <option value="">(choose)</option>
              {componentsPair.map((c: { value: string; label: string }) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {/* Dates (readonly) */}
          { (flexTabConfig?.createdDate || flexTabConfig?.lastModifiedDate) && (
          <div style={{ marginBottom: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label htmlFor="flex-created" style={{ display: 'block', marginBottom: 6, color: theme.colors.text.primary }}>Created</label>
              <input id="flex-created" readOnly value={formatDate(flexTabConfig?.createdDate as any)} style={{ width: '100%', padding: 8, borderRadius: 6, border: `1px solid ${theme.colors.border}`, backgroundColor: theme.colors.surface, cursor: 'default' }} />
            </div>
            <div>
              <label htmlFor="flex-updated" style={{ display: 'block', marginBottom: 6, color: theme.colors.text.primary }}>Updated</label>
              <input id="flex-updated" readOnly value={formatDate(flexTabConfig?.lastModifiedDate as any)} style={{ width: '100%', padding: 8, borderRadius: 6, border: `1px solid ${theme.colors.border}`, backgroundColor: theme.colors.surface, cursor: 'default' }} />
            </div>
          </div>
        )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => { onCancel && onCancel(); }} style={{ padding: '0.5rem 1rem', borderRadius: 6, border: `1px solid ${theme.colors.border}`, background: theme.colors.surface }}>Cancel</button>
            <button type="submit" style={{ padding: '0.5rem 1rem', borderRadius: 6, border: 'none', background: theme.colors.primary, color: '#fff' }}>{mode === FormDisplayMode.Edit ? 'Update Tab' : 'Add Tab'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
