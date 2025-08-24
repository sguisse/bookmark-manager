import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
// Load FlexLayout combined theme CSS first so app-level overrides in index.css can map variables
import 'flexlayout-react/style/combined.css';
import './styles/flexlayout/combined-override.css';
import './styles/flexlayout/rounded.css';
import './styles/index.css';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
