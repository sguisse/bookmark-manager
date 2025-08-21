import { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export default function WelcomeTab() {
  const { theme } = useTheme();

  useEffect(() => {
    // This effect can be used to fetch any initial data or perform setup
    console.log('WelcomeTab mounted');

  }, []);

  return (
    <div style={{ padding: 16, color: theme.colors.text.primary, background: theme.colors.background, height: '100%' }}>
      Welcome
    </div>
  );
}
