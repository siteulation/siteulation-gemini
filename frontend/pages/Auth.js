import React, { useState } from 'react';
import { api } from '../services/api.js';
import { useNavigate } from 'react-router-dom';
import { html } from '../utils.js';
import { Lock, User, Mail, ArrowRight, Loader2 } from 'lucide-react';

const Auth = ({ setUser }) => {
  const [view, setView] = useState('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (view === 'signup') {
        const data = await api.auth.signUp(email, password, username);
        
        // If we get an access_token, it means the user was auto-confirmed and logged in
        if (data.access_token) {
            api.setToken(data.access_token);
            setUser(data.user);
            navigate('/');
        } else {
            // Fallback for manual confirm (shouldn't happen with current backend)
            setError('Account created! Please check your email to verify before signing in.');
            setView('signin');
        }

      } else {
        const data = await api.auth.signIn(email, password);
        if (data.access_token) {
            api.setToken(data.access_token);
            setUser(data.user);
            navigate('/');
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleView = () => {
    setView(view === 'signin' ? 'signup' : 'signin');
    setError('');
    setPassword('');
  };

  return html`
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-[128px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px]"></div>
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img 
              src="/siteulationlogo.png" 
              alt="Siteulation Logo" 
              className="w-20 h-20 rounded-2xl shadow-2xl shadow-primary-500/30" 
            />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            ${view === 'signin' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            ${view === 'signin' ? 'Enter credentials to access the terminal.' : 'Initialize your identity profile.'}
          </p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          ${error && html`
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-200 text-xs rounded-lg text-center font-mono">
              ${error}
            </div>
          `}

          <form onSubmit=${handleAuth} className="space-y-4">
            ${view === 'signup' && html`
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Username</label>
                <div className="relative group">
                  <${User} className="absolute left-3 top-3 text-slate-500 group-focus-within:text-primary-400 transition-colors" size=${16} />
                  <input
                    type="text"
                    value=${username}
                    onChange=${(e) => setUsername(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition-all placeholder:text-slate-600"
                    placeholder="Operator Name"
                  />
                </div>
              </div>
            `}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Email</label>
              <div className="relative group">
                <${Mail} className="absolute left-3 top-3 text-slate-500 group-focus-within:text-primary-400 transition-colors" size=${16} />
                <input
                  type="email"
                  value=${email}
                  onChange=${(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition-all placeholder:text-slate-600"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Password</label>
              <div className="relative group">
                <${Lock} className="absolute left-3 top-3 text-slate-500 group-focus-within:text-primary-400 transition-colors" size=${16} />
                <input
                  type="password"
                  value=${password}
                  onChange=${(e) => setPassword(e.target.value)}
                  required
                  minLength=${6}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition-all placeholder:text-slate-600"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled=${loading}
              className="w-full bg-white text-slate-950 font-bold py-3 rounded-lg hover:bg-slate-200 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 mt-2"
            >
              ${loading ? html`
                <${Loader2} className="animate-spin" size=${18} />
                <span>Processing...</span>
              ` : html`
                <span>${view === 'signin' ? 'Sign In' : 'Sign Up'}</span>
                <${ArrowRight} size=${16} />
              `}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-slate-500 text-sm">
              ${view === 'signin' ? "Don't have an account?" : "Already have an account?"}
            </p>
            <button
              onClick=${toggleView}
              className="mt-2 text-primary-400 hover:text-white text-sm font-medium transition-colors hover:underline"
            >
              ${view === 'signin' ? 'Create new account' : 'Sign in to existing account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
};

export default Auth;