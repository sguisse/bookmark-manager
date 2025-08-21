import React, { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { FlexTabComponent, FlexTabFormData } from '../../types/flexTab';
import { FormDisplayMode } from '../../types/app';

interface FlexTabFormProps {
  flexTabConfig: Partial<FlexTabFormData>;
  components?: Array<{ value: string; label: string }>;
  onSave: (update: FlexTabFormData) => void;
  onCancel: () => void;
  mode?: FormDisplayMode;
}

export default function FlexLayoutTabForm(props: Readonly<FlexTabFormProps>) {
  const { flexTabConfig, components, onSave, onCancel, mode = FormDisplayMode.Edit } = props;
  const { theme } = useTheme();

  // Default components list derived from the FlexTabComponent enum.
  const defaultComponents = Object.values(FlexTabComponent).map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }));
  const availableComponents = components && components.length > 0 ? components : defaultComponents;

  const [title, setTitle] = useState<string>(mode === FormDisplayMode.Create ? '' : (flexTabConfig?.title || ''));
  const [color, setColor] = useState<string>(mode === FormDisplayMode.Create ? '' : (flexTabConfig?.color || '#3b82f6'));
  const [bgcolor, setBgcolor] = useState<string>(mode === FormDisplayMode.Create ? '' : (flexTabConfig?.bgcolor || ''));
  const [icon, setIcon] = useState<string>(mode === FormDisplayMode.Create ? '' : (flexTabConfig?.icon || ''));
  const [componentValue, setComponentValue] = useState<string>(mode === FormDisplayMode.Create ? '' : (flexTabConfig?.component || ''));

  // sync initial values only when the tab id changes to avoid clobbering user edits
  useEffect(() => {
    // sync when a new tab is opened (id change) or when mode changes (create vs edit)
    setTitle(mode === FormDisplayMode.Create ? '' : (flexTabConfig?.title || ''));
    setColor(mode === FormDisplayMode.Create ? '' : (flexTabConfig?.color || '#3b82f6'));
    setBgcolor(mode === FormDisplayMode.Create ? '' : (flexTabConfig?.bgcolor || ''));
    setIcon(mode === FormDisplayMode.Create ? '' : (flexTabConfig?.icon || ''));
    setComponentValue(mode === FormDisplayMode.Create ? '' : (flexTabConfig?.component || ''));
  }, [flexTabConfig?.id, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const update: FlexTabFormData = {
      id: flexTabConfig?.id || '',
      title: title || undefined,
      color: color || undefined,
      bgcolor: bgcolor || undefined,
      icon: icon || undefined,
      component: (componentValue as any) || undefined
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
        <h3 style={{ marginTop: 0 }}>Edit Tab</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label htmlFor="flex-title" style={{ display: 'block', marginBottom: 6, color: theme.colors.text.primary }}>Title</label>
            <input id="flex-title" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: `1px solid ${theme.colors.border}` }} />
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div>
              <label htmlFor="flex-color" style={{ display: 'block', marginBottom: 6, color: theme.colors.text.primary }}>Color</label>
              <input id="flex-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 80, height: 36, border: 'none', padding: 0 }} />
            </div>
            <div>
              <label htmlFor="flex-bgcolor" style={{ display: 'block', marginBottom: 6, color: theme.colors.text.primary }}>Background</label>
              <input id="flex-bgcolor" type="color" value={bgcolor} onChange={(e) => setBgcolor(e.target.value)} style={{ width: 80, height: 36, border: 'none', padding: 0 }} />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="flex-icon" style={{ display: 'block', marginBottom: 6, color: theme.colors.text.primary }}>Icon</label>
              <input id="flex-icon" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="emoji or text" style={{ width: '100%', padding: 8, borderRadius: 6, border: `1px solid ${theme.colors.border}` }} />
            </div>
          </div>

          <div>
            <label htmlFor="flex-component" style={{ display: 'block', marginBottom: 6, color: theme.colors.text.primary }}>Tab Component</label>
            <select id="flex-component" value={componentValue} onChange={(e) => setComponentValue(e.target.value)} disabled={mode === 'edit'} aria-disabled={mode === 'edit'} style={{ padding: 8, borderRadius: 6, border: `1px solid ${theme.colors.border}`, width: '100%', opacity: mode === 'edit' ? 0.6 : 1 }}>
              <option value="">(choose)</option>
              {availableComponents.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => { onCancel && onCancel(); }} style={{ padding: '0.5rem 1rem', borderRadius: 6, border: `1px solid ${theme.colors.border}`, background: theme.colors.surface }}>Cancel</button>
            <button type="submit" style={{ padding: '0.5rem 1rem', borderRadius: 6, border: 'none', background: theme.colors.primary, color: '#fff' }}>Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
