import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("Starting application mount...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  // Explicitly clear the loading spinner
  rootElement.innerHTML = '';
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <App />
  );
  console.log("Application mounted successfully.");
} catch (error) {
  console.error("Failed to mount application:", error);
  rootElement.innerHTML = `<div style="color:red; padding:20px;">Failed to mount: ${error.message}</div>`;
}