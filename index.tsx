import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// import './index.css'; // Note: In this environment, we are not creating CSS files, but this import is standard. 
// Styles are handled via Tailwind CDN in index.html for this specific output format, 
// but keeping the import for conceptual correctness if a bundler were used.

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
