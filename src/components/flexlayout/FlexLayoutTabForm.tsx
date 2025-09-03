import React, { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { FlexLayoutTabComponent, FlexLayoutTabFormData, FlexLayoutTabConfig } from '../../types/flexTab';
import { FormDisplayMode } from '../../types/app';
import { formatDate, normalizeColorForInput } from '../../services/Utils';
import Image from '../common/image/Image';

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
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: 8,
    borderRadius: 6,
    border: `1px solid ${theme.colors.border}`,
  };

  const [formData, setFormData] = useState<FlexLayoutTabFormData>(() => ({
    id: mode === FormDisplayMode.Create ? '' : (flexLayoutTab?.id || ''),
    title: mode === FormDisplayMode.Create ? '' : (flexLayoutTab?.title || ''),
    color: mode === FormDisplayMode.Create ? '' : (normalizeColorForInput(String(flexLayoutTab?.color || '')) || undefined),
    bgColor: mode === FormDisplayMode.Create ? '' : (normalizeColorForInput(String(((flexLayoutTab as any)?.bgcolor ?? flexLayoutTab?.bgColor) || '')) || undefined),
    tabBgColor: mode === FormDisplayMode.Create ? '' : (normalizeColorForInput(String(((flexLayoutTab as any)?.tabBgColor ?? (flexLayoutTab as any)?.tabbgcolor) || '')) || undefined),
    icon: mode === FormDisplayMode.Create ? '' : (flexLayoutTab?.icon || ''),
    component: mode === FormDisplayMode.Create ? undefined : flexLayoutTab?.component,
  }));

  // sync initial values only when the tab id changes to avoid clobbering user edits
  useEffect(() => {
    const newForm: FlexLayoutTabFormData = {
      id: mode === FormDisplayMode.Create ? '' : (flexLayoutTab?.id || ''),
      title: mode === FormDisplayMode.Create ? '' : (flexLayoutTab?.title || ''),
      color: mode === FormDisplayMode.Create ? '' : (normalizeColorForInput(String(flexLayoutTab?.color || '')) || undefined),
      bgColor: mode === FormDisplayMode.Create ? '' : (normalizeColorForInput(String(((flexLayoutTab as any)?.bgcolor ?? flexLayoutTab?.bgColor) || '')) || undefined),
      markColor: mode === FormDisplayMode.Create ? '' : (normalizeColorForInput(String(((flexLayoutTab as any)?.markColor ?? flexLayoutTab?.markColor) || '')) || undefined),
      tabBgColor: mode === FormDisplayMode.Create ? '' : (normalizeColorForInput(String(((flexLayoutTab as any)?.tabBgColor ?? (flexLayoutTab as any)?.tabbgcolor) || '')) || undefined),
      icon: mode === FormDisplayMode.Create ? '' : (flexLayoutTab?.icon || ''),
      component: mode === FormDisplayMode.Create ? undefined : flexLayoutTab?.component,
    };

    try {
      console.debug('[FlexLayoutTabForm] sync formData from flexLayoutTab', { flexLayoutTab, newForm });
    } catch (err) {
      // log if console inspect fails in some environments
      // eslint-disable-next-line no-console
      console.warn('[FlexLayoutTabForm] debug logging failed', err);
    }

    setFormData(newForm);
    // sync icon preview value with the form data
    setIconPreviewValue(newForm.icon || '');
  }, [flexLayoutTab?.id, flexLayoutTab?.title, flexLayoutTab?.component, flexLayoutTab?.color, flexLayoutTab?.bgColor, mode]);

  const [iconPreviewValue, setIconPreviewValue] = useState<string>(() => (mode === FormDisplayMode.Create ? '' : (flexLayoutTab?.icon || '')));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const update: FlexLayoutTabFormData = {
      id: flexLayoutTab?.id || '',
      title: formData.title || undefined,
      color: formData.color || undefined,
      bgColor: formData.bgColor || undefined,
        markColor: formData.markColor || undefined,
        tabBgColor: formData.tabBgColor || undefined,
      icon: formData.icon || undefined,
      component: (formData.component as FlexLayoutTabComponent) || undefined,
    };

    onSave(update);
  };

  // close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel && onCancel();
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <button
        onClick={() => onCancel && onCancel()}
        aria-label="Close modal"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
        }}
      />

      <div
        style={{
          position: 'relative',
          background: theme.colors.surface,
          padding: 20,
          borderRadius: 8,
          minWidth: 360,
          boxShadow: '0 6px 24px rgba(0,0,0,0.2)',
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>{mode === FormDisplayMode.Create ? 'Add new Tab' : 'Edit Tab'}</h3>

        {/* ID (readonly) */}
        {flexLayoutTab?.id && (
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="flex-id" style={{ display: 'block', marginBottom: 6, color: theme.colors.text.primary }}>ID</label>
            <input
              id="flex-id"
              readOnly
              value={flexLayoutTab.id}
              style={{
                width: '100%',
                padding: 8,
                borderRadius: 6,
                border: `1px solid ${theme.colors.border}`,
                backgroundColor: theme.colors.surface,
                cursor: 'default',
              }}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>

          {/* TabComponent (span both columns) */}
          <div style={{ display: 'grid', flexDirection: 'row' }}>
            <label htmlFor="flex-component" style={{ display: 'block', marginBottom: 6, color: theme.colors.text.primary }}>Tab Component</label>
            <select
              id="flex-component"
              value={formData.component ? String(formData.component) : String(flexLayoutTab?.component || '')}
              onChange={(e) => setFormData(d => ({ ...d, component: e.target.value as FlexLayoutTabComponent }))}
              disabled={mode === FormDisplayMode.Edit}
              aria-disabled={mode === FormDisplayMode.Edit}
              style={{ padding: 8, borderRadius: 6, border: `1px solid ${theme.colors.border}`, width: '100%', opacity: mode === FormDisplayMode.Edit ? 0.6 : 1 }}
            >
              <option value="">(choose)</option>
              {componentsPair.map((c: { value: string; label: string }) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', flexDirection: 'row', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Title */}
            <div>
              <label htmlFor="flex-title" style={{ display: 'block', marginBottom: 6, color: theme.colors.text.primary }}>Title</label>
              <input
                id="flex-title"
                value={formData.title}
                onChange={(e) => setFormData(d => ({ ...d, title: e.target.value }))}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: `1px solid ${theme.colors.border}` }}
              />
            </div>

            <div>
              <label htmlFor="flex-icon" style={{ display: 'block', marginBottom: 6, color: theme.colors.text.primary }}>Icon</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Image value={iconPreviewValue} size={20} rounded style={{ display: 'inline-block' }} />
                <input
                  id="flex-icon"
                  value={formData.icon}
                  onChange={(e) => setFormData(d => ({ ...d, icon: e.target.value }))}
                  onBlur={() => setIconPreviewValue(formData.icon || '')}
                  placeholder="emoji or text"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>


          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label htmlFor="color" style={{ display: 'block', marginBottom: 4 }}>Text color</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    id="color"
                    type="color"
                    aria-label="Text color"
                    value={formData.color || '#000000'}
                    onChange={(e) => setFormData(f => ({ ...f, color: e.target.value }))}
                    style={{ width: 48, height: 36, padding: 0, borderRadius: 6, border: `1px solid ${theme.colors.border}` }}
                  />
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: theme.colors.text.primary }}>
                    <input
                      type="checkbox"
                      checked={!formData.color}
                      onChange={(e) => setFormData(f => ({ ...f, color: e.target.checked ? '' : formData.color }))}
                      aria-label="Default Text color"
                    />
                    <span>Default</span>
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="bgColor" style={{ display: 'block', marginBottom: 4 }}>Background</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    id="bgColor"
                    type="color"
                    aria-label="Background color"
                    value={formData.bgColor || '#ffffff'}
                    onChange={(e) => setFormData(f => ({ ...f, bgColor: e.target.value }))}
                    style={{ width: 48, height: 36, padding: 0, borderRadius: 6, border: `1px solid ${theme.colors.border}` }}
                  />
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: theme.colors.text.primary }}>
                    <input
                      type="checkbox"
                      checked={!formData.bgColor}
                      onChange={(e) => setFormData(f => ({ ...f, bgColor: e.target.checked ? '' : formData.bgColor }))}
                      aria-label="Default Background color"
                    />
                    <span>Default</span>
                  </label>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
              <div>
                <label htmlFor="markColor" style={{ display: 'block', marginBottom: 4 }}>Mark color</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    id="markColor"
                    type="color"
                    aria-label="Mark color"
                    value={formData.markColor || '#000000'}
                    onChange={(e) => setFormData(f => ({ ...f, markColor: e.target.value }))}
                    style={{ width: 48, height: 36, padding: 0, borderRadius: 6, border: `1px solid ${theme.colors.border}` }}
                  />
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: theme.colors.text.primary }}>
                    <input
                      type="checkbox"
                      checked={!formData.markColor}
                      onChange={(e) => setFormData(f => ({ ...f, markColor: e.target.checked ? '' : formData.markColor }))}
                      aria-label="Default Mark color"
                    />
                    <span>Default</span>
                  </label>
                </div>
              </div>
              <div>
                <label htmlFor="tabBgColor" style={{ display: 'block', marginBottom: 4 }}>Tab background</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    id="tabBgColor"
                    type="color"
                    aria-label="Tab background color"
                    value={formData.tabBgColor || '#ffffff'}
                    onChange={(e) => setFormData(f => ({ ...f, tabBgColor: e.target.value }))}
                    style={{ width: 48, height: 36, padding: 0, borderRadius: 6, border: `1px solid ${theme.colors.border}` }}
                  />
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: theme.colors.text.primary }}>
                    <input
                      type="checkbox"
                      checked={!formData.tabBgColor}
                      onChange={(e) => setFormData(f => ({ ...f, tabBgColor: e.target.checked ? '' : formData.tabBgColor }))}
                      aria-label="Default Tab background color"
                    />
                    <span>Default</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Dates (readonly) */}
          {(flexLayoutTab?.createdDate || flexLayoutTab?.lastModifiedDate) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label htmlFor="flex-created" style={{ display: 'block', marginBottom: 6, color: theme.colors.text.primary }}>Created</label>
                <input
                  id="flex-created"
                  readOnly
                  value={formatDate(flexLayoutTab?.createdDate as any)}
                  style={{
                    width: '100%',
                    padding: 8,
                    borderRadius: 6,
                    border: `1px solid ${theme.colors.border}`,
                    backgroundColor: theme.colors.surface,
                    cursor: 'default',
                  }}
                />
              </div>

              <div>
                <label htmlFor="flex-updated" style={{ display: 'block', marginBottom: 6, color: theme.colors.text.primary }}>Updated</label>
                <input
                  id="flex-updated"
                  readOnly
                  value={formatDate(flexLayoutTab?.lastModifiedDate as any)}
                  style={{
                    width: '100%',
                    padding: 8,
                    borderRadius: 6,
                    border: `1px solid ${theme.colors.border}`,
                    backgroundColor: theme.colors.surface,
                    cursor: 'default',
                  }}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => { onCancel && onCancel(); }}
                style={{ padding: '0.5rem 1rem', borderRadius: 6, border: `1px solid ${theme.colors.border}`, background: theme.colors.surface }}
              >
                Cancel
              </button>
              <button type="submit" style={{ padding: '0.5rem 1rem', borderRadius: 6, border: 'none', background: theme.colors.primary, color: '#fff' }}>
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
