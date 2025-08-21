import { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { MarkdownTabConfig } from '../../types/markdown';

interface MarkdownTabProps {
  config?: MarkdownTabConfig;
  onConfigChange?: (cfg: MarkdownTabConfig) => void;
}

export default function MarkdownTabManager(props: Readonly<MarkdownTabProps>) {
  const { config, onConfigChange } = props;
  const { theme } = useTheme();

  const initial = config?.content || '';
  const [content, setContent] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [localTitle, setLocalTitle] = useState<string>(config?.title || 'Markdown');
  const [localColor, setLocalColor] = useState<string>(config?.color || '');
  const [localIcon, setLocalIcon] = useState<string>(config?.icon || '');

  useEffect(() => {
    setContent(config?.content || '');
  }, [config?.content]);

  const save = () => {
    setEditing(false);
  if (onConfigChange) onConfigChange({ ...(config || {} as any), content, title: localTitle, color: localColor, icon: localIcon, id: (config as any)?.id || '' });
  };

  return (
    <div style={{ padding: 16, color: theme.colors.text.primary, background: theme.colors.background, height: '100%' }}>
      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} style={{ width: '100%', minHeight: 200 }} />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setEditing(false)} style={{ padding: '0.5rem 1rem' }}>Cancel</button>
            <button onClick={save} style={{ padding: '0.5rem 1rem', background: theme.colors.primary, color: '#fff' }}>Save</button>
          </div>
        </div>
      ) : (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace', flex: 1, overflow: 'auto' }}>
            {content}
          </div>
          {onConfigChange && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input value={localTitle} onChange={(e) => setLocalTitle(e.target.value)} placeholder="Tab title" />
                    <input value={localIcon} onChange={(e) => setLocalIcon(e.target.value)} placeholder="Icon" style={{ width: 120 }} />
                    <input type="color" value={localColor} onChange={(e) => setLocalColor(e.target.value)} />
                    <button onClick={() => setEditing(true)} style={{ padding: '0.4rem 0.8rem' }}>Edit</button>
                  </div>
                </div>
              )}
        </div>
      )}
    </div>
  );
}
