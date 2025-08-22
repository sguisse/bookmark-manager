import React from 'react';
import { BorderNode, ITabSetRenderValues, TabNode, TabSetNode } from 'flexlayout-react';
import WelcomeTab from '../welcome/WelcomeTabManager';
import BookmarksTabManager from '../bookmark/BookmarksTabManager';
import MarkdownTabManager from '../markdown/MarkdownTabManager';
import { FlexTabConfig } from '../../types/flexTab';
import { BookmarksTabConfig } from '../../types/bookmark';
import { MarkdownTabConfig } from '../../types/markdown';
import { Plus, Settings, Bookmark as BookmarkIcon, BookmarkPlusIcon } from 'lucide-react';

// small helper to pick readable text color for a background
const readableTextColor = (bg: string) => {
  const hex = (bg || '').replace('#', '');
  const normalized = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex;
  const bigint = parseInt(normalized || '000000', 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  const l = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return l > 0.6 ? '#000' : '#fff';
};

export const onRenderTab = (node: TabNode, renderValues: any) => {
  const cfg = node.getConfig();
  const color = cfg?.color;
  const icon = cfg?.icon;
  const bgcolor = cfg?.bgcolor;

  const elements: any[] = [];

  if (bgcolor) {
    const text = icon || (String(node.getName ? node.getName() : node.getId()).charAt(0).toUpperCase());
    elements.push(
      <span key="bgpill" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '2px 8px', borderRadius: 6, background: bgcolor, color: readableTextColor(bgcolor), fontSize: 12, marginRight: 8 }}>
        {text}
      </span>
    );
  } else if (icon) {
    elements.push(
      <span key="icon" style={{ marginRight: 8 }}>{icon}</span>
    );
  }

  if (color) {
    elements.push(
      <span key="colordot" style={{ width: 10, height: 10, background: color, borderRadius: 3, display: 'inline-block', marginRight: 8 }} />
    );
  }

  if (elements.length > 0) {
    renderValues.leading = (
      <div style={{ display: 'inline-flex', alignItems: 'center' }}>
        {elements}
        {renderValues.leading}
      </div>
    );
  }
};

// create a bound onRenderTabSet using the provided openTabEditor callback
import { FormDisplayMode } from '../../types/app';

const buildOnRenderTabSet = (openTabEditor?: (nodeId: string, mode?: FormDisplayMode) => void) => {
  return (tabSetNode: (TabSetNode | BorderNode), renderValues: ITabSetRenderValues) => {
    try {
      const selectedTabNode: TabNode | null = tabSetNode.getSelectedNode() as TabNode | null;
      if (!selectedTabNode) return;
      const comp = String(selectedTabNode.getComponent() || '').toLowerCase();

      renderValues.buttons = renderValues.buttons || [];
      renderValues.stickyButtons = renderValues.stickyButtons || [];

      renderValues.stickyButtons.push(
          <button
            key="tab-editor-open-add"
            className="flexlayout__tab_toolbar_button"
              onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  const nodeId = selectedTabNode.getId();
                      try { console.log('[FlexLayoutTabFactory] tab-editor-open-add clicked', { nodeId }); } catch (err) { console.warn('Debug log failed', err); }
                            if (openTabEditor) openTabEditor(nodeId, FormDisplayMode.Create);
                      // fallback: dispatch a global event so listeners (including older code) can respond
                      try { window.dispatchEvent(new CustomEvent('flexlayout:tab:open-editor', { detail: { nodeId, mode: FormDisplayMode.Create } })); } catch (err) { console.warn('Event dispatch failed', err); }
                }}
            title="Add new Tab"
          >
            <Plus size={16} />
          </button>
        );

        renderValues.stickyButtons.push(
          <button
            key="tab-editor-open-edit"
            className="flexlayout__tab_toolbar_button"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              const nodeId = selectedTabNode.getId();
              try { console.log('[FlexLayoutTabFactory] tab-editor-open-edit clicked', { nodeId }); } catch (err) { console.warn('Debug log failed', err); }
                            if (openTabEditor) openTabEditor(nodeId, FormDisplayMode.Edit);
              try { window.dispatchEvent(new CustomEvent('flexlayout:tab:open-editor', { detail: { nodeId, mode: FormDisplayMode.Edit } })); } catch (err) { console.warn('Event dispatch failed', err); }
            }}
            title="Edit tab config"
          >
            <Settings size={16} />
          </button>
        );


  if (comp === 'bookmarks') {
              renderValues.buttons.push(
              <button
                key="bookmark-editor-open-add"
                className="flexlayout__tab_toolbar_button"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  const nodeId = selectedTabNode.getId();
                  try { console.log('[FlexLayoutTabFactory] bookmark-editor-open-add clicked', { nodeId }); } catch (err) { console.warn('Debug log failed', err); }
                  // signal the bookmarks manager (it listens for this event) to open the add-bookmark modal
                  try { window.dispatchEvent(new CustomEvent('flexlayout:bookmarks:toolbar', { detail: { nodeId, mode: FormDisplayMode.Create } })); } catch (err) { console.warn('Event dispatch failed', err); }
                }}
                title="Add new Bookmark"
              >
                <BookmarkPlusIcon size={16} />
              </button>
            );

        }
      if (comp === 'markdown') {
        renderValues.buttons.push(
          <button
            key="markdown-editor-toggle"
            className="flexlayout__tab_toolbar_button"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              const nodeId = selectedTabNode.getId();
              try { console.log('[FlexLayoutTabFactory] markdown-editor-toggle clicked', { nodeId }); } catch (err) { console.warn('Debug log failed', err); }
              try { window.dispatchEvent(new CustomEvent('flexlayout:markdown:toolbar', { detail: { nodeId, mode: FormDisplayMode.Edit } })); } catch (err) { console.warn('Event dispatch failed', err); }
            }}
            title="Edit markdown"
          >
            <Settings size={16} />
          </button>
        );
      }
      // future: render markdown-specific controls if needed

    } catch (err) {
      console.warn('onRenderTabSet error', err);
    }
  };
};

export const createFlexLayoutFactory = (handleChildConfigChange: (nodeId: string, cfg: any) => void, openTabEditor?: (nodeId: string, mode?: FormDisplayMode) => void) => {
  const onRenderTabSet = buildOnRenderTabSet(openTabEditor);

  // create a bound onRenderTab that can call openTabEditor when the leading element is clicked
  const boundOnRenderTab = (node: TabNode, renderValues: any) => {
    const cfg = node.getConfig();
    const color = cfg?.color;
    const icon = cfg?.icon;
    const bgcolor = cfg?.bgcolor;

    const elements: any[] = [];

    const makeClickable = (child: any) => {
      if (!openTabEditor) return child;
      return (
        <button onClick={(e: React.MouseEvent) => { e.stopPropagation(); try { openTabEditor(node.getId(), FormDisplayMode.Edit); } catch (err) { console.warn('openTabEditor failed', err); } }} style={{ cursor: 'pointer', border: 'none', background: 'transparent', padding: 0 }} aria-label="Edit tab">
          {child}
        </button>
      );
    };

    if (bgcolor) {
      const text = icon || (String(node.getName ? node.getName() : node.getId()).charAt(0).toUpperCase());
      elements.push(
        makeClickable(
          <span key="bgpill" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '2px 8px', borderRadius: 6, background: bgcolor, color: readableTextColor(bgcolor), fontSize: 12, marginRight: 8 }}>
            {text}
          </span>
        )
      );
    } else if (icon) {
      elements.push(makeClickable(<span key="icon" style={{ marginRight: 8 }}>{icon}</span>));
    }

    if (color) {
      elements.push(makeClickable(<span key="colordot" style={{ width: 10, height: 10, background: color, borderRadius: 3, display: 'inline-block', marginRight: 8 }} />));
    }

    if (elements.length > 0) {
      renderValues.leading = (
        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
          {elements}
          {renderValues.leading}
        </div>
      );
    }
  };

  const factory = (node: TabNode) => {
    const component = node.getComponent();
    const config = node.getConfig() as FlexTabConfig;
    const compKey = String(component || '').toLowerCase();

    if (compKey === 'welcome') return <WelcomeTab />;
    if (compKey === 'markdown') return <MarkdownTabManager nodeId={node.getId()} config={config as MarkdownTabConfig} onConfigChange={(cfg) => handleChildConfigChange(node.getId(), cfg)} />;
    if (compKey === 'bookmarks') return <BookmarksTabManager nodeId={node.getId()} config={config as BookmarksTabConfig} onConfigChange={(cfg) => handleChildConfigChange(node.getId(), cfg)} />;

    return (
      <div style={{ padding: 12 }}>
        <div><strong>{String(component)}</strong> component not found !</div>
        <div style={{ marginTop: 8, fontSize: 16, color: '#444' }}>Here, it is his configuration :</div>
        <pre>
          {config && Object.keys(config).length > 0 && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#444' }}>{JSON.stringify(config)}</div>
          )}
          {(!config || Object.keys(config).length === 0) && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#444' }}>No configuration found</div>
          )}
        </pre>
      </div>
    );
  };

  return { factory, onRenderTabSet, onRenderTab: boundOnRenderTab };
};

export default createFlexLayoutFactory;
