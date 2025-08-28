import React, { useEffect, useMemo, useState } from 'react';
import { SidebarConfig, SidebarItemType, SidebarItem } from '../../../types/sidebar';
import { useTheme } from '../../../contexts/ThemeContext';
import { FormDisplayMode } from '../../../types/app';
import { v4 as uuidv4 } from 'uuid';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Image from '../../common/image/Image';
import { formatDate } from '../../../services/Utils';

interface SidebarFormProps {
  mode?: FormDisplayMode;
  visible: boolean;
  config?: SidebarConfig | null;
  sidebarItem?: Partial<SidebarItem> | null;
  onCancel: () => void;
  onCreate: (parentId: string | null, item: SidebarItem) => void;
}

export default function SidebarForm(props: Readonly<SidebarFormProps>) {
  const { mode = FormDisplayMode.Create, visible, config, sidebarItem, onCancel, onCreate } = props;
  const { theme } = useTheme();

  // Single form state for all fields (initialized from `sidebarItem` when provided)
  type FormDataType = {
    type: SidebarItemType;
    title: string;
    icon: string;
    iconPreviewValue: string;
    flexLayoutId: string;
    parentId: string | null;
    badge: { title: string; icon: string; color: string; bgColor: string } | null;
    showBadgeOptions: boolean;
  };

  const [formData, setFormData] = useState<FormDataType>(() => ({
    type: (sidebarItem?.type as SidebarItemType) ?? SidebarItemType.MenuItem,
    title: sidebarItem?.title ?? '',
    icon: sidebarItem?.icon ?? '',
    iconPreviewValue: sidebarItem?.icon ?? '',
    flexLayoutId: ((sidebarItem as any)?.flexLayoutId) ?? '',
    parentId: null,
    badge: (sidebarItem as any)?.badge ? {
      title: (sidebarItem as any).badge.title || '',
      icon: (sidebarItem as any).badge.icon || '',
      color: (sidebarItem as any).badge.color || '',
      bgColor: (sidebarItem as any).badge.bgColor || ''
    } : null,
    showBadgeOptions: !!((sidebarItem as any)?.badge)
  }));

  useEffect(() => {
    // Prefill values when opening the form in edit mode or when sidebarItem/config changes
    const existingBadge = (sidebarItem as any)?.badge;
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

    const pid = (sidebarItem?.id && config) ? findParentId(config.sidebarItems as any[], sidebarItem.id) : null;

    setFormData({
      type: (sidebarItem?.type as SidebarItemType) ?? SidebarItemType.MenuItem,
      title: sidebarItem?.title ?? '',
      icon: sidebarItem?.icon ?? '',
      iconPreviewValue: sidebarItem?.icon ?? '',
      flexLayoutId: ((sidebarItem as any)?.flexLayoutId) ?? '',
      parentId: pid,
      badge: existingBadge ? {
        title: existingBadge.title || '',
        icon: existingBadge.icon || '',
        color: existingBadge.color || '',
        bgColor: existingBadge.bgColor || ''
      } : null,
      showBadgeOptions: !!existingBadge
    });
  }, [sidebarItem, visible, config]);

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
    if (!formData.title.trim()) return; // title mandatory

    const editing = mode === FormDisplayMode.Edit && !!sidebarItem?.id;
    const id = editing ? String(sidebarItem.id) : uuidv4();

    if (formData.type === SidebarItemType.Category) {
      const cat: SidebarItem = {
        ...(editing ? (sidebarItem as SidebarItem) : {}),
        id,
        title: formData.title.trim(),
        type: SidebarItemType.Category,
        // ensure flexLayoutId is present because SidebarItem.flexLayoutId is required
        flexLayoutId: formData.flexLayoutId || (editing ? ((sidebarItem as any).flexLayoutId || id) : id),
        children: (editing && (sidebarItem as any).children) ? (sidebarItem as any).children : []
      };
      onCreate(formData.parentId ?? null, cat);
    } else if (formData.type === SidebarItemType.MenuGroup) {
      const grp: SidebarItem = {
        ...(editing ? (sidebarItem as SidebarItem) : {}),
        id,
        title: formData.title.trim(),
        type: SidebarItemType.MenuGroup,
        expanded: (editing && (sidebarItem as any).expanded) ? (sidebarItem as any).expanded : false,
        // ensure flexLayoutId is present for consistency
        flexLayoutId: formData.flexLayoutId || (editing ? ((sidebarItem as any).flexLayoutId || id) : id),
        children: (editing && (sidebarItem as any).children) ? (sidebarItem as any).children : []
      };
      onCreate(formData.parentId ?? null, grp);
    } else {
      const item: SidebarItem = {
        ...(editing ? (sidebarItem as SidebarItem) : {}),
        id,
        title: formData.title.trim(),
        type: SidebarItemType.MenuItem,
        flexLayoutId: formData.flexLayoutId || (editing ? ((sidebarItem as any).flexLayoutId || id) : id)
      } as SidebarItem;
      if (formData.icon) (item as any).icon = formData.icon;
      if (formData.showBadgeOptions && formData.badge) {
        (item as any).badge = {
          id: editing && (sidebarItem as any).badge ? (sidebarItem as any).badge.id : uuidv4(),
          title: formData.badge.title ? formData.badge.title.trim() : '',
          icon: formData.badge.icon || undefined,
          color: formData.badge.color || undefined,
          bgColor: formData.badge.bgColor || undefined
        } as any;
      }
      onCreate(formData.parentId ?? null, item);
    }
    onCancel();
  };

  // Helper to update badge ensuring all fields are present (avoids partial / undefined)
  const updateBadge = (partial: Partial<{ title: string; icon: string; color: string; bgColor: string }>) => {
    setFormData(f => {
      const existing = f.badge ?? { title: '', icon: '', color: '', bgColor: '' };
      return {
        ...f,
        badge: {
          title: partial.title ?? existing.title,
          icon: partial.icon ?? existing.icon,
          color: partial.color ?? existing.color,
          bgColor: partial.bgColor ?? existing.bgColor
        },
        showBadgeOptions: true
      };
    });
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
  <h3 style={{ marginBottom: '10px' }}>{mode === FormDisplayMode.Create ? 'Create Sidebar Item' : 'Edit Sidebar Item'}</h3>

        {/* show id (readonly) when editing an existing sidebar item */}
        {mode === FormDisplayMode.Edit && sidebarItem && (
          <div style={{ marginTop: '0.5rem', marginBottom: '0.75rem' }}>
            <label htmlFor="sidebar-id" style={{ display: 'block', marginBottom: '0.5rem', fontSize: 12, fontWeight: 500, color: theme.colors.text.primary }}>ID</label>
            <input id="sidebar-id" type="text" readOnly value={sidebarItem.id} style={{ ...inputStyle, width: '100%', backgroundColor: theme.colors.surface ?? theme.colors.background, cursor: 'default' }} />
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* layout two columns: left = menu config, right = badge config */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1 / 2' }}>
              {/* Menu configuration block (CoreUI-like card) */}
              <div className="card mb-4" style={{ borderColor: theme.colors.border }}>
                <div className="card-header">
                  <strong>Menu configuration</strong>
                </div>
                <div className="card-body">
                  <div style={{ marginBottom: 8 }}>
                    <label htmlFor="sf-type" style={{ display: 'block', marginBottom: 4 }}>Type</label>
                    <select id="sf-type" value={formData.type} onChange={(e) => setFormData(f => ({ ...f, type: e.target.value as SidebarItemType }))} style={inputStyle}>
                      <option value={SidebarItemType.MenuItem}>Menu Item</option>
                      <option value={SidebarItemType.MenuGroup}>Menu Group</option>
                      <option value={SidebarItemType.Category}>Category</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: 8 }}>
                    <label htmlFor="sf-parent" style={{ display: 'block', marginBottom: 4 }}>Parent</label>
                    <select id="sf-parent" value={formData.parentId || ''} onChange={(e) => setFormData(f => ({ ...f, parentId: e.target.value || null }))} style={inputStyle}>
                      <option value="">(root)</option>
                      {allNodes.filter(n => n.type === SidebarItemType.Category || n.type === SidebarItemType.MenuGroup).map(n => (
                        <option key={n.id} value={n.id}>{n.title} ({n.type})</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: 8 }}>
                    <label htmlFor="sf-title" style={{ display: 'block', marginBottom: 4 }}>Title</label>
                    <input id="sf-title" value={formData.title} onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))} style={inputStyle} autoFocus />
                  </div>

                  {/* fields conditional by type */}
                  {formData.type !== SidebarItemType.Category && (
                    <>
                      <div style={{ marginBottom: 8 }}>
                          <label htmlFor="sf-icon" style={{ display: 'block', marginBottom: 4 }}>Icon (optional)</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Image value={formData.iconPreviewValue} size={20} rounded style={{ display: 'inline-block' }} />
                            <input id="sf-icon" value={formData.icon} onChange={(e) => setFormData(f => ({ ...f, icon: e.target.value }))} onBlur={() => setFormData(f => ({ ...f, iconPreviewValue: f.icon }))} style={inputStyle} placeholder="camera or https://..." />
                          </div>
                        </div>
                      <div style={{ marginBottom: 8 }}>
                        <label htmlFor="sf-flex" style={{ display: 'block', marginBottom: 4 }}>Flex layout id (optional)</label>
                        <input id="sf-flex" value={formData.flexLayoutId} onChange={(e) => setFormData(f => ({ ...f, flexLayoutId: e.target.value }))} style={inputStyle} placeholder="layout id or leave empty to generate" />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div style={{ gridColumn: '2 / 3' }}>
              {/* Badge block with chevron */}
              <div className="card mb-4" style={{ borderColor: theme.colors.border, marginTop: '0' }}>
                <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <strong>Badge</strong>
                  <button
                    type="button"
                    onClick={() => setFormData(f => ({ ...f, showBadgeOptions: !f.showBadgeOptions }))}
                    aria-expanded={formData.showBadgeOptions}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    {formData.showBadgeOptions ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                </div>
                {formData.showBadgeOptions && (
                  <div className="card-body">
                    <div style={{ marginBottom: 8 }}>
                      <label htmlFor="badge-label" style={{ display: 'block', marginBottom: 4 }}>Badge label</label>
                      <input id="badge-label" value={formData.badge?.title || ''} onChange={(e) => updateBadge({ title: e.target.value })} style={inputStyle} placeholder="e.g. 12" />
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label htmlFor="badge-icon" style={{ display: 'block', marginBottom: 4 }}>Badge icon (optional)</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Image value={formData.badge?.icon || ''} size={20} rounded style={{ display: 'inline-block' }} />
                        <input id="badge-icon" value={formData.badge?.icon || ''} onChange={(e) => updateBadge({ icon: e.target.value })} onBlur={() => updateBadge({ icon: formData.badge?.icon || '' })} style={inputStyle} placeholder="camera or https://..." />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <label htmlFor="badge-color" style={{ display: 'block', marginBottom: 4 }}>Text color</label>
                        <input id="badge-color" type="color" value={formData.badge?.color || '#ffffff'} onChange={(e) => updateBadge({ color: e.target.value })} style={{ width: '100%', height: 36, padding: 0, borderRadius: 6, border: `1px solid ${theme.colors.border}` }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label htmlFor="badge-bgcolor" style={{ display: 'block', marginBottom: 4 }}>Background color</label>
                        <input id="badge-bgcolor" type="color" value={formData.badge?.bgColor || '#1976d2'} onChange={(e) => updateBadge({ bgColor: e.target.value })} style={{ width: '100%', height: 36, padding: 0, borderRadius: 6, border: `1px solid ${theme.colors.border}` }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>



          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
            <button type="button" onClick={onCancel} style={{ padding: '0.5rem 1rem', borderRadius: 6, border: `1px solid ${theme.colors.border}`, background: 'transparent' }}>Cancel</button>
            <button type="submit" style={{ padding: '0.5rem 1rem', borderRadius: 6, background: theme.colors.primary, color: '#fff' }}>{mode === FormDisplayMode.Create ? 'Create' : 'Save'}</button>
          </div>
          {/* Created / Updated timestamps (edit-only) shown as the last row in two columns */}
          {mode === FormDisplayMode.Edit && sidebarItem && (
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label htmlFor="sidebar-created" style={{ display: 'block', marginBottom: 4, fontSize: 12, fontWeight: 500, color: theme.colors.text.primary }}>Created</label>
                <input id="sidebar-created" type="text" readOnly value={formatDate(sidebarItem.createdDate)} style={{ ...inputStyle, backgroundColor: theme.colors.surface ?? theme.colors.background, cursor: 'default' }} />
              </div>
              <div>
                <label htmlFor="sidebar-updated" style={{ display: 'block', marginBottom: 4, fontSize: 12, fontWeight: 500, color: theme.colors.text.primary }}>Updated</label>
                <input id="sidebar-updated" type="text" readOnly value={formatDate(sidebarItem.lastModifiedDate)} style={{ ...inputStyle, backgroundColor: theme.colors.surface ?? theme.colors.background, cursor: 'default' }} />
              </div>
            </div>
          )}
        </form>
      </dialog>
    </div>
  );
}
