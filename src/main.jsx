import React from 'react';
import { createRoot } from 'react-dom/client';

import AppRoot from './app/App';
import './index.css';
import './styles/global.css';
import './styles/tokens.css';

createRoot(document.getElementById('root')).render(<AppRoot />);
