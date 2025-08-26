import React, { useEffect, useMemo, useState } from 'react';
import { SidebarConfig, SidebarItemType, SidebarItem } from '../../../types/sidebar';
import { useTheme } from '../../../contexts/ThemeContext';
import { FormDisplayMode } from '../../../types/app';
import { v4 as uuidv4 } from 'uuid';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Image from '../../common/image/Image';

interface SidebarFormProps {
  mode?: FormDisplayMode;
  visible: boolean;
  config?: SidebarConfig | null;
  initial?: Partial<SidebarItem> | null;
  onCancel: () => void;
  onCreate: (parentId: string | null, item: SidebarItem) => void;
}

export default function SidebarForm(props: Readonly<SidebarFormProps>) {
  const { mode = FormDisplayMode.Create, visible, config, initial, onCancel, onCreate } = props;
  const { theme } = useTheme();

  // If an initial item is provided, treat the form as Edit mode to avoid mismatch
  const effectiveMode = initial ? FormDisplayMode.Edit : mode;

  const [type, setType] = useState<SidebarItemType>(SidebarItemType.MenuItem);
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('');
  const [flexLayoutId, setFlexLayoutId] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [badgeLabel, setBadgeLabel] = useState('');
  const [badgeIcon, setBadgeIcon] = useState('');
  const [badgeColor, setBadgeColor] = useState('');
  const [badgeBgColor, setBadgeBgColor] = useState('');
  const [showBadgeOptions, setShowBadgeOptions] = useState(false);
  // store the preview text/value set on blur (could be image URL, emoji, or lucide icon name)
  const [iconPreviewValue, setIconPreviewValue] = useState('');
  const [badgeIconPreviewValue, setBadgeIconPreviewValue] = useState('');

  useEffect(() => {
    // Prefill values when opening the form in edit mode
    setType(initial?.type ?? SidebarItemType.MenuItem);
    setTitle(initial?.title || '');
    setIcon(initial?.icon || '');
    setIconPreviewValue(initial?.icon || '');
    setFlexLayoutId((initial as any)?.flexLayoutId || '');
    const existingBadge = (initial as any)?.badge;
    if (existingBadge) {
    setBadgeLabel(existingBadge.label || '');
    setBadgeIcon(existingBadge.icon || '');
    setBadgeColor(existingBadge.color || '');
    setBadgeBgColor(existingBadge.bgColor || '');
    setBadgeIconPreviewValue(existingBadge.icon || '');
      setShowBadgeOptions(true);
    } else {
      setBadgeLabel('');
      setBadgeIcon('');
      setBadgeColor('');
      setBadgeBgColor('');
      setShowBadgeOptions(false);
    }

    // Compute parentId by traversing the config to find the parent of the initial item
    const findParentId = (items: any[] | undefined, childId?: string): string | null => {
      if (!items || !childId) return null;
      for (const it of items) {
        if (it.children && Array.isArray(it.children)) {
          if (it.children.some((c: any) => c.id === childId)) return it.id;
          const deeper = findParentId(it.children, childId);
          if (deeper) return deeper;
        }
      }
      return null;
    };

    if (initial?.id && config) {
      const pid = findParentId(config.sidebarItems as any[], initial.id);
      setParentId(pid);
    } else {
      setParentId(null);
    }
  }, [initial, visible, config]);

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
      const cat: SidebarItem = { id, title: title.trim(), type: SidebarItemType.Category, children: [] };
      onCreate(parentId, cat);
    } else if (type === SidebarItemType.MenuGroup) {
      const grp: SidebarItem = { id, title: title.trim(), type: SidebarItemType.MenuGroup, expanded: false, children: [] };
      onCreate(parentId, grp);
    } else {
      const item: SidebarItem = { id, title: title.trim(), type: SidebarItemType.MenuItem, flexLayoutId: flexLayoutId || id };
      if (icon) (item as any).icon = icon;
      if (showBadgeOptions) {
        (item as any).badge = {
          id: uuidv4(),
          label: badgeLabel ? badgeLabel.trim() : '',
          icon: badgeIcon || undefined,
          color: badgeColor || undefined,
          bgColor: badgeBgColor || undefined
        };
      }
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
  <h3 style={{ marginBottom: '10px' }}>{effectiveMode === FormDisplayMode.Create ? 'Create Sidebar Item' : 'Edit Sidebar Item'}</h3>
        <form onSubmit={handleSubmit}>
          {/* Menu configuration block (CoreUI-like card) */}
          <div className="card mb-4" style={{ borderColor: theme.colors.border }}>
            <div className="card-header">
              <strong>Menu configuration</strong>
            </div>
            <div className="card-body">
              <div style={{ marginBottom: 8 }}>
                <label htmlFor="sf-type" style={{ display: 'block', marginBottom: 4 }}>Type</label>
                <select id="sf-type" value={type} onChange={(e) => setType(e.target.value as SidebarItemType)} style={inputStyle}>
                  <option value={SidebarItemType.MenuItem}>Menu Item</option>
                  <option value={SidebarItemType.MenuGroup}>Menu Group</option>
                  <option value={SidebarItemType.Category}>Category</option>
                </select>
              </div>

              <div style={{ marginBottom: 8 }}>
                <label htmlFor="sf-parent" style={{ display: 'block', marginBottom: 4 }}>Parent</label>
                <select id="sf-parent" value={parentId || ''} onChange={(e) => setParentId(e.target.value || null)} style={inputStyle}>
                  <option value="">(root)</option>
                  {allNodes.filter(n => n.type === SidebarItemType.Category || n.type === SidebarItemType.MenuGroup).map(n => (
                    <option key={n.id} value={n.id}>{n.title} ({n.type})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 8 }}>
                <label htmlFor="sf-title" style={{ display: 'block', marginBottom: 4 }}>Title</label>
                <input id="sf-title" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} autoFocus />
              </div>

              {/* fields conditional by type */}
              {type !== SidebarItemType.Category && (
                <>
                  <div style={{ marginBottom: 8 }}>
                    <label htmlFor="sf-icon" style={{ display: 'block', marginBottom: 4 }}>Icon (optional)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Image value={iconPreviewValue} size={20} rounded style={{ display: 'inline-block' }} />
                      <input id="sf-icon" value={icon} onChange={(e) => setIcon(e.target.value)} onBlur={() => setIconPreviewValue(icon)} style={inputStyle} placeholder="camera or https://..." />
                    </div>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <label htmlFor="sf-flex" style={{ display: 'block', marginBottom: 4 }}>Flex layout id (optional)</label>
                    <input id="sf-flex" value={flexLayoutId} onChange={(e) => setFlexLayoutId(e.target.value)} style={inputStyle} placeholder="layout id or leave empty to generate" />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Badge block with chevron */}
          <div>
            <div className="card mb-4" style={{ borderColor: theme.colors.border, marginTop: '10px' }}>
              <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <strong>Badge</strong>
                <button
                  type="button"
                  onClick={() => setShowBadgeOptions(s => !s)}
                  aria-expanded={showBadgeOptions}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {showBadgeOptions ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
              </div>
              {showBadgeOptions && (
                <div className="card-body">
                  <div style={{ marginBottom: 8 }}>
                    <label htmlFor="badge-label" style={{ display: 'block', marginBottom: 4 }}>Badge label</label>
                    <input id="badge-label" value={badgeLabel} onChange={(e) => setBadgeLabel(e.target.value)} style={inputStyle} placeholder="e.g. 12" />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <label htmlFor="badge-icon" style={{ display: 'block', marginBottom: 4 }}>Badge icon (optional)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Image value={badgeIconPreviewValue} size={20} rounded style={{ display: 'inline-block' }} />
                      <input id="badge-icon" value={badgeIcon} onChange={(e) => setBadgeIcon(e.target.value)} onBlur={() => setBadgeIconPreviewValue(badgeIcon)} style={inputStyle} placeholder="camera or https://..." />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <label htmlFor="badge-color" style={{ display: 'block', marginBottom: 4 }}>Text color</label>
                      <input id="badge-color" type="color" value={badgeColor || '#ffffff'} onChange={(e) => setBadgeColor(e.target.value)} style={{ width: '100%', height: 36, padding: 0, borderRadius: 6, border: `1px solid ${theme.colors.border}` }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label htmlFor="badge-bgcolor" style={{ display: 'block', marginBottom: 4 }}>Background color</label>
                      <input id="badge-bgcolor" type="color" value={badgeBgColor || '#1976d2'} onChange={(e) => setBadgeBgColor(e.target.value)} style={{ width: '100%', height: 36, padding: 0, borderRadius: 6, border: `1px solid ${theme.colors.border}` }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>



          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
            <button type="button" onClick={onCancel} style={{ padding: '0.5rem 1rem', borderRadius: 6, border: `1px solid ${theme.colors.border}`, background: 'transparent' }}>Cancel</button>
            <button type="submit" style={{ padding: '0.5rem 1rem', borderRadius: 6, background: theme.colors.primary, color: '#fff' }}>{effectiveMode === FormDisplayMode.Create ? 'Create' : 'Save'}</button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
