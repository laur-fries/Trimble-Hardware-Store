import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ModusWcThemeProvider } from '@trimble-oss/moduswebcomponents-react';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <ModusWcThemeProvider>
    {/* Add basename here so React Router handles the GitHub Pages subfolder */}
    <BrowserRouter basename="/Trimble-Hardware-Store">
      <App />
    </BrowserRouter>
  </ModusWcThemeProvider>
);