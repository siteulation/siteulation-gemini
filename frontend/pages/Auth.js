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
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0a0c10] relative overflow-hidden font-mono">
      <!-- Grid Background -->
      <div className="absolute inset-0 opacity-[0.03]" style=${{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      
      <!-- Scan line -->
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_0%,rgba(0,255,0,0.02)_50%,transparent_100%)] bg-[length:100%_4px] animate-scan"></div>

      <div className="w-full max-w-sm relative z-10">
        <!-- Terminal Header -->
        <div className="bg-slate-900 border-x border-t border-slate-700 p-2 flex items-center justify-between">
            <div className="flex space-x-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest">SECURE_ACCESS_V2.0</div>
        </div>

        <div className="bg-[#111] border border-slate-700 p-8 shadow-2xl relative">
          <!-- Corner Accents -->
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/50"></div>
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/50"></div>
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/50"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/50"></div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4 p-2 border border-slate-700 bg-slate-900 rounded">
               <${Shield} size=${32} className="text-slate-200" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-widest uppercase">
              ${view === 'signin' ? 'System Login' : 'New User Reg.'}
            </h1>
            <p className="text-slate-500 text-[10px] mt-1 uppercase tracking-wider">
              ${view === 'signin' ? 'Enter credentials to authorize.' : 'Initialize identity protocol.'}
            </p>
          </div>

          ${error && html`
            <div className="mb-6 p-2 bg-red-900/20 border border-red-900/50 text-red-400 text-xs text-center border-l-2 border-l-red-500">
              [ERROR] ${error}
            </div>
          `}

          <form onSubmit=${handleAuth} className="space-y-4">
            ${view === 'signup' && html`
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Identifier (Username)</label>
                <div className="relative group">
                  <${User} className="absolute left-3 top-2.5 text-slate-600" size=${14} />
                  <input
                    type="text"
                    value=${username}
                    onChange=${(e) => setUsername(e.target.value)}
                    required
                    className="w-full bg-[#050505] border border-slate-700 rounded-none py-2 pl-9 pr-4 text-xs text-green-500 focus:border-green-500 outline-none transition-colors placeholder:text-slate-800 font-mono"
                    placeholder="OPERATOR_ID"
                  />
                </div>
              </div>
            `}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Comms (Email)</label>
              <div className="relative group">
                <${Mail} className="absolute left-3 top-2.5 text-slate-600" size=${14} />
                <input
                  type="email"
                  value=${email}
                  onChange=${(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#050505] border border-slate-700 rounded-none py-2 pl-9 pr-4 text-xs text-green-500 focus:border-green-500 outline-none transition-colors placeholder:text-slate-800 font-mono"
                  placeholder="USER@NET.LOC"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Key (Password)</label>
              <div className="relative group">
                <${Key} className="absolute left-3 top-2.5 text-slate-600" size=${14} />
                <input
                  type="password"
                  value=${password}
                  onChange=${(e) => setPassword(e.target.value)}
                  required
                  minLength=${6}
                  className="w-full bg-[#050505] border border-slate-700 rounded-none py-2 pl-9 pr-4 text-xs text-green-500 focus:border-green-500 outline-none transition-colors placeholder:text-slate-800 font-mono"
                  placeholder="******"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled=${loading}
              className="w-full bg-slate-200 text-black font-bold py-3 hover:bg-white active:scale-[0.99] transition-all flex items-center justify-center space-x-2 mt-4 text-xs uppercase tracking-widest border border-white"
            >
              ${loading ? html`
                <${Loader2} className="animate-spin" size=${14} />
                <span>Processing...</span>
              ` : html`
                <span>${view === 'signin' ? 'Authorize' : 'Register'}</span>
                <${ArrowRight} size=${14} />
              `}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <button
              onClick=${toggleView}
              className="text-slate-500 hover:text-green-400 text-[10px] uppercase tracking-wider transition-colors hover:underline decoration-green-500/50"
            >
              ${view === 'signin' ? '> Request New Identity' : '> Switch to Login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
};

export default Auth;