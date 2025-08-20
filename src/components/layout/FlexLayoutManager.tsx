import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Layout, Model, TabNode } from 'flexlayout-react';
import 'flexlayout-react/style/light.css';
import { useBookmarks } from '../../contexts/BookmarkContext';
import { FlexLayoutService } from '../../services/flexLayoutService';
import { Bookmark } from '../../types/bookmark';
import { useTheme } from '../../contexts/ThemeContext';
import BookmarkCard from '../bookmark/BookmarkCard';
import MarkdownTab from '../markdown/MarkdownTab';

interface FlexLayoutManagerProps {
  searchQuery?: string;
}

export default function FlexLayoutManager(props: Readonly<FlexLayoutManagerProps>) {
  const { searchQuery = '' } = props;
  const { groups, deleteGroup, deleteBookmark, notifySaved } = useBookmarks();
  const { theme } = useTheme();

  const initialModel = useMemo(() => {
    const saved = (FlexLayoutService as any).loadConfig ? (FlexLayoutService as any).loadConfig() : null;
    const config = saved && FlexLayoutService.isValidConfig(saved) ? saved : FlexLayoutService.createLayoutForGroups(groups);
    return Model.fromJson(config as any);
  }, []);

  const [model] = useState(() => initialModel);
  const modelRef = useRef(model);
  useEffect(() => { modelRef.current = model; }, [model]);

  useEffect(() => {
    // keep as placeholder for future reactions on groups changes
  }, [groups]);

  const onAction = useCallback((action: any) => {
    if (action.type && /model|add|remove|split|rename|move/i.test(action.type) && !/drag/i.test(action.type)) {
      setTimeout(() => {
        if ((FlexLayoutService as any).saveConfig) (FlexLayoutService as any).saveConfig(modelRef.current.toJson());
        notifySaved && notifySaved();
      }, 100);
    }
    return action;
  }, [notifySaved]);

  const onRenderTab = useCallback((node: TabNode, renderValues: any) => {
    const config = node.getConfig();
    const groupId = config?.groupId;
    const group = groups.find(g => g.id === groupId);
    if (group && node.getComponent() === 'BookmarkGroup') {
      renderValues.leading = (
        <div style={{ backgroundColor: group.color, width: 6, height: 18, borderRadius: 3, marginRight: 8 }} />
      );
    }
  }, [groups]);

  const onRenderTabSet = useCallback((tabSetNode: any, renderValues: any) => {
  const selectedTabNode = tabSetNode.getSelectedNode?.();
    if (selectedTabNode && selectedTabNode.getComponent() === 'BookmarkGroup') {
      const config = selectedTabNode.getConfig();
      const groupId = config?.groupId;
      const group = groups.find(g => g.id === groupId);
      if (!group) return;

      renderValues.buttons = renderValues.buttons || [];

      renderValues.buttons.push(
        <button
          key="open-all"
          className="flexlayout__tab_toolbar_button"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            group.bookmarks.forEach(bm => {
              if (bm.url) window.open(bm.url, '_blank', 'noopener,noreferrer');
            });
          }}
          title="Open all bookmarks"
        >
          🔗
        </button>
      );

      renderValues.buttons.push(
        <button
          key="add-bm"
          className="flexlayout__tab_toolbar_button"
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); /* a UI elsewhere would open form */ }}
          title="Add bookmark"
        >
          ➕
        </button>
      );

      renderValues.buttons.push(
        <button
          key="delete-group"
          className="flexlayout__tab_toolbar_button"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            if (confirm('Are you sure you want to delete this group and all its bookmarks?')) {
              deleteGroup(group.id);
            }
          }}
          title="Delete group"
        >
          🗑️
        </button>
      );
    }
  }, [groups, deleteGroup]);

  const factory = useCallback((node: TabNode) => {
    const component = node.getComponent();
    const config = node.getConfig();

    if (component === 'Welcome') {
      return (
        <div style={{ padding: 20 }}>
          <h2>Welcome</h2>
          <p>Create a group to get started.</p>
        </div>
      );
    }

    if (component === 'BookmarkGroup') {
      const groupId = config?.groupId;
      const group = groups.find(g => g.id === groupId);
      if (!group) return <div style={{ padding: 20 }}>Group not found</div>;

      const filtered = group.bookmarks.filter(b => (
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      ));

      return (
        <div style={{ padding: 12, height: '100%', overflow: 'auto', background: theme.colors.background }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 20, color: theme.colors.text.secondary }}>No bookmarks in this group</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
              {filtered.map((bm: Bookmark) => (
                <BookmarkCard
                  key={bm.id}
                  bookmark={bm}
                  onEdit={() => { /* open edit form via context in future */ }}
                  onDelete={() => { if (confirm('Delete bookmark?')) deleteBookmark(group.id, bm.id); }}
                />
              ))}
            </div>
          )}
        </div>
      );
    }

    if (component === 'MarkdownTab') {
      const cfg = config || {};
      return (
        <div style={{ height: '100%', overflow: 'auto', background: theme.colors.background }}>
          <MarkdownTab config={cfg} />
        </div>
      );
    }

    return <div>Unknown component: {component}</div>;
  }, [groups, searchQuery, theme.colors.background, theme.colors.text.secondary, deleteBookmark]);

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <Layout
        model={model}
        factory={factory}
        onRenderTab={onRenderTab}
        onRenderTabSet={onRenderTabSet}
        onAction={onAction}
      />
    </div>
  );
}
