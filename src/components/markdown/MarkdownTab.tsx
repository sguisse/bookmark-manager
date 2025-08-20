import { useTheme } from '../../contexts/ThemeContext';

interface MarkdownTabProps {
  config?: { content?: string };
}

export default function MarkdownTab(props: Readonly<MarkdownTabProps>) {
  const { config } = props;
  const { theme } = useTheme();

  const content = config?.content || '';

  return (
    <div style={{ padding: 16, color: theme.colors.text.primary, background: theme.colors.background }}>
      {/* render markdown simply as preformatted text for now; could integrate a markdown renderer later */}
      <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace' }}>
        {content}
      </div>
    </div>
  );
}
