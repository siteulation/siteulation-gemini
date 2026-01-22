import React, { useState } from 'react';
import { supabase } from '../services/supabase.js';
import { useNavigate } from 'react-router-dom';
import { html } from '../utils.js';
import { Box, ArrowRight } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username,
            },
          },
        });
        if (error) throw error;
        // Automatically log in if email confirmation is disabled in Supabase,
        // otherwise prompt user.
        if (!error) {
           navigate('/'); 
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return html`
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="mb-8 text-center">
          <div className="inline-flex p-3 bg-white/5 rounded-2xl mb-4 border border-white/10">
            <${Box} className="text-white" size=${32} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Siteulation</h1>
          <p className="text-slate-400">Sign in to your account.</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
          ${error && html`
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-200 rounded-lg text-sm text-center">
              ${error}
            </div>
          `}

          <form onSubmit=${handleAuth} className="space-y-4">
            ${!isLogin && html`
              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-400 uppercase">Username</label>
                <input
                  type="text"
                  value=${username}
                  onChange=${(e) => setUsername(e.target.value)}
                  required=${!isLogin}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  placeholder="Username"
                />
              </div>
            `}
            
            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-400 uppercase">Email</label>
              <input
                type="email"
                value=${email}
                onChange=${(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-400 uppercase">Password</label>
              <input
                type="password"
                value=${password}
                onChange=${(e) => setPassword(e.target.value)}
                required
                minLength=${6}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled=${loading}
              className="w-full bg-white text-slate-950 font-bold py-3 rounded-lg hover:bg-slate-200 transition-all flex items-center justify-center space-x-2 mt-6"
            >
              <span>${loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}</span>
              ${!loading && html`<${ArrowRight} size=${16} />`}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            ${isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button
              onClick=${() => setIsLogin(!isLogin)}
              className="text-primary-400 hover:text-primary-300 font-medium underline decoration-primary-500/30 underline-offset-4"
            >
              ${isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  `;
};

export default Auth;
