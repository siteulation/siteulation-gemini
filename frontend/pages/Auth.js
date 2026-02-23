import React, { useState } from 'react';
import { api } from '../services/api.js';
import { useNavigate } from 'react-router-dom';
import { html } from '../utils.js';
import { Lock, User, Mail, ArrowRight, Loader2, CheckCircle, MailCheck, Shield, Key } from 'lucide-react';

const Auth = ({ setUser }) => {
  const [view, setView] = useState('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (view === 'signup') {
        const data = await api.auth.signUp(email, password, username);
        if (data.access_token) {
            api.setToken(data.access_token);
            setUser(data.user);
            navigate('/');
        } else {
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
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#0a0c10] font-mono">
            <div className="w-full max-w-sm border border-green-500/30 bg-slate-900/80 p-8 text-center shadow-[0_0_20px_rgba(34,197,94,0.1)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-green-500/50"></div>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 text-green-400 mb-6 border border-green-500/30">
                    <${MailCheck} size=${32} />
                </div>
                <h2 className="text-xl font-bold text-white mb-2 uppercase tracking-widest">Verification Sent</h2>
                <p className="text-slate-400 text-xs mb-6">
                    A secure link has been dispatched to <br/>
                    <span className="font-bold text-green-400">${email}</span>.
                </p>
                <div className="text-xs text-slate-500 bg-black p-4 border border-slate-800 mb-6">
                    > ACCESS_PENDING<br/>
                    > WAITING_FOR_USER_CONFIRMATION...
                </div>
                <button 
                    onClick=${() => window.location.reload()}
                    className="w-full bg-slate-800 text-white font-bold py-3 hover:bg-slate-700 transition-all text-xs uppercase border border-slate-600"
                >
                    Return to Terminal
                </button>
            </div>
        </div>
      `;
  }

  return html`
    <div className="min-h-screen flex items-center justify-center p-6 overflow-hidden" style=${{
        backgroundColor: '#2563eb',
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='30' viewBox='0 0 120 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 15 Q 30 0, 60 15 T 120 15' fill='none' stroke='white' stroke-width='1' opacity='0.4'/%3E%3C/svg%3E")`,
        backgroundSize: '120px 30px'
    }}>
      <div className="w-full max-w-sm relative z-10">
        <div className="bg-[#FFF9D2] border-4 border-[#5C3A21] p-8 shadow-2xl relative transform -rotate-1">
          <!-- Corner Accents -->
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#5C3A21]/30"></div>
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#5C3A21]/30"></div>
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#5C3A21]/30"></div>
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#5C3A21]/30"></div>

          <div className="text-center mb-8">
            <img 
                src="https://raw.githubusercontent.com/siteulation/Siteulation/refs/heads/main/converted_1771566390817.png" 
                alt="PlaySOUL" 
                className="h-16 mx-auto mb-4"
                crossOrigin="anonymous"
            />
            <h1 className="text-2xl font-bold text-[#5C3A21] tracking-tight uppercase">
              ${view === 'signin' ? 'Welcome Back' : 'Join the Quest'}
            </h1>
            <p className="text-[#5C3A21]/70 text-sm mt-1 font-medium">
              ${view === 'signin' ? 'Enter your credentials to continue.' : 'Create an account to start building.'}
            </p>
          </div>

          ${error && html`
            <div className="mb-6 p-2 bg-red-100 border border-red-300 text-red-700 text-xs text-center font-bold">
              ${error}
            </div>
          `}

          <form onSubmit=${handleAuth} className="space-y-4">
            ${view === 'signup' && html`
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#5C3A21] uppercase tracking-wider pl-1">Username</label>
                <div className="relative group">
                  <${User} className="absolute left-3 top-2.5 text-[#5C3A21]/50" size=${14} />
                  <input
                    type="text"
                    value=${username}
                    onChange=${(e) => setUsername(e.target.value)}
                    required
                    className="w-full bg-white/50 border-2 border-[#5C3A21] rounded py-2 pl-9 pr-4 text-sm text-[#5C3A21] focus:bg-white outline-none transition-all placeholder:text-[#5C3A21]/30"
                    placeholder="CreativeSoul"
                  />
                </div>
              </div>
            `}

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#5C3A21] uppercase tracking-wider pl-1">Email</label>
              <div className="relative group">
                <${Mail} className="absolute left-3 top-2.5 text-[#5C3A21]/50" size=${14} />
                <input
                  type="email"
                  value=${email}
                  onChange=${(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-white/50 border-2 border-[#5C3A21] rounded py-2 pl-9 pr-4 text-sm text-[#5C3A21] focus:bg-white outline-none transition-all placeholder:text-[#5C3A21]/30"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#5C3A21] uppercase tracking-wider pl-1">Password</label>
              <div className="relative group">
                <${Key} className="absolute left-3 top-2.5 text-[#5C3A21]/50" size=${14} />
                <input
                  type="password"
                  value=${password}
                  onChange=${(e) => setPassword(e.target.value)}
                  required
                  minLength=${6}
                  className="w-full bg-white/50 border-2 border-[#5C3A21] rounded py-2 pl-9 pr-4 text-sm text-[#5C3A21] focus:bg-white outline-none transition-all placeholder:text-[#5C3A21]/30"
                  placeholder="******"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled=${loading}
              className="w-full bg-[#5C3A21] text-[#FFF9D2] font-bold py-3 hover:bg-[#4A2F1B] active:scale-[0.98] transition-all flex items-center justify-center space-x-2 mt-4 text-sm uppercase tracking-widest shadow-md"
            >
              ${loading ? html`
                <${Loader2} className="animate-spin" size=${14} />
                <span>Processing...</span>
              ` : html`
                <span>${view === 'signin' ? 'Log In' : 'Sign Up'}</span>
                <${ArrowRight} size=${14} />
              `}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#5C3A21]/20 text-center">
            <button
              onClick=${toggleView}
              className="text-[#5C3A21] hover:text-[#A05A2C] text-xs font-bold uppercase tracking-wider transition-colors hover:underline"
            >
              ${view === 'signin' ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
};

export default Auth;