import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { LogOut, Plus, User } from 'lucide-react';
import { html } from '../utils.js';

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();

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
          ${user ? html`
            <${React.Fragment}>
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
  `;
};

export default Navbar;