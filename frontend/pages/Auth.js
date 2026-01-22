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
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

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
        setMessage("Access credentials generated. Verify email to initialize linkage.");
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message);
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
          <h1 className="text-3xl font-bold text-white mb-2">Siteulation ID</h1>
          <p className="text-slate-400">Enter your credentials to access the terminal.</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
          ${error && html`
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-200 rounded-lg text-sm text-center">
              ${error}
            </div>
          `}

          ${message && html`
            <div className="mb-6 p-3 bg-green-500/10 border border-green-500/20 text-green-200 rounded-lg text-sm text-center">
              ${message}
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
                  placeholder="operator_01"
                />
              </div>
            `}
            
            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-400 uppercase">Email Protocol</label>
              <input
                type="email"
                value=${email}
                onChange=${(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                placeholder="user@domain.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-400 uppercase">Passkey</label>
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
              <span>${loading ? 'Authenticating...' : (isLogin ? 'Access System' : 'Initialize ID')}</span>
              ${!loading && html`<${ArrowRight} size=${16} />`}
            </button>
          </form>

          <div className="mt-6 flex items-center space-x-4">
            <div className="h-px bg-white/10 flex-1"></div>
            <span className="text-xs text-slate-500 font-mono">OR</span>
            <div className="h-px bg-white/10 flex-1"></div>
          </div>

          <button
            onClick=${handleGoogleLogin}
            className="mt-6 w-full flex items-center justify-center space-x-2 bg-slate-800 text-white hover:bg-slate-700 font-medium py-3 rounded-lg transition-colors border border-white/5"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26c.01-.19.01-.38.01-.58z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          ${isLogin ? "No ID found?" : "Already have an ID?"}{' '}
          <button
            onClick=${() => setIsLogin(!isLogin)}
            className="text-primary-400 hover:text-primary-300 font-medium underline decoration-primary-500/30 underline-offset-4"
          >
            ${isLogin ? 'Generate one' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  `;
};

export default Auth;
