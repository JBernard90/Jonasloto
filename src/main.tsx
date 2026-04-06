import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

console.log('Jonas Loto Center: Application initialization started');

// Global error handler for production debugging
window.onerror = (message, source, lineno, colno, error) => {
  console.error('Jonas Loto Center: Global Error Detected:', { message, source, lineno, colno, error });
  // You could also send this to a logging service here
};

window.onunhandledrejection = (event) => {
  console.error('Jonas Loto Center: Global Unhandled Promise Rejection:', {
    reason: event.reason,
    promise: event.promise,
    message: event.reason?.message || 'No message',
    stack: event.reason?.stack || 'No stack'
  });
};

// Register Service Worker for Offline Mode
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Jonas Loto Center: SW Registered', reg))
      .catch(err => console.error('Jonas Loto Center: SW Registration Failed', err));
  });
}

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
