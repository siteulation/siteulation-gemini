import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { api } from './services/api.js';
import Navbar from './components/Navbar.js';
import Home from './pages/Home.js';
import Auth from './pages/Auth.js';
import CreateSite from './pages/CreateSite.js';
import ViewSite from './pages/ViewSite.js';
import { html } from './utils.js';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const userData = await api.auth.getUser();
        setUser(userData);
      } catch (e) {
        console.error("Auth check failed", e);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  if (loading) {
    return html`<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Initializing System...</div>`;
  }

  return html`
    <${Router}>
      <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-primary-500 selection:text-white">
        <${Navbar} user=${user} setUser=${setUser} />
        <main className="flex-1">
          <${Routes}>
            <${Route} path="/" element=${html`<${Home} user=${user} />`} />
            <${Route} 
              path="/auth" 
              element=${!user ? html`<${Auth} setUser=${setUser} />` : html`<${Navigate} to="/" replace />`} 
            />
            <${Route} 
              path="/create" 
              element=${user ? html`<${CreateSite} />` : html`<${Navigate} to="/auth" replace />`} 
            />
            <${Route} path="/site/:id" element=${html`<${ViewSite} user=${user} />`} />
            <${Route} path="/cart/:id" element=${html`<${Navigate} to="/site/:id" replace />`} />
          <//>
        </main>
      </div>
    <//>
  `;
};

export default App;
