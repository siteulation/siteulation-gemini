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
    <div className="min-h-screen pt-24 pb-20 overflow-x-hidden" style=${{
        backgroundColor: '#2563eb',
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='30' viewBox='0 0 120 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 15 Q 30 0, 60 15 T 120 15' fill='none' stroke='white' stroke-width='1' opacity='0.4'/%3E%3C/svg%3E")`,
        backgroundSize: '120px 30px'
    }}>
      <div className="container mx-auto px-4 relative z-10">
        
        <!-- The Map (Hero Section) -->
        <div className="flex justify-center mb-24 perspective-[1000px]">
          <div className="relative bg-[#FFF9D2] text-[#5C3A21] p-8 md:p-12 max-w-3xl w-full shadow-2xl transform -rotate-2 origin-center transition-transform hover:rotate-0 duration-500 border-4 border-[#5C3A21]">
            
            <!-- Dashed line background -->
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <svg width="100%" height="100%" viewBox="0 0 800 400" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M 50 100 Q 200 200, 400 150 T 750 350" fill="none" stroke="#A08C75" stroke-width="6" stroke-dasharray="15, 15" stroke-linecap="round" />
                    <text x="30" y="110" font-family="sans-serif" font-size="40" font-weight="bold" fill="#A08C75" transform="rotate(-20 50 100)">X</text>
                </svg>
            </div>

            <!-- Poster Design -->
            <div className="relative z-10 flex flex-col items-center text-center">
                <img 
                    src="https://raw.githubusercontent.com/siteulation/Siteulation/86e376bcf334bc782505027fe0a86a421d4a1f51/playsoul%20brown.svg" 
                    alt="PlaySOUL" 
                    className="h-24 md:h-32 mb-6"
                    crossOrigin="anonymous"
                />
                
                <p className="font-serif text-lg md:text-2xl font-medium text-[#5C3A21] mb-10 max-w-xl mx-auto leading-relaxed">
                  The brand new ai game generation platform... for YOUR creativity, YOUR art, YOUR music, all without writing a single line of code!
                </p>

                <${Link} 
                    to="/create" 
                    className="inline-block bg-transparent text-[#5C3A21] px-10 py-3 font-bold text-xl hover:bg-[#5C3A21] hover:text-[#FFF9D2] transition-colors border-4 border-[#5C3A21] shadow-sm"
                >
                    Build!
                <//>
            </div>
          </div>
        </div>

        <!-- The Shelf Unit (Filters) -->
        <div className="max-w-6xl mx-auto mb-12">
          <div className="flex flex-wrap items-center justify-center gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-lg shadow-lg border-2 border-white/20">
             <span className="text-white font-bold text-sm uppercase tracking-widest mr-4">Select Category:</span>
             
             <button 
                onClick=${() => setActiveTab('recent')}
                className=${`px-4 py-2 font-bold text-sm uppercase tracking-wider rounded transition-all ${activeTab === 'recent' ? 'bg-white text-blue-600 shadow-md' : 'text-white hover:bg-white/20'}`}
             >
                New Arrivals
             </button>
             
             <button 
                onClick=${() => setActiveTab('popular')}
                className=${`px-4 py-2 font-bold text-sm uppercase tracking-wider rounded transition-all ${activeTab === 'popular' ? 'bg-white text-blue-600 shadow-md' : 'text-white hover:bg-white/20'}`}
             >
                Best Sellers
             </button>

             ${user && html`
                <button 
                    onClick=${() => setActiveTab('my_carts')}
                    className=${`px-4 py-2 font-bold text-sm uppercase tracking-wider rounded transition-all ${activeTab === 'my_carts' ? 'bg-white text-blue-600 shadow-md' : 'text-white hover:bg-white/20'}`}
                >
                    My Collection
                </button>
             `}

             <button 
                onClick=${fetchCarts}
                className="ml-auto p-2 text-white hover:text-blue-200 transition-colors bg-white/10 rounded-full"
                title="Refresh Shelves"
             >
                <${RefreshCw} size=${16} className=${loading ? 'animate-spin' : ''} />
             </button>
          </div>
        </div>

        <!-- The Shelves (Grid) -->
        ${loading ? html`
          <div className="flex justify-center items-center py-20">
            <${Loader2} className="animate-spin text-white" size=${48} />
          </div>
        ` : carts.length === 0 ? html`
          <div className="text-center py-20">
            <p className="text-white font-bold text-xl uppercase bg-black/20 inline-block px-6 py-3 rounded-lg backdrop-blur-sm">Shelf Empty</p>
          </div>
        ` : html`
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16 max-w-7xl mx-auto px-4">
            ${carts.map((cart) => html`
                <div className="relative group perspective-[1000px]">
                    <!-- Shelf Shadow -->
                    <div className="absolute -bottom-8 left-0 right-0 h-4 bg-black/20 blur-md rounded-[100%] group-hover:scale-90 transition-transform duration-300"></div>
                    
                    <${SiteCard} key=${cart.id} cart=${cart} currentUser=${user} onDelete=${fetchCarts} />
                    
                    <!-- Shelf Planks (Visual Only) -->
                    <div className="absolute -bottom-10 left-[-20px] right-[-20px] h-3 bg-[#A05A2C] border-t-2 border-[#C07A4C] rounded-sm -z-10 shadow-lg"></div>
                </div>
            `)}
          </div>
        `}
      </div>
    </div>
  `;
};

export default Home;