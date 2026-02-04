import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { LogOut, Plus, User, Coins, Heart, X, ExternalLink, ShieldCheck, Check, Ban, Loader2, DollarSign } from 'lucide-react';
import { html } from '../utils.js';

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [showDonate, setShowDonate] = useState(false);
  
  // Donate Form State
  const [cashtag, setCashtag] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [donateError, setDonateError] = useState('');
  const [donateSuccess, setDonateSuccess] = useState(false);

  // Admin Queue State
  const [adminQueue, setAdminQueue] = useState([]);
  const [queueLoading, setQueueLoading] = useState(false);

  const handleLogout = () => {
    api.auth.signOut();
    setUser(null);
    navigate('/auth');
  };

  const handleDonateSubmit = async (e) => {
      e.preventDefault();
      if (!cashtag || !amount) return;
      
      setSubmitting(true);
      setDonateError('');
      
      try {
          await api.request('/api/credits/request', {
              method: 'POST',
              body: JSON.stringify({ cashtag, amount })
          });
          setDonateSuccess(true);
      } catch (err) {
          setDonateError(err.message);
      } finally {
          setSubmitting(false);
      }
  };

  const fetchAdminQueue = async () => {
      setQueueLoading(true);
      try {
          const data = await api.request('/api/admin/credits');
          setAdminQueue(data);
      } catch (err) {
          console.error(err);
      } finally {
          setQueueLoading(false);
      }
  };

  const handleApprove = async (id) => {
      try {
          await api.request('/api/admin/credits/approve', {
              method: 'POST',
              body: JSON.stringify({ request_id: id })
          });
          fetchAdminQueue();
      } catch (err) {
          alert(err.message);
      }
  };

  const handleDeny = async (id) => {
      try {
          await api.request('/api/admin/credits/deny', {
              method: 'POST',
              body: JSON.stringify({ request_id: id })
          });
          fetchAdminQueue();
      } catch (err) {
          alert(err.message);
      }
  };

  useEffect(() => {
      if (showDonate && user?.is_admin) {
          fetchAdminQueue();
      }
  }, [showDonate, user]);

  return html`
    <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#0f1219]/95 backdrop-blur-md shadow-lg">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <${Link} to="/" className="flex items-center space-x-3 group">
          <div className="p-0.5 bg-gradient-to-br from-slate-700 to-black rounded-lg border border-slate-600 shadow-inner">
             <img 
                src="https://raw.githubusercontent.com/siteulation/Siteulation/refs/heads/main/siteulationlogo.png" 
                alt="Siteulation Logo" 
                className="w-8 h-8 rounded opacity-90 group-hover:opacity-100 transition-opacity" 
             />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tighter text-slate-200 uppercase leading-none">
                Site<span className="text-primary-500">ulation</span>
            </span>
            <span className="text-[9px] font-mono text-slate-500 tracking-[0.2em] uppercase">Sys.v2</span>
          </div>
        <//>

        <div className="flex items-center space-x-4">
          
          <!-- Donate Button (Credits) -->
          <button 
            onClick=${() => setShowDonate(true)}
            className="hidden sm:flex items-center space-x-2 bg-gradient-to-b from-slate-800 to-slate-900 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-sm hover:border-primary-500/50 hover:text-white transition-all text-xs font-bold uppercase tracking-wider shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
          >
            ${user?.is_admin ? html`
                <${ShieldCheck} size=${14} className="text-red-400" />
                <span>Admin Queue</span>
            ` : html`
                <${Heart} size=${14} className="text-pink-500" />
                <span>Get Credits</span>
            `}
          </button>

          ${user ? html`
            <${React.Fragment}>
              
              <!-- Credits Display -->
              <div className="hidden sm:flex items-center bg-black border border-slate-800 rounded-sm px-3 py-1.5 text-xs font-mono font-medium text-green-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]" title="Available Credits">
                 <${Coins} size=${12} className="mr-2 text-slate-500" />
                 <span>${user.credits !== undefined ? user.credits : 0} CR</span>
              </div>

              <${Link}
                to="/create"
                className="hidden sm:flex items-center space-x-2 bg-slate-200 text-slate-950 px-4 py-2 rounded-sm hover:bg-white transition-all font-bold text-xs uppercase tracking-wide border-b-2 border-slate-400 hover:border-slate-300 active:border-b-0 active:translate-y-[2px]"
              >
                <${Plus} size=${14} />
                <span>New Cart</span>
              <//>
              
              <div className="h-6 w-px bg-slate-800 mx-2"></div>
              
              <div className="flex items-center space-x-3">
                <div className="flex flex-col items-end hidden md:flex">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase">
                    ${user.user_metadata?.username || 'Operator'}
                  </span>
                </div>
                <button
                  onClick=${handleLogout}
                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                  title="Sign Out"
                >
                  <${LogOut} size=${18} />
                </button>
              </div>
            <//>
          ` : html`
            <${Link}
              to="/auth"
              className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors font-bold text-xs uppercase tracking-wide px-4 py-2 border border-slate-700 rounded-sm hover:bg-slate-800"
            >
              <${User} size=${16} />
              <span>Login</span>
            <//>
          `}
        </div>
      </div>
    </nav>

    <!-- Modal System -->
    ${showDonate && html`
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-[#12141a] border border-slate-700 rounded-lg p-0 max-w-md w-full shadow-2xl relative flex flex-col max-h-[90vh]">
            <!-- Header -->
            <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between rounded-t-lg">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center space-x-2">
                    ${user?.is_admin ? html`<${ShieldCheck} size=${16} className="text-red-400"/>` : html`<${Coins} size=${16} className="text-yellow-400"/>`}
                    <span>${user?.is_admin ? 'Admin Verification Queue' : 'Acquire Credits'}</span>
                </h3>
                <button 
                    onClick=${() => setShowDonate(false)}
                    className="text-slate-500 hover:text-white transition-colors"
                >
                    <${X} size=${20} />
                </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
                
                ${user?.is_admin ? html`
                    <!-- ADMIN VIEW -->
                    <div className="space-y-4">
                        ${queueLoading ? html`
                            <div className="flex justify-center p-4"><${Loader2} className="animate-spin text-slate-500" /></div>
                        ` : adminQueue.length === 0 ? html`
                            <div className="text-center text-slate-500 py-8 font-mono text-xs">NO PENDING REQUESTS</div>
                        ` : adminQueue.map(req => html`
                            <div key=${req.id} className="bg-slate-950 border border-slate-800 p-3 rounded flex flex-col space-y-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-white font-bold text-sm">${req.username}</div>
                                        <div className="text-xs text-slate-500 font-mono">${req.user_id.substring(0,8)}...</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-green-400 font-mono font-bold">$${req.amount_usd}</div>
                                        <div className="text-yellow-500 font-mono text-xs">+${req.credits_requested} CR</div>
                                    </div>
                                </div>
                                <div className="bg-slate-900 p-2 rounded text-xs font-mono text-slate-300 border border-slate-800">
                                    CASHTAG: <span className="text-white font-bold">${req.cashtag}</span>
                                </div>
                                <div className="flex space-x-2 pt-2">
                                    <button 
                                        onClick=${() => handleApprove(req.id)}
                                        className="flex-1 bg-green-900/30 text-green-400 border border-green-900 hover:bg-green-900/50 py-1 rounded text-xs font-bold"
                                    >
                                        APPROVE
                                    </button>
                                    <button 
                                        onClick=${() => handleDeny(req.id)}
                                        className="flex-1 bg-red-900/30 text-red-400 border border-red-900 hover:bg-red-900/50 py-1 rounded text-xs font-bold"
                                    >
                                        DENY
                                    </button>
                                </div>
                            </div>
                        `)}
                    </div>
                ` : html`
                    <!-- USER DONATE VIEW -->
                    ${donateSuccess ? html`
                        <div className="text-center py-8">
                            <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-400 mb-4 border border-green-500/20">
                                <${Check} size=${32} />
                            </div>
                            <h4 className="text-white font-bold text-lg mb-2">Request Submitted</h4>
                            <p className="text-slate-400 text-sm mb-6">
                                An admin will verify your transaction shortly. <br/>
                                Credits will be added automatically upon approval.
                            </p>
                            <button onClick=${() => setShowDonate(false)} className="bg-slate-800 hover:bg-slate-700 text-white py-2 px-6 rounded text-sm font-bold">Close</button>
                        </div>
                    ` : html`
                        <div className="space-y-6">
                            <!-- Warning Box -->
                            <div className="bg-red-500/5 border border-red-500/20 p-4 rounded text-red-200 text-xs font-mono leading-relaxed">
                                <strong className="block text-red-400 mb-1 uppercase tracking-wider">Warning:</strong>
                                IF YOU AT ALL ENTER THE WRONG AMOUNT, YOU WILL BE REFUNDED, AND NOT GIVEN ANY CREDITS.
                            </div>

                            <!-- Info -->
                            <div className="text-center mb-6">
                                <p className="text-slate-400 text-sm mb-2">Send payment via CashApp to:</p>
                                <div className="bg-slate-950 border border-slate-800 p-3 rounded font-mono text-xl text-green-400 font-bold select-all">
                                    $robertkgreen
                                </div>
                                <div className="mt-2 text-xs font-bold text-primary-400 uppercase tracking-wide">
                                    RATE: $1.00 = 20 CREDITS
                                </div>
                            </div>

                            <form onSubmit=${handleDonateSubmit} className="space-y-4">
                                ${donateError && html`<div className="text-red-400 text-xs text-center">${donateError}</div>`}
                                
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Your Cashtag</label>
                                    <input 
                                        type="text" 
                                        placeholder="$yourname" 
                                        required
                                        value=${cashtag}
                                        onChange=${(e) => setCashtag(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-primary-500 outline-none font-mono text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amount Sent ($)</label>
                                    <div className="relative">
                                        <${DollarSign} size=${14} className="absolute left-3 top-3 text-slate-500" />
                                        <input 
                                            type="number" 
                                            min="1" 
                                            step="0.01" 
                                            placeholder="5.00" 
                                            required
                                            value=${amount}
                                            onChange=${(e) => setAmount(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 pl-8 text-white focus:border-primary-500 outline-none font-mono text-sm"
                                        />
                                    </div>
                                    <div className="text-right mt-1 text-xs text-yellow-500 font-mono">
                                        REWARD: ${(amount || 0) * 20} CREDITS
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled=${submitting}
                                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded text-sm uppercase tracking-wider shadow-lg hover:shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    ${submitting ? 'Verifying...' : 'Submit for Verification'}
                                </button>
                            </form>
                            
                            <a href="https://cash.app/$robertkgreen" target="_blank" className="block text-center text-xs text-slate-500 hover:text-white underline decoration-slate-700 hover:decoration-white transition-all">
                                Open CashApp <${ExternalLink} size=${10} className="inline ml-1"/>
                            </a>
                        </div>
                    `}
                `}
            </div>
        </div>
      </div>
    `}
  `;
};

export default Navbar;