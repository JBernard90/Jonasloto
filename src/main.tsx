import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

console.log('Jonas Loto Center: Application initialization started');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Jonas Loto Center: Root element not found!');
} else {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
