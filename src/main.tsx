import { createRoot } from 'react-dom/client';
import { ModusWcThemeProvider } from '@trimble-oss/moduswebcomponents-react';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <ModusWcThemeProvider>
  </ModusWcThemeProvider>
);