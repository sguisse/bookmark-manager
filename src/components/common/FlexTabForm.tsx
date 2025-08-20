import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { BookmarkGroup } from '../../types/bookmark';

interface FlexTabFormProps {
  group?: BookmarkGroup | null;
  onSave: (update: Partial<BookmarkGroup>) => void;
  onCancel: () => void;
}

export default function FlexTabForm(props: Readonly<FlexTabFormProps>) {
  const { group, onSave, onCancel } = props;
  const { theme } = useTheme();

  const [title, setTitle] = useState(group?.title || '');
  const [color, setColor] = useState(group?.color || '#3b82f6');
  const [tabComponent, setTabComponent] = useState(group?.tabComponent || 'BookmarkGroup');
  const [markdownContent, setMarkdownContent] = useState<string>(group?.tabConfig?.content || '');

  useEffect(() => {
    setTitle(group?.title || '');
    setColor(group?.color || '#3b82f6');
    setTabComponent(group?.tabComponent || 'BookmarkGroup');
    setMarkdownContent(group?.tabConfig?.content || '');
  }, [group]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const update: Partial<BookmarkGroup> = {
      title: title.trim(),
      color,
      tabComponent,
      tabConfig: tabComponent === 'MarkdownTab' ? { content: markdownContent } : undefined
    };
    onSave(update);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label htmlFor="flex-title" style={{ display: 'block', marginBottom: 6, color: theme.colors.text.primary }}>Group Title</label>
        <input id="flex-title" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: `1px solid ${theme.colors.border}` }} />
      </div>

      <div>
        <label htmlFor="flex-color" style={{ display: 'block', marginBottom: 6, color: theme.colors.text.primary }}>Color</label>
        <input id="flex-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 80, height: 36, border: 'none', padding: 0 }} />
      </div>

      <div>
        <label htmlFor="flex-component" style={{ display: 'block', marginBottom: 6, color: theme.colors.text.primary }}>Tab Component</label>
        <select id="flex-component" value={tabComponent} onChange={(e) => setTabComponent(e.target.value)} style={{ padding: 8, borderRadius: 6, border: `1px solid ${theme.colors.border}`, width: '100%' }}>
          <option value="BookmarkGroup">Bookmarks Tab</option>
          <option value="MarkdownTab">Markdown Tab</option>
        </select>
      </div>

      {tabComponent === 'MarkdownTab' && (
        <div>
          <label htmlFor="flex-markdown" style={{ display: 'block', marginBottom: 6, color: theme.colors.text.primary }}>Markdown Content</label>
          <textarea id="flex-markdown" value={markdownContent} onChange={(e) => setMarkdownContent(e.target.value)} rows={8} style={{ width: '100%', padding: 8, borderRadius: 6, border: `1px solid ${theme.colors.border}` }} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={{ padding: '0.5rem 1rem', borderRadius: 6, border: `1px solid ${theme.colors.border}`, background: theme.colors.surface }}>Cancel</button>
        <button type="submit" style={{ padding: '0.5rem 1rem', borderRadius: 6, border: 'none', background: theme.colors.primary, color: '#fff' }}>Save</button>
      </div>
    </form>
  );
}
