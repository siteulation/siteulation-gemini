import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase.ts';
import { LogOut, PlusCircle, Terminal, User as UserIcon } from 'lucide-react';
import { html } from '../utils.ts';

const Navbar = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return html`
    <nav className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <${Link} to="/" className="flex items-center space-x-2 text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          <${Terminal} className="text-blue-400" />
          <span>CartCrafter</span>
        <//>

        <div className="flex items-center space-x-4">
          ${user ? html`
            <${React.Fragment}>
              <${Link}
                to="/create"
                className="hidden sm:flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                <${PlusCircle} size=${16} />
                <span>New Cart</span>
              <//>
              <div className="flex items-center space-x-3 border-l border-gray-700 pl-4">
                <div className="text-sm text-gray-400 hidden md:block">
                  ${user.user_metadata.username || user.email}
                </div>
                <button
                  onClick=${handleLogout}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  title="Sign Out"
                >
                  <${LogOut} size=${20} />
                </button>
              </div>
            <//>
          ` : html`
            <${Link}
              to="/auth"
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors font-medium"
            >
              <${UserIcon} size=${18} />
              <span>Sign In</span>
            <//>
          `}
        </div>
      </div>
    </nav>
  `;
};

export default Navbar;
