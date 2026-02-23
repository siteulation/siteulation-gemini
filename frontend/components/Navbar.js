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
    <nav className="fixed top-0 z-50 w-full bg-[#A05A2C] shadow-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <${Link} to="/" className="flex items-center group">
             <img 
                src="https://raw.githubusercontent.com/siteulation/Siteulation/refs/heads/main/playsoul%20outline.svg" 
                alt="PlaySOUL Logo" 
                className="h-10 opacity-90 group-hover:opacity-100 transition-opacity" 
                crossOrigin="anonymous"
             />
        <//>

        <div className="flex items-center space-x-4">
          
          <!-- Donate Button (Credits) -->
          <button 
            onClick=${() => setShowDonate(true)}
            className="hidden sm:flex items-center space-x-2 bg-white text-black border border-black px-3 py-1.5 rounded hover:bg-gray-100 transition-all text-sm font-bold shadow-sm"
          >
            ${user?.is_admin ? html`
                <${ShieldCheck} size=${14} className="text-red-500" />
                <span>Admin Queue</span>
            ` : html`
                <${Heart} size=${14} className="text-pink-500" />
                <span>Get Credits</span>
            `}
          </button>

          ${user ? html`
            <${React.Fragment}>
              
              <!-- Credits Display -->
              <div className="hidden sm:flex items-center bg-white border border-black rounded px-3 py-1.5 text-sm font-bold text-black shadow-sm" title="Available Credits">
                 <${Coins} size=${14} className="mr-2 text-yellow-600" />
                 <span>${user.credits !== undefined ? user.credits : 0} CR</span>
              </div>

              <${Link}
                to="/create"
                className="hidden sm:flex items-center space-x-2 bg-white text-black px-4 py-2 rounded hover:bg-gray-100 transition-all font-bold text-sm border border-black shadow-sm"
              >
                <${Plus} size=${14} />
                <span>Build!</span>
              <//>
              
              <div className="flex items-center space-x-3 ml-2">
                <div className="flex flex-col items-end hidden md:flex">
                  <span className="text-sm font-bold text-white">
                    ${user.user_metadata?.username || 'Operator'}
                  </span>
                </div>
                <button
                  onClick=${handleLogout}
                  className="p-2 text-white hover:text-red-200 transition-colors"
                  title="Sign Out"
                >
                  <${LogOut} size=${18} />
                </button>
              </div>
            <//>
          ` : html`
            <div className="flex items-center space-x-3">
              <${Link}
                to="/auth"
                className="bg-white text-black font-bold text-sm px-4 py-2 rounded border border-black hover:bg-gray-100 transition-colors shadow-sm"
              >
                Sign up
              <//>
              <${Link}
                to="/auth"
                className="bg-white text-black font-bold text-sm px-4 py-2 rounded border border-black hover:bg-gray-100 transition-colors shadow-sm"
              >
                Log in
              <//>
            </div>
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