import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { FlexTabComponent, FlexTabConfig } from '../../types/flexTabConfig';

interface FlexTabFormProps {
  flexTabConfig: FlexTabConfig,
  components?: Array<{ value: string; label: string }>;
  onSave: (update: { title?: string; color?: string; component?: string; componentConfig?: Record<string, any> }) => void;
  onCancel: () => void;
}

export default function FlexTabForm(props: Readonly<FlexTabFormProps>) {
  const { flexTabConfig, components, onSave, onCancel } = props;
  const { theme } = useTheme();

  // Default components list derived from the FlexTabComponent enum. This
  // ensures a single source of truth for available tab component types.
  const defaultComponents = Object.values(FlexTabComponent).map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }));
  const availableComponents = components && components.length > 0 ? components : defaultComponents;

  const [title, setTitle] = useState<string>(flexTabConfig?.title || '');
  const [color, setColor] = useState<string>(flexTabConfig?.color || '#3b82f6');
  const [component, setComponent] = useState<string>(flexTabConfig?.component || '');


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', { title, color, component });
    onSave({ title, color, component });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label htmlFor="flex-title" style={{ display: 'block', marginBottom: 6, color: theme.colors.text.primary }}>flexTabConfig Title</label>
        <input id="flex-title" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: `1px solid ${theme.colors.border}` }} />
      </div>

      <div>
        <label htmlFor="flex-color" style={{ display: 'block', marginBottom: 6, color: theme.colors.text.primary }}>Color</label>
        <input id="flex-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 80, height: 36, border: 'none', padding: 0 }} />
      </div>

      <div>
        <label htmlFor="flex-component" style={{ display: 'block', marginBottom: 6, color: theme.colors.text.primary }}>Tab Component</label>

        <select id="flex-component" value={component} onChange={(e) => setComponent(e.target.value)} style={{ padding: 8, borderRadius: 6, border: `1px solid ${theme.colors.border}`, width: '100%' }}>
          <option value="">(choose)</option>
          {availableComponents.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={{ padding: '0.5rem 1rem', borderRadius: 6, border: `1px solid ${theme.colors.border}`, background: theme.colors.surface }}>Cancel</button>
        <button type="submit" style={{ padding: '0.5rem 1rem', borderRadius: 6, border: 'none', background: theme.colors.primary, color: '#fff' }}>Save</button>
      </div>
    </form>
  );
}
