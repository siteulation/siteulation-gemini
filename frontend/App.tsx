import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './services/supabase.ts';
import Navbar from './components/Navbar.tsx';
import Home from './pages/Home.tsx';
import Auth from './pages/Auth.tsx';
import CreateCart from './pages/CreateCart.tsx';
import ViewCart from './pages/ViewCart.tsx';
import { html } from './utils.ts';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return html`<div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>`;
  }

  return html`
    <${Router}>
      <div className="min-h-screen bg-gray-900 text-white flex flex-col">
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
              element=${user ? html`<${CreateCart} />` : html`<${Navigate} to="/auth" replace />`} 
            />
            <${Route} path="/cart/:id" element=${html`<${ViewCart} />`} />
          <//>
        </main>
      </div>
    <//>
  `;
};

export default App;
