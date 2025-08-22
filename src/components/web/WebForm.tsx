import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface WebFormProps {
  initialUrl?: string;
  onSave: (url: string) => void;
  onClose: () => void;
}

export default function WebForm(props: Readonly<WebFormProps>) {
  const { initialUrl = '', onSave, onClose } = props;
  const { theme } = useTheme();
  const [url, setUrl] = useState(initialUrl);

  return (
    <div style={{ padding: 12, width: 420, background: theme.colors.surface, borderRadius: 8, boxShadow: '0 6px 24px rgba(0,0,0,0.12)' }}>
      <h3 style={{ marginTop: 0 }}>Edit Web URL</h3>
      <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" style={{ width: '100%' }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '0.4rem 0.8rem' }}>Cancel</button>
          <button onClick={() => { onSave(url); }} style={{ padding: '0.4rem 0.8rem', background: theme.colors.primary, color: '#fff' }}>Save</button>
        </div>
      </div>
    </div>
  );
}
