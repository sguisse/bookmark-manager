export interface Theme {
  name: 'light' | 'dark';
  colors: {
    primary: string;
    secondary: string;
    background: string;
    foreground: string;
    surface: string;
    sidebarBackground: string;
    headerBackground: string;
    footerBackground: string;
    cardBackground: string;
    text: {
      primary: string;
      secondary: string;
    };
    border: string;
    success: string;
    error: string;
    warning: string;
    info: string;
  };
  fonts: {
    family: string;
    sizes: {
      small: string;
      medium: string;
      large: string;
    };
  };
}

export const lightTheme: Theme = {
  name: 'light',
  colors: {
    primary: '#3b82f6',
    secondary: '#6366f1',
    background: '#ffffff',
    foreground: '#1f2937',
    surface: '#f9fafb',
    sidebarBackground: '#f3f4f6',
    headerBackground: '#ffffff',
    footerBackground: '#f9fafb',
    cardBackground: '#ffffff',
    text: {
      primary: '#1f2937',
      secondary: '#6b7280',
    },
    border: '#e5e7eb',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  },
  fonts: {
    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    sizes: {
      small: '0.875rem',
      medium: '1rem',
      large: '1.125rem',
    },
  },
};

export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    primary: '#60a5fa',
    secondary: '#818cf8',
    background: '#111827',
    foreground: '#f9fafb',
    surface: '#1f2937',
    sidebarBackground: '#1f2937',
    headerBackground: '#111827',
    footerBackground: '#1f2937',
    cardBackground: '#374151',
    text: {
      primary: '#f9fafb',
      secondary: '#d1d5db',
    },
    border: '#374151',
    success: '#34d399',
    error: '#f87171',
    warning: '#fbbf24',
    info: '#60a5fa',
  },
  fonts: {
    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    sizes: {
      small: '0.875rem',
      medium: '1rem',
      large: '1.125rem',
    },
  },
};
