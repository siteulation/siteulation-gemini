import React, { useState } from 'react';
import { api } from '../services/api.js';
import { useNavigate } from 'react-router-dom';
import { html } from '../utils.js';
import { Lock, User, Mail, ArrowRight, Loader2, CheckCircle, MailCheck } from 'lucide-react';

const Auth = ({ setUser }) => {
  const [view, setView] = useState('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  
  // Verification Sent State
  const [verificationSent, setVerificationSent] = useState(false);
  
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (view === 'signup') {
        const data = await api.auth.signUp(email, password, username);
        
        // If the server returns user data but no session, or just indicates success
        // we assume verification is required (unless auto-confirm is enabled on the server,
        // but since we switched to public API, it usually respects Supabase settings)
        
        // If we get an access_token immediately, they are logged in (auto-confirm)
        if (data.access_token) {
            api.setToken(data.access_token);
            setUser(data.user);
            navigate('/');
        } else {
            // Email Verification Flow
            setVerificationSent(true);
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
    setVerificationSent(false);
  };

  if (verificationSent) {
      return html`
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 relative">
            <div className="w-full max-w-sm relative z-10 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center shadow-2xl">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 text-green-400 mb-6">
                    <${MailCheck} size=${32} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Check Your Inbox</h2>
                <p className="text-slate-400 mb-6">
                    We've sent a verification link to <br/>
                    <span className="font-bold text-white">${email}</span>.
                </p>
                <div className="text-sm text-slate-500 bg-slate-800/50 p-4 rounded-lg mb-6">
                    Please verify your email address to activate your account and access the terminal.
                </div>
                <button 
                    onClick=${() => window.location.reload()}
                    className="w-full bg-white text-slate-950 font-bold py-3 rounded-lg hover:bg-slate-200 transition-all"
                >
                    Back to Sign In
                </button>
            </div>
        </div>
      `;
  }

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
              src="https://raw.githubusercontent.com/siteulation/Siteulation/refs/heads/main/siteulationlogo.png" 
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