import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { LogOut, Plus, User, Coins, Heart, X, ExternalLink } from 'lucide-react';
import { html } from '../utils.js';

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [showDonate, setShowDonate] = useState(false);

  const handleLogout = () => {
    api.auth.signOut();
    setUser(null);
    navigate('/auth');
  };

  return html`
    <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <${Link} to="/" className="flex items-center space-x-3 group">
          <img 
            src="https://raw.githubusercontent.com/siteulation/Siteulation/refs/heads/main/siteulationlogo.png" 
            alt="Siteulation Logo" 
            className="w-8 h-8 rounded-lg shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform" 
          />
          <span className="text-xl font-bold tracking-tight text-white">
            Site<span className="text-primary-400">ulation</span>
          </span>
        <//>

        <div className="flex items-center space-x-4">
          
          <!-- Donate Button -->
          <button 
            onClick=${() => setShowDonate(true)}
            className="hidden sm:flex items-center space-x-1.5 bg-pink-500/10 text-pink-400 border border-pink-500/20 px-3 py-1.5 rounded-lg hover:bg-pink-500/20 transition-all text-xs font-bold uppercase tracking-wider"
          >
            <${Heart} size=${14} />
            <span>Donate</span>
          </button>

          ${user ? html`
            <${React.Fragment}>
              
              <!-- Credits Display -->
              <div className="hidden sm:flex items-center space-x-2 bg-slate-900 border border-white/10 px-3 py-1.5 rounded-full text-xs font-mono font-medium text-purple-300 shadow-inner" title="Daily Credits">
                 <${Coins} size=${14} />
                 <span>${user.credits !== undefined ? user.credits : 0}/15</span>
              </div>

              <${Link}
                to="/create"
                className="hidden sm:flex items-center space-x-2 bg-white text-slate-950 px-4 py-2 rounded-lg hover:bg-slate-200 transition-all font-semibold text-sm shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                <${Plus} size=${16} />
                <span>New Cart</span>
              <//>
              
              <div className="h-6 w-px bg-white/10 mx-2"></div>
              
              <div className="flex items-center space-x-3">
                <div className="flex flex-col items-end hidden md:flex">
                  <span className="text-sm font-medium text-slate-200">
                    ${user.user_metadata?.username || user.email?.split('@')[0] || 'User'}
                  </span>
                </div>
                <button
                  onClick=${handleLogout}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <${LogOut} size=${20} />
                </button>
              </div>
            <//>
          ` : html`
            <${Link}
              to="/auth"
              className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors font-medium px-4 py-2 rounded-lg hover:bg-white/5"
            >
              <${User} size=${18} />
              <span>Sign In</span>
            <//>
          `}
        </div>
      </div>
    </nav>

    <!-- Donate Modal -->
    ${showDonate && html`
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
          <button 
            onClick=${() => setShowDonate(false)}
            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
          >
            <${X} size=${20} />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="p-4 bg-pink-500/10 text-pink-400 rounded-full mb-4 ring-1 ring-pink-500/30">
              <${Heart} size=${32} fill="currentColor" />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">Support Siteulation</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Your contributions help keep the servers running and the AI generation flowing.
            </p>

            <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 mb-5 group hover:border-green-500/30 transition-colors">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">CashApp</p>
              <div className="text-2xl font-mono font-bold text-green-400 flex items-center justify-center space-x-2">
                <span>$robertkgreen</span>
              </div>
            </div>

            <a 
              href="https://cash.app/$robertkgreen" 
              target="_blank" 
              rel="noreferrer"
              className="w-full bg-[#00D632] hover:bg-[#00b82b] text-white font-bold py-3.5 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg hover:shadow-green-500/20"
            >
              <span>Open CashApp</span>
              <${ExternalLink} size=${18} />
            </a>
            
            <button 
              onClick=${() => setShowDonate(false)}
              className="mt-4 text-xs text-slate-500 hover:text-slate-300"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    `}
  `;
};

export default Navbar;