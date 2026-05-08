import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import AppRoot from './app/App';
import './index.css';
import './styles/global.css';
import './styles/tokens.css';

// BASE_URL is '/' in dev and '/eye-candy/' in production (GitHub Pages).
// BrowserRouter.basename must not have a trailing slash.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

createRoot(document.getElementById('root')).render(
  <BrowserRouter basename={basename}>
    <AppRoot />
  </BrowserRouter>
);
