import { useEffect, useState } from 'react';
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
    <div className="h-full w-full relative" style={{ background: 'var(--color-background)' }}>
      <div className="h-full w-full">
        {url ? (
          <iframe
            src={url}
            title={config?.title || 'web-view'}
            className="w-full h-full"
            style={{ border: 'none' }}
          />
        ) : (
          <div className="p-4">
            <div className="text-primary mb-2">No URL configured for this web tab.</div>
            <div>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); setShowForm(true); }}
                className="text-primary cursor-pointer btn-ghost p-0"
                style={{
                  color: 'var(--color-primary)',
                  textDecoration: 'underline',
                  background: 'transparent',
                  border: 'none'
                }}
                role="button"
              >
                Click here to set the URL to display
              </a>
            </div>
          </div>
        )}
      </div>
      {showForm && (
        <div className="absolute" style={{ zIndex: 30, top: '12px', right: '12px' }}>
          <WebForm
            webTab={config}
            mode={config?.id ? FormDisplayMode.Edit : FormDisplayMode.Create}
            onSave={saveUrl}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}
    </div>
  );
}
