// ============================================================
// ULEZI XPB — Entry point
// ============================================================

import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import App from './App';

const raiz = document.getElementById('root');
createRoot(raiz).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
