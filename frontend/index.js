import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import { html } from './utils.js';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return html`
        <div className="fixed inset-0 flex items-center justify-center bg-red-900/90 text-white p-4 z-50 backdrop-blur-sm">
          <div className="max-w-3xl w-full bg-slate-900 p-8 rounded-xl border border-red-500 shadow-2xl">
            <h1 className="text-2xl font-bold mb-4 flex items-center">
              <span className="text-3xl mr-3">⚠️</span> System Malfunction
            </h1>
            <p className="mb-4 text-slate-300">The simulation encountered a critical error.</p>
            <div className="bg-black/50 p-4 rounded-lg overflow-auto max-h-[60vh] border border-white/10">
              <pre className="font-mono text-xs md:text-sm text-red-200 whitespace-pre-wrap break-words">
${this.state.error && this.state.error.toString()}
${this.state.error && this.state.error.stack}
              </pre>
            </div>
            <button 
              onClick=${() => window.location.reload()} 
              className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors"
            >
              Reboot System
            </button>
          </div>
        </div>
      `;
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  html`
    <${React.StrictMode}>
      <${ErrorBoundary}>
        <${App} />
      <//>
    <//>
  `
);
