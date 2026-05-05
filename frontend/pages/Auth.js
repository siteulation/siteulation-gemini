import React, { useState } from 'react';
import { api } from '../services/api.js';
import { useNavigate } from 'react-router-dom';
import { html } from '../utils.js';
import { Lock, User, Mail, ArrowRight, Loader2, CheckCircle, MailCheck, Shield, Key } from 'lucide-react';

const Auth = ({ user, setUser }) => {
  const [view, setView] = useState('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  
  const navigate = useNavigate();

  React.useEffect(() => {
    // If we have a user from props but they aren't verified, and we aren't already in verificationSent mode
    if (user && user.profile && !user.profile.is_account_verified && !verificationSent) {
      setVerificationSent(true);
      if (user.email) setEmail(user.email);
    }
  }, [user]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (view === 'signup') {
        const data = await api.auth.signUp(email, password, username);
        if (data.access_token) {
            api.setToken(data.access_token);
            setUser(data.user || data); 
            setVerificationSent(true);
        } else {
            setVerificationSent(true);
        }
      } else {
        const data = await api.auth.signIn(email, password);
        if (data.access_token) {
            api.setToken(data.access_token);
            setUser(data.user);
            // If sign-in succeeds, only navigate if verified
            // The useEffect will catch unverified users and show the screen
            if (data.user && data.user.profile && data.user.profile.is_account_verified) {
                navigate('/');
            } else {
                setVerificationSent(true);
            }
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
    setVerificationCode('');
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!verificationCode.trim()) return;
    
    setVerifying(true);
    setError('');
    try {
        await api.auth.verify(verificationCode);
        // If success, we are already logged in from signup (usually)
        // Let's just navigate home
        navigate('/');
        window.location.reload(); // Refresh to update user state globally
    } catch (err) {
        setError(err.message || "Invalid code");
    } finally {
        setVerifying(false);
    }
  };

  if (verificationSent) {
      return html`
        <div className="min-h-screen flex items-center justify-center p-6" style=${{
            backgroundColor: '#2563eb',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='30' viewBox='0 0 120 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 15 Q 30 0, 60 15 T 120 15' fill='none' stroke='white' stroke-width='1' opacity='0.4'/%3E%3C/svg%3E")`,
            backgroundSize: '120px 30px'
        }}>
            <div className="w-full max-w-sm bg-[#FFF9D2] border-4 border-[#5C3A21] p-8 shadow-2xl relative transform rotate-1">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#A05A2C] text-[#FFF9D2] mb-4 border-2 border-[#5C3A21] shadow-inner font-black text-2xl">
                        ?
                    </div>
                    <h2 className="text-xl font-black text-[#5C3A21] uppercase tracking-tighter">Verify Reality</h2>
                    <p className="text-[#5C3A21]/60 text-xs font-bold uppercase tracking-widest mt-1">
                        We sent a code to <br/>
                        <span className="text-[#A05A2C]">${email}</span>
                    </p>
                </div>

                ${error && html`
                    <div className="mb-4 p-2 bg-red-100 border-2 border-red-400 text-red-700 text-[10px] text-center font-black uppercase">
                        ${error}
                    </div>
                `}

                <form onSubmit=${handleVerify} className="space-y-4">
                    <div className="space-y-1 text-center">
                        <label className="text-[10px] font-black text-[#5C3A21] uppercase tracking-widest">6-Digit Code</label>
                        <input
                            type="text"
                            value=${verificationCode}
                            onChange=${(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            required
                            placeholder="000000"
                            className="w-full bg-white border-4 border-[#5C3A21] py-4 text-center text-3xl font-black text-[#5C3A21] tracking-[10px] outline-none rounded-xl placeholder:text-[#5C3A21]/10"
                            disabled=${verifying}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled=${verifying || verificationCode.length < 6}
                        className=${`w-full py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-2 ${verifying || verificationCode.length < 6 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#5C3A21] text-[#FFF9D2] hover:bg-[#4A2F1B] active:translate-y-1 shadow-[0_4px_0_#3d2716]'}`}
                    >
                        ${verifying ? html`<${Loader2} className="animate-spin" size=${16} />` : html`<span>Authenticate</span>`}
                    </button>
                </form>

                <div className="mt-8 pt-4 border-t-2 border-[#5C3A21]/10 text-center">
                    <button 
                        onClick=${() => setVerificationSent(false)}
                        className="text-[10px] font-black text-[#5C3A21]/40 uppercase tracking-widest hover:text-[#5C3A21] transition-colors"
                        disabled=${verifying}
                    >
                        Back to Terminal
                    </button>
                </div>
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