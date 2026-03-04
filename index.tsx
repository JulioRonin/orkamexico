import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("🚀 ORKA MEXICO App initializing...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("❌ Critical: Could not find root element to mount to");
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("✅ App mounted successfully");
} catch (error) {
  console.error("❌ Error during app mounting:", error);
  rootElement.innerHTML = `<div style="padding: 20px; color: white;">Error de carga: ${error instanceof Error ? error.message : String(error)}</div>`;
}