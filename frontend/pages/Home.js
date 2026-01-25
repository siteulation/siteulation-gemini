import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { SiteCard } from '../components/SiteCard.js';
import { Loader2, Command, MessageCircle, RefreshCw } from 'lucide-react';
import { html } from '../utils.js';
import { Link } from 'react-router-dom';

const Home = ({ user }) => {
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('recent'); // 'recent' | 'popular' | 'my_carts'

  const fetchCarts = async () => {
    setLoading(true);
    try {
      let endpoint = `/api/carts?sort=${activeTab}`;
      
      if (activeTab === 'my_carts') {
        if (!user) {
          setCarts([]);
          setLoading(false);
          return;
        }
        endpoint = `/api/carts?sort=recent&user_id=${user.id}`;
      }

      const data = await api.request(endpoint);
      if (Array.isArray(data)) {
        setCarts(data);
      } else {
        setCarts([]);
      }
    } catch (error) {
      console.error("Error fetching sites:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarts();
  }, [activeTab, user]);

  return html`
    <div className="min-h-screen pt-20 pb-20 bg-[#1a1a1a] overflow-x-hidden">
      <!-- Wall Texture Overlay -->
      <div className="fixed inset-0 pointer-events-none opacity-[0.07]" style=${{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
      
      <!-- Lighting Vignette -->
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_10%,rgba(0,0,0,0)_10%,rgba(0,0,0,0.8)_90%)] z-0"></div>

      <div className="container mx-auto px-4 relative z-10">
        
        <!-- The Poster (Hero Section) -->
        <div className="flex justify-center mb-24 perspective-[1000px]">
          <div className="relative bg-[#f0f0f0] text-slate-900 p-8 md:p-12 max-w-2xl w-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform -rotate-1 origin-top-left group transition-transform hover:rotate-0 hover:scale-[1.01] duration-500">
            
            <!-- Tape marks -->
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-8 bg-yellow-100/80 rotate-1 shadow-sm backdrop-blur-[1px] opacity-90"></div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-32 h-8 bg-yellow-100/80 -rotate-1 shadow-sm backdrop-blur-[1px] opacity-90"></div>

            <!-- Poster Design -->
            <div className="border-4 border-slate-900 p-6 h-full flex flex-col items-center text-center relative overflow-hidden">
              <!-- Halftone pattern overlay -->
              <div className="absolute inset-0 opacity-[0.1]" style=${{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-center space-x-2 mb-4">
                    <div className="bg-slate-900 text-white px-3 py-1 text-xs font-black tracking-widest uppercase transform -skew-x-12">
                        System v2.0
                    </div>
                </div>

                <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter uppercase leading-[0.9]">
                  Digital<br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Reality</span>
                </h1>
                
                <p className="font-mono text-sm md:text-base font-bold text-slate-600 mb-8 max-w-md mx-auto uppercase tracking-tight">
                  Generate single-file web applications using advanced Gemini AI protocols.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                    <${Link} 
                        to="/create" 
                        className="w-full sm:w-auto bg-slate-900 text-white px-6 py-3 font-bold hover:bg-primary-600 transition-colors uppercase tracking-wider border-2 border-transparent hover:border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                    >
                        <div className="flex items-center justify-center space-x-2">
                            <${Command} size=${18} />
                            <span>Insert Cart</span>
                        </div>
                    <//>
                    
                    <a 
                        href="https://discord.gg/X9AADBxNdM" 
                        target="_blank"
                        rel="noreferrer"
                        className="w-full sm:w-auto bg-transparent text-slate-900 border-2 border-slate-900 px-6 py-3 font-bold hover:bg-slate-100 transition-colors uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                    >
                        <div className="flex items-center justify-center space-x-2">
                            <${MessageCircle} size=${18} />
                            <span>Community</span>
                        </div>
                    </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- The Shelf Unit (Filters) -->
        <div className="max-w-6xl mx-auto mb-12">
          <div className="flex flex-wrap items-center justify-center gap-4 bg-[#2a2a2a] p-4 rounded-lg shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] border-b-4 border-[#3a3a3a]">
             <span className="text-neutral-500 font-mono text-xs uppercase tracking-widest mr-4">Select Category:</span>
             
             <button 
                onClick=${() => setActiveTab('recent')}
                className=${`px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider rounded transition-all ${activeTab === 'recent' ? 'bg-primary-600 text-white shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
             >
                New Arrivals
             </button>
             
             <button 
                onClick=${() => setActiveTab('popular')}
                className=${`px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider rounded transition-all ${activeTab === 'popular' ? 'bg-orange-600 text-white shadow-[0_0_10px_rgba(234,88,12,0.5)]' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
             >
                Best Sellers
             </button>

             ${user && html`
                <button 
                    onClick=${() => setActiveTab('my_carts')}
                    className=${`px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider rounded transition-all ${activeTab === 'my_carts' ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(5,150,105,0.5)]' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
                >
                    My Collection
                </button>
             `}

             <button 
                onClick=${fetchCarts}
                className="ml-auto p-2 text-neutral-500 hover:text-white transition-colors"
                title="Refresh Shelves"
             >
                <${RefreshCw} size=${16} className=${loading ? 'animate-spin' : ''} />
             </button>
          </div>
        </div>

        <!-- The Shelves (Grid) -->
        ${loading ? html`
          <div className="flex justify-center items-center py-20">
            <${Loader2} className="animate-spin text-neutral-500" size=${48} />
          </div>
        ` : carts.length === 0 ? html`
          <div className="text-center py-20 opacity-50">
            <p className="text-neutral-500 font-mono text-lg uppercase">Shelf Empty</p>
          </div>
        ` : html`
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16 max-w-7xl mx-auto px-4">
            ${carts.map((cart) => html`
                <div className="relative group perspective-[1000px]">
                    <!-- Shelf Shadow -->
                    <div className="absolute -bottom-8 left-0 right-0 h-4 bg-black/40 blur-md rounded-[100%] group-hover:scale-90 transition-transform duration-300"></div>
                    
                    <${SiteCard} key=${cart.id} cart=${cart} currentUser=${user} onDelete=${fetchCarts} />
                    
                    <!-- Shelf Planks (Visual Only) -->
                    <div className="absolute -bottom-10 left-[-20px] right-[-20px] h-2 bg-[#333] border-t border-[#444] rounded-sm -z-10 shadow-[0_5px_10px_rgba(0,0,0,0.5)]"></div>
                </div>
            `)}
          </div>
        `}
      </div>
    </div>
  `;
};

export default Home;