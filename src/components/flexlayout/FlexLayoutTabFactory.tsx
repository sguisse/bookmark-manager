import React from 'react';
import { BorderNode, ITabSetRenderValues, TabNode, TabSetNode } from 'flexlayout-react';
import BookmarksTabManager from '../bookmark/BookmarksTabManager';
import MarkdownTabManager from '../markdown/MarkdownTabManager';
import WebTabManager from '../web/WebTabManager';
import { FlexLayoutTabConfig } from '../../types/flexTab';
import { BookmarksTabConfig } from '../../types/bookmark';
import { MarkdownTabConfig } from '../../types/markdown';
import { WebTabConfig } from '../../types/web';
import { Plus, Settings, BookmarkPlusIcon, List, ExternalLink } from 'lucide-react';
import { readableTextColor } from '../../services/tUtils';

// helper: detect if an icon string looks like an image src (http, data:, or file path with image extension)
const isImageSrc = (val?: string) => {
  if (!val) return false;
  const hasImageExt = /\.(png|jpe?g|gif|svg|ico)(\?.*)?$/i.test(val);
  const isDataImage = /^data:image\//i.test(val);
  const isUrlLike = /^(https?:)?\/\//i.test(val) || val.startsWith('/');
  return isDataImage || hasImageExt || isUrlLike;
};

const renderIconElement = (val: string | undefined, key = 'icon', pill = false) => {
  if (!val) return null;
  if (isImageSrc(val)) {
    // small image (favicon or thumbnail)
    const size = pill ? 14 : 18;
    return <img key={key} src={val} alt="" style={{ width: size, height: size, objectFit: 'cover', borderRadius: 4, marginRight: pill ? 6 : 8 }} />;
  }
  return <span key={key} style={{ marginRight: 8 }}>{val}</span>;
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
    elements.push(renderIconElement(icon, 'icon', !!bgcolor));
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

            renderValues.buttons.push(
              <button
                key="bookmark-toggle-view"
                className="flexlayout__tab_toolbar_button"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  const nodeId = selectedTabNode.getId();
                  try { window.dispatchEvent(new CustomEvent('flexlayout:bookmarks:toggle-view', { detail: { nodeId } })); } catch (err) { console.warn('Event dispatch failed', err); }
                }}
                title="Toggle Card/Table View"
              >
                <List size={16} />
              </button>
            );

            renderValues.buttons.push(
              <button
                key="bookmark-open-all"
                className="flexlayout__tab_toolbar_button"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  const nodeId = selectedTabNode.getId();
                  try { window.dispatchEvent(new CustomEvent('flexlayout:bookmarks:open-all-urls', { detail: { nodeId } })); } catch (err) { console.warn('Event dispatch failed', err); }
                }}
                title="Open all bookmarks in new tabs"
              >
                <ExternalLink size={16} />
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
        if (comp === 'web') {
          renderValues.buttons.push(
            <button
              key="web-edit-url"
              className="flexlayout__tab_toolbar_button"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                const nodeId = selectedTabNode.getId();
                try { console.log('[FlexLayoutTabFactory] web-edit-url clicked', { nodeId }); } catch (err) { console.warn('Debug log failed', err); }
                try { window.dispatchEvent(new CustomEvent('flexlayout:web:toolbar', { detail: { nodeId, action: 'open-url-form' } })); } catch (err) { console.warn('Event dispatch failed', err); }
              }}
              title="Edit web URL"
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
    const title = cfg?.title;
    const bgcolor = cfg?.bgcolor;

    const leadingElements: any[] = [];
    const contentElements: any[] = [];
    const trailingElements: any[] = [];

    if (icon) {
      // reuse module-scope helper to render emojis/text or image URLs/data URLs
      const el = renderIconElement(icon, 'icon', !!bgcolor);
      if (el) leadingElements.push(el);
    }

    if (title) {
      contentElements.push(<span key="title" style={{ marginRight: 0, color: color }}>{title}</span>);
    }

    if (bgcolor) {
      contentElements.push(<span key="colordot" style={{ width: 10, height: 10, background: bgcolor, borderRadius: 3, display: 'inline-block', marginLeft: 8 }} />);
    }

    if (leadingElements.length > 0) {
      renderValues.leading = (
        <div style={{ display: 'inline-flex', alignItems: 'center'}}>
          {leadingElements}
        </div>
      );
    }

    if (contentElements.length > 0) {
      renderValues.content = (
        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
          {contentElements}
        </div>
      );
    }

    if (trailingElements.length > 0) {
      renderValues.trailing = (
        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
          {trailingElements}
        </div>
      );
    }


  };

  const factory = (node: TabNode) => {
    const component = node.getComponent();
    const config = node.getConfig() as FlexLayoutTabConfig;
    const compKey = String(component || '').toLowerCase();

    if (compKey === 'markdown') return <MarkdownTabManager nodeId={node.getId()} config={config as MarkdownTabConfig} onConfigChange={(cfg) => handleChildConfigChange(node.getId(), cfg)} />;
    if (compKey === 'bookmarks') return <BookmarksTabManager nodeId={node.getId()} config={config as BookmarksTabConfig} onConfigChange={(cfg) => handleChildConfigChange(node.getId(), cfg)} />;
    if (compKey === 'web') return <WebTabManager nodeId={node.getId()} config={config as WebTabConfig} onConfigChange={(cfg) => handleChildConfigChange(node.getId(), cfg)} />;

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
