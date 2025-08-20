import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface BodyContentPanelProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function BodyContentPanel(props: Readonly<BodyContentPanelProps>) {
  const { children, className, style } = props;
  const { theme } = useTheme();

  return (
    <div
      className={className ?? 'body-content-panel'}
      style={{
        gridArea: 'main',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: theme.colors.background,
        color: theme.colors.foreground,
        ...style
      }}
    >
      {children}
    </div>
  );
}
