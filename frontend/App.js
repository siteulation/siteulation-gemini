import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './services/supabase.js';
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return html`<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Initializing System...</div>`;
  }

  return html`
    <${Router}>
      <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-primary-500 selection:text-white">
        <${Navbar} user=${user} />
        <main className="flex-1">
          <${Routes}>
            <${Route} path="/" element=${html`<${Home} />`} />
            <${Route} 
              path="/auth" 
              element=${!user ? html`<${Auth} />` : html`<${Navigate} to="/" replace />`} 
            />
            <${Route} 
              path="/create" 
              element=${user ? html`<${CreateSite} />` : html`<${Navigate} to="/auth" replace />`} 
            />
            <${Route} path="/site/:id" element=${html`<${ViewSite} />`} />
            <!-- Redirect old cart routes for compatibility -->
            <${Route} path="/cart/:id" element=${html`<${Navigate} to="/site/:id" replace />`} />
          <//>
        </main>
      </div>
    <//>
  `;
};

export default App;
