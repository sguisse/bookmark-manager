import { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { MarkdownTabConfig, MarkdownTabFormData } from '../../types/markdown';
import { FormDisplayMode } from '../../types/app';
import { MarkdownConsultView } from './MarkdownViewer';
import { MarkdownForm } from './MarkdownForm';

interface MarkdownTabProps {
  nodeId?: string;
  config?: MarkdownTabConfig;
  onConfigChange?: (cfg: MarkdownTabConfig) => void;
}

export default function MarkdownTabManager(props: Readonly<MarkdownTabProps>) {
  const { nodeId, config, onConfigChange } = props;
  const { theme } = useTheme();

  const [content, setContent] = useState(config?.content || '');
  const [showForm, setShowForm] = useState(false);

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
          setShowForm(true);
        }
      } catch (err) {
        console.warn('markdown toolbar handler failed', err);
      }
    };
    window.addEventListener('flexlayout:markdown:toolbar', handler as EventListener);
    return () => window.removeEventListener('flexlayout:markdown:toolbar', handler as EventListener);
  }, [nodeId]);

  const save = (formData: MarkdownTabFormData) => {
    setShowForm(false);
    const newContent = formData?.content ?? content;
    if (onConfigChange) onConfigChange({ ...(config || {} as any), content: newContent, id: (config as any)?.id || '' });
  };
  return (
    <div style={{ padding: 0, color: theme.colors.text.primary, background: theme.colors.background, height: '100%' }}>
      {showForm ? (
  <MarkdownForm markdownTab={{ ...(config || {} as any), content }} onCancel={() => setShowForm(false)} onSave={save} />
      ) : (
        (content && content.trim().length > 0) ? (
          <MarkdownConsultView content={content} />
        ) : (
          <div style={{ padding: 20 }}>
            <div>No markdown content configured for this tab.</div>
            <div style={{ marginTop: 8 }}>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); setShowForm(true); }}
                style={{ color: theme.colors.primary, textDecoration: 'underline', cursor: 'pointer' }}
                role="button"
              >
                Click here to open the markdown editor
              </a>
            </div>
          </div>
        )
      )}
    </div>
  );
}
