import { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { MarkdownTabConfig } from '../../types/markdown';
import { FormDisplayMode } from '../../types/app';

interface MarkdownTabProps {
  nodeId?: string;
  config?: MarkdownTabConfig;
  onConfigChange?: (cfg: MarkdownTabConfig) => void;
}

// Presentational: consult-only view
function MarkdownConsultView(props: Readonly<{ content: string }>) {
  const { content } = props;
  const [ReactMarkdownComp, setReactMarkdownComp] = useState<any>(null);

  // try to dynamically load react-markdown; if not present, we'll fall back to plain text
  useEffect(() => {
    let mounted = true;
    import('react-markdown')
      .then((mod) => {
        if (!mounted) return;
        setReactMarkdownComp(() => (mod.default || mod));
      })
      .catch(() => {
        // ignore: optional dependency
      });
    return () => { mounted = false; };
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {ReactMarkdownComp ? (
          // render parsed markdown; ensure renderer container can grow
          <div style={{ height: '100%' }}>
            <ReactMarkdownComp>{content}</ReactMarkdownComp>
          </div>
        ) : (
          // fallback: show raw markdown text
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{content}</pre>
        )}
      </div>
    </div>
  );
}

// Presentational: edit view
function MarkdownEditorView(props: Readonly<{ content: string; onChange: (v: string) => void; onCancel: () => void; onSave: () => void; theme: any }>) {
  const { content, onChange, onCancel, onSave, theme } = props;
  const [MDEditorComp, setMDEditorComp] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    // dynamic import so package is optional
    import('@uiw/react-md-editor')
      .then((mod) => {
        if (!mounted) return;
        // the package might export default or named export
        setMDEditorComp(() => (mod.default || mod));
      })
      .catch(() => {
        // optional: editor not installed
      });
    return () => { mounted = false; };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
      <div style={{ flex: 1, minHeight: 0 }}>
        {MDEditorComp ? (
          // use the external editor and let it fill the container
          <div style={{ height: '100%' }}>
            <MDEditorComp value={content} onChange={(val: any) => onChange(String(val || ''))} height="100%" />
          </div>
        ) : (
          // fallback to textarea that fills the space
          <textarea value={content} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', height: '100%', minHeight: 0, resize: 'none' }} />
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ padding: '0.5rem 1rem' }}>Cancel</button>
        <button onClick={onSave} style={{ padding: '0.5rem 1rem', background: theme.colors.primary, color: '#fff' }}>Save</button>
      </div>
    </div>
  );
}

export default function MarkdownTabManager(props: Readonly<MarkdownTabProps>) {
  const { nodeId, config, onConfigChange } = props;
  const { theme } = useTheme();

  const initial = config?.content || '';
  const [content, setContent] = useState(initial);
  const [editing, setEditing] = useState(false);
  // localTitle/color/icon were used by the consult form; removed as consult no longer exposes editing controls

  useEffect(() => {
    setContent(config?.content || '');
  }, [config?.content]);

  // Listen for toolbar events that target this markdown tab
  useEffect(() => {
    const handler = (ev: Event) => {
      try {
        const detail = (ev as CustomEvent)?.detail || {};
        const targetId = detail?.nodeId;
        const mode = detail?.mode;
        if (nodeId && targetId && String(targetId) !== String(nodeId)) return;
        // Only respond when the toolbar requests edit mode (or toggle)
        if (mode === FormDisplayMode.Edit || detail?.action === 'toggle-edit') {
          setEditing(true);
        }
      } catch (err) {
        console.warn('markdown toolbar handler failed', err);
      }
    };
    window.addEventListener('flexlayout:markdown:toolbar', handler as EventListener);
    return () => window.removeEventListener('flexlayout:markdown:toolbar', handler as EventListener);
  }, [nodeId]);

  const save = () => {
    setEditing(false);
  if (onConfigChange) onConfigChange({ ...(config || {} as any), content, id: (config as any)?.id || '' });
  };
  return (
    <div style={{ padding: 16, color: theme.colors.text.primary, background: theme.colors.background, height: '100%' }}>
      {editing ? (
        <MarkdownEditorView content={content} onChange={setContent} onCancel={() => setEditing(false)} onSave={save} theme={theme} />
      ) : (
        <MarkdownConsultView content={content} />
      )}
    </div>
  );
}
