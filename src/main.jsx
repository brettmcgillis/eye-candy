import React from 'react';
import { createRoot } from 'react-dom/client';

import App from './app/App';
import Overlay from './app/scaffold/overlay/Overlay';
import './index.css';
import './styles/global.css';
import './styles/tokens.css';

createRoot(document.getElementById('root')).render(
  <>
    <Overlay />
    <App />
  </>
);
