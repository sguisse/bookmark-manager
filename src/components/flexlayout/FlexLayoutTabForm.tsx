import React, { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { FlexLayoutTabComponent, FlexLayoutTabFormData, FlexLayoutTabConfig } from '../../types/flexTab';
import { FormDisplayMode } from '../../types/app';
import { formatDate, normalizeColorForInput } from '../../services/Utils';

interface FlexLayoutTabFormProps {
  flexLayoutTab: Partial<FlexLayoutTabConfig>;
  mode?: FormDisplayMode;
  onSave: (flexLayoutTabFormData: FlexLayoutTabFormData) => void;
  onCancel: () => void;
}

// Build components list derived from the FlexTabComponent enum to fill the combo box
  const componentsPair = (Object.keys(FlexLayoutTabComponent) as Array<keyof typeof FlexLayoutTabComponent>).map((k) => {
    const v = k;
    const label = k;
    return { value: v, label };
  });

export default function FlexLayoutTabForm(props: Readonly<FlexLayoutTabFormProps>) {
  const { flexLayoutTab, mode = FormDisplayMode.Edit, onSave, onCancel } = props;
  const { theme } = useTheme();

  const [formData, setFormData] = useState<FlexLayoutTabFormData>(() => ({
    id: mode === FormDisplayMode.Create ? '' : (flexLayoutTab?.id || ''),
    title: mode === FormDisplayMode.Create ? '' : (flexLayoutTab?.title || ''),
    color: mode === FormDisplayMode.Create ? '' : (normalizeColorForInput(String(flexLayoutTab?.color || '')) || '#3b82f6'),
    bgcolor: mode === FormDisplayMode.Create ? '' : (normalizeColorForInput(String(flexLayoutTab?.bgcolor || '')) || ''),
    icon: mode === FormDisplayMode.Create ? '' : (flexLayoutTab?.icon || ''),
    component: mode === FormDisplayMode.Create ? undefined : flexLayoutTab?.component
  }));

  // sync initial values only when the tab id changes to avoid clobbering user edits
  useEffect(() => {
    const newForm: FlexLayoutTabFormData = {
      id: mode === FormDisplayMode.Create ? '' : (flexLayoutTab?.id || ''),
      title: mode === FormDisplayMode.Create ? '' : (flexLayoutTab?.title || ''),
      color: mode === FormDisplayMode.Create ? '' : (normalizeColorForInput(String(flexLayoutTab?.color || '')) || '#3b82f6'),
      bgcolor: mode === FormDisplayMode.Create ? '' : (normalizeColorForInput(String(flexLayoutTab?.bgcolor || '')) || ''),
      icon: mode === FormDisplayMode.Create ? '' : (flexLayoutTab?.icon || ''),
      component: mode === FormDisplayMode.Create ? undefined : flexLayoutTab?.component
    };
    try {
      console.debug('[FlexLayoutTabForm] sync formData from flexLayoutTab', { flexLayoutTab, newForm });
    } catch (err) {
      // log if console inspect fails in some environments
      // eslint-disable-next-line no-console
      console.warn('[FlexLayoutTabForm] debug logging failed', err);
    }
    setFormData(newForm);
  }, [flexLayoutTab?.id, flexLayoutTab?.title, flexLayoutTab?.component, flexLayoutTab?.color, flexLayoutTab?.bgcolor, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const update: FlexLayoutTabFormData = {
      id: flexLayoutTab?.id || '',
      title: formData.title || undefined,
      color: formData.color || undefined,
      bgcolor: formData.bgcolor || undefined,
      icon: formData.icon || undefined,
      component: (formData.component as FlexLayoutTabComponent) || undefined
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
      <div style={{ position: 'relative', background: theme.colors.surface, padding: 20, borderRadius: 8, minWidth: 360, boxShadow: '0 6px 24px rgba(0,0,0,0.2)' }}>
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>{mode === FormDisplayMode.Create ? 'Add new Tab' : 'Edit Tab'}</h3>
        {/* ID (readonly) */}
        {flexLayoutTab?.id && (
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="flex-id" style={{ display: 'block', marginBottom: 6, color: theme.colors.text.primary }}>ID</label>
            <input id="flex-id" readOnly value={flexLayoutTab.id} style={{ width: '100%', padding: 8, borderRadius: 6, border: `1px solid ${theme.colors.border}`, backgroundColor: theme.colors.surface, cursor: 'default' }} />
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
              <input id="flex-color" type="color" value={formData.color || normalizeColorForInput(String(flexLayoutTab?.color || '')) || '#3b82f6'} onChange={(e) => setFormData(d => ({ ...d, color: e.target.value }))} style={{ width: 80, height: 36, border: 'none', padding: 0 }} />
            </div>
            <div>
              <label htmlFor="flex-bgcolor" style={{ display: 'block', marginBottom: 6, color: theme.colors.text.primary }}>Background</label>
              <input id="flex-bgcolor" type="color" value={formData.bgcolor || normalizeColorForInput(String(flexLayoutTab?.bgcolor || '')) || ''} onChange={(e) => setFormData(d => ({ ...d, bgcolor: e.target.value }))} style={{ width: 80, height: 36, border: 'none', padding: 0 }} />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="flex-icon" style={{ display: 'block', marginBottom: 6, color: theme.colors.text.primary }}>Icon</label>
              <input id="flex-icon" value={formData.icon} onChange={(e) => setFormData(d => ({ ...d, icon: e.target.value }))} placeholder="emoji or text" style={{ width: '100%', padding: 8, borderRadius: 6, border: `1px solid ${theme.colors.border}` }} />
            </div>
          </div>

          <div>
            <label htmlFor="flex-component" style={{ display: 'block', marginBottom: 6, color: theme.colors.text.primary }}>Tab Component</label>
            <select id="flex-component" value={formData.component ? String(formData.component) : String(flexLayoutTab?.component || '')} onChange={(e) => setFormData(d => ({ ...d, component: e.target.value as FlexLayoutTabComponent }))} disabled={mode === FormDisplayMode.Edit} aria-disabled={mode === FormDisplayMode.Edit} style={{ padding: 8, borderRadius: 6, border: `1px solid ${theme.colors.border}`, width: '100%', opacity: mode === FormDisplayMode.Edit ? 0.6 : 1 }}>
              <option value="">(choose)</option>
              {componentsPair.map((c: { value: string; label: string }) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {/* Dates (readonly) */}
          { (flexLayoutTab?.createdDate || flexLayoutTab?.lastModifiedDate) && (
          <div style={{ marginBottom: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label htmlFor="flex-created" style={{ display: 'block', marginBottom: 6, color: theme.colors.text.primary }}>Created</label>
              <input id="flex-created" readOnly value={formatDate(flexLayoutTab?.createdDate as any)} style={{ width: '100%', padding: 8, borderRadius: 6, border: `1px solid ${theme.colors.border}`, backgroundColor: theme.colors.surface, cursor: 'default' }} />
            </div>
            <div>
              <label htmlFor="flex-updated" style={{ display: 'block', marginBottom: 6, color: theme.colors.text.primary }}>Updated</label>
              <input id="flex-updated" readOnly value={formatDate(flexLayoutTab?.lastModifiedDate as any)} style={{ width: '100%', padding: 8, borderRadius: 6, border: `1px solid ${theme.colors.border}`, backgroundColor: theme.colors.surface, cursor: 'default' }} />
            </div>
          </div>
        )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => { onCancel && onCancel(); }} style={{ padding: '0.5rem 1rem', borderRadius: 6, border: `1px solid ${theme.colors.border}`, background: theme.colors.surface }}>Cancel</button>
            <button type="submit" style={{ padding: '0.5rem 1rem', borderRadius: 6, border: 'none', background: theme.colors.primary, color: '#fff' }}>Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
