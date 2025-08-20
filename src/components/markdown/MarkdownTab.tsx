import { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { MarkdownTabConfig } from '../../types/markdown';

interface MarkdownTabProps {
  config?: MarkdownTabConfig;
  onConfigChange?: (cfg: MarkdownTabConfig) => void;
}

export default function MarkdownTab(props: Readonly<MarkdownTabProps>) {
  const { config, onConfigChange } = props;
  const { theme } = useTheme();

  const initial = config?.content || '';
  const [content, setContent] = useState(initial);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setContent(config?.content || '');
  }, [config?.content]);

  const save = () => {
    setEditing(false);
    //onConfigChange && onConfigChange({ config?.content });
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
              <button onClick={() => setEditing(true)} style={{ padding: '0.4rem 0.8rem' }}>Edit</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
