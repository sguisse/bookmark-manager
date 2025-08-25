import React, { useEffect, useMemo, useState } from 'react';
import { SidebarConfig, SidebarItemType, SidebarCategory, SidebarMenuGroup, SidebarMenuItem } from '../../../types/sidebar';
import { useTheme } from '../../../contexts/ThemeContext';
import { FormDisplayMode } from '../../../types/app';
import { v4 as uuidv4 } from 'uuid';

interface SidebarFormProps {
  mode?: FormDisplayMode;
  visible: boolean;
  config?: SidebarConfig | null;
  initial?: Partial<SidebarMenuItem> | null;
  onCancel: () => void;
  onCreate: (parentId: string | null, item: SidebarCategory | SidebarMenuGroup | SidebarMenuItem) => void;
}

export default function SidebarForm(props: Readonly<SidebarFormProps>) {
  const { mode = FormDisplayMode.Create, visible, config, initial, onCancel, onCreate } = props;
  const { theme } = useTheme();

  const [type, setType] = useState<SidebarItemType>(SidebarItemType.MenuItem);
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('');
  const [flexLayoutId, setFlexLayoutId] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);

  useEffect(() => {
    setType(SidebarItemType.MenuItem);
    setTitle(initial?.title || '');
    setIcon(initial?.icon || '');
    setFlexLayoutId((initial as any)?.flexLayoutId || '');
    setParentId(null);
  }, [initial, visible]);

  const allNodes = useMemo(() => {
    const out: Array<{ id: string; title: string; type: SidebarItemType }> = [];
    if (!config) return out;
    const traverse = (items: any[]) => {
      for (const it of items) {
        out.push({ id: it.id, title: it.title, type: it.type });
        if ('children' in it && Array.isArray(it.children)) traverse(it.children as any[]);
      }
    };
    traverse(config.sidebarItems as any[]);
    return out;
  }, [config]);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 6,
    background: theme.colors.background,
    color: theme.colors.text.primary
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return; // title mandatory

    const id = uuidv4();
    if (type === SidebarItemType.Category) {
      const cat: SidebarCategory = { id, title: title.trim(), type: SidebarItemType.Category, children: [] };
      onCreate(parentId, cat);
    } else if (type === SidebarItemType.MenuGroup) {
      const grp: SidebarMenuGroup = { id, title: title.trim(), type: SidebarItemType.MenuGroup, expanded: false, children: [] };
      onCreate(parentId, grp);
    } else {
      const item: SidebarMenuItem = { id, title: title.trim(), type: SidebarItemType.MenuItem, flexLayoutId: flexLayoutId || id };
      if (icon) (item as any).icon = icon;
      onCreate(parentId, item);
    }
    onCancel();
  };

  if (!visible) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      {/* backdrop: keep it under the modal content so clicks on the modal work */}
      <button
        type="button"
        aria-label="Close"
        onClick={onCancel}
        onKeyDown={(e) => { if (e.key === 'Escape') onCancel(); }}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', border: 'none', padding: 0, margin: 0, zIndex: 0 }}
      />

      <dialog open style={{ background: theme.colors.surface, padding: 16, borderRadius: 8, minWidth: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', position: 'relative', zIndex: 1, border: `1px solid ${theme.colors.border}` }}>
        <h3 style={{ marginTop: 0 }}>{mode === FormDisplayMode.Create ? 'Create Sidebar Item' : 'Edit Sidebar Item'}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 8 }}>
            <label htmlFor="sf-type" style={{ display: 'block', marginBottom: 4 }}>Type</label>
            <select id="sf-type" value={type} onChange={(e) => setType(e.target.value as SidebarItemType)} style={inputStyle}>
              <option value={SidebarItemType.MenuItem}>Menu Item</option>
              <option value={SidebarItemType.MenuGroup}>Menu Group</option>
              <option value={SidebarItemType.Category}>Category</option>
            </select>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label htmlFor="sf-title" style={{ display: 'block', marginBottom: 4 }}>Title</label>
            <input id="sf-title" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} autoFocus />
          </div>

          {/* fields conditional by type */}
          {type === SidebarItemType.MenuItem && (
            <>
              <div style={{ marginBottom: 8 }}>
                <label htmlFor="sf-icon" style={{ display: 'block', marginBottom: 4 }}>Icon (optional)</label>
                <input id="sf-icon" value={icon} onChange={(e) => setIcon(e.target.value)} style={inputStyle} placeholder="camera or https://..." />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label htmlFor="sf-flex" style={{ display: 'block', marginBottom: 4 }}>Flex layout id (optional)</label>
                <input id="sf-flex" value={flexLayoutId} onChange={(e) => setFlexLayoutId(e.target.value)} style={inputStyle} placeholder="layout id or leave empty to generate" />
              </div>
            </>
          )}

          <div style={{ marginBottom: 8 }}>
            <label htmlFor="sf-parent" style={{ display: 'block', marginBottom: 4 }}>Parent</label>
            <select id="sf-parent" value={parentId || ''} onChange={(e) => setParentId(e.target.value || null)} style={inputStyle}>
              <option value="">(root)</option>
              {allNodes.filter(n => n.type === SidebarItemType.Category || n.type === SidebarItemType.MenuGroup).map(n => (
                <option key={n.id} value={n.id}>{n.title} ({n.type})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
            <button type="button" onClick={onCancel} style={{ padding: '0.5rem 1rem', borderRadius: 6, border: `1px solid ${theme.colors.border}`, background: 'transparent' }}>Cancel</button>
            <button type="submit" style={{ padding: '0.5rem 1rem', borderRadius: 6, background: theme.colors.primary, color: '#fff' }}>Create</button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
