import { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { WebTabConfig, WebTabFormData } from '../../types/web';
import WebForm from './WebForm';
import { FormDisplayMode } from '../../types/app';

interface WebTabProps {
  nodeId?: string;
  config?: WebTabConfig;
  onConfigChange?: (cfg: WebTabConfig) => void;
}

export default function WebTabManager(props: Readonly<WebTabProps>) {
  const { config, onConfigChange } = props;
  const { theme } = useTheme();
  const [url, setUrl] = useState<string>(config?.url || '');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setUrl(config?.url || '');
  }, [config?.url]);

  // Listen for toolbar events to open the URL form for this node
  useEffect(() => {
    const handler = (ev: Event) => {
      try {
        const detail = (ev as CustomEvent)?.detail || {};
        const targetId = detail?.nodeId;
        if (props.nodeId && targetId && String(targetId) !== String(props.nodeId)) return;
        if (detail?.action === 'open-url-form' || detail?.action === 'edit-url') {
          setShowForm(true);
        }
      } catch (err) {
        console.warn('web toolbar handler failed', err);
      }
    };
    window.addEventListener('flexlayout:web:toolbar', handler as EventListener);
    return () => window.removeEventListener('flexlayout:web:toolbar', handler as EventListener);
  }, [props.nodeId]);

  const saveUrl = (formData: WebTabFormData) => {
    const newUrl = formData?.url || '';
    setShowForm(false);
    setUrl(newUrl);
    if (onConfigChange) onConfigChange({ ...(config || {} as any), url: newUrl, id: (config as any)?.id || '' });
  };

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative', background: theme.colors.background }}>
      <div style={{ height: '100%', width: '100%' }}>
        {url ? (
          <iframe src={url} title={config?.title || 'web-view'} style={{ width: '100%', height: '100%', border: 'none' }} />
        ) : (
          <div style={{ padding: 20 }}>
            <div>No URL configured for this web tab.</div>
            <div style={{ marginTop: 8 }}>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); setShowForm(true); }}
                style={{ color: theme.colors.primary, textDecoration: 'underline', cursor: 'pointer', background: 'transparent', border: 'none', padding: 0 }}
                role="button"
              >
                Click here to set the URL to display
              </a>
            </div>
          </div>
        )}
      </div>
      {showForm && (
        <div style={{ position: 'absolute', zIndex: 30, top: 12, right: 12 }}>
          <WebForm webTab={config} mode={config?.id ? FormDisplayMode.Edit : FormDisplayMode.Create} onSave={saveUrl} onCancel={() => setShowForm(false)} />
        </div>
      )}
    </div>
  );
}
