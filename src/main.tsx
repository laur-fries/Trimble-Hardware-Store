import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ModusWcThemeProvider } from '@trimble-oss/moduswebcomponents-react';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <ModusWcThemeProvider>
    {/* Clean root router for Netlify */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ModusWcThemeProvider>
);