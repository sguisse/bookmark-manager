import { useEffect } from 'react';
import Markdown from 'react-markdown'

// Presentational: consult-only view
export function MarkdownConsultView(props: Readonly<{ content: string }>) {
  const { content } = props;

  useEffect(() => {
    // no-op
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', padding: '5px', flexDirection: 'column' }}>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {Markdown ? (
          // render parsed markdown; ensure renderer container can grow
          <div style={{ height: '100%' }}>
            <Markdown>{content}</Markdown>
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
export default { MarkdownConsultView };
