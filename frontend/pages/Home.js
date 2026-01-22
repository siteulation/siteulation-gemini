import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { SiteCard } from '../components/SiteCard.js';
import { Loader2, Sparkles, Command, Flame, Clock } from 'lucide-react';
import { html } from '../utils.js';
import { Link } from 'react-router-dom';

const Home = () => {
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('recent'); // 'recent' | 'popular'

  useEffect(() => {
    const fetchCarts = async () => {
      setLoading(true);
      try {
        // api.request returns the parsed JSON data directly
        // Pass sort parameter based on activeTab
        const data = await api.request(`/api/carts?sort=${activeTab}`);
        if (Array.isArray(data)) {
          setCarts(data);
        } else {
          console.error("Expected array of carts, got:", data);
          setCarts([]);
        }
      } catch (error) {
        console.error("Error fetching sites:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCarts();
  }, [activeTab]); // Refetch when tab changes

  return html`
    <div className="min-h-screen pt-16">
      <!-- Hero Section -->
      <div className="relative overflow-hidden border-b border-white/5 bg-slate-900/50">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]"></div>
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-3 py-1 mb-6">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-xs font-mono text-slate-300">SYSTEM ONLINE v2.0</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
              Construct your <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-cyan-400">
                Digital Reality
              </span>
            </h1>
            
            <p className="text-xl text-slate-400 mb-10 leading-relaxed max-w-2xl mx-auto">
              Siteulation leverages advanced Gemini AI to instantaneously compile single-file web applications from natural language protocols.
            </p>

            <${Link} 
              to="/create" 
              className="inline-flex items-center space-x-2 bg-white text-slate-950 px-8 py-4 rounded-xl font-bold hover:bg-slate-200 transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            >
              <${Command} size=${20} />
              <span>Create Cart</span>
            <//>
          </div>
        </div>
      </div>

      <!-- Feed Section -->
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
          <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
            <${Sparkles} className="text-primary-400" size=${24} />
            <span>Community Carts</span>
          </h2>
          
          <!-- Tabs -->
          <div className="bg-slate-900 border border-white/10 p-1 rounded-lg inline-flex items-center self-start md:self-auto">
            <button 
              onClick=${() => setActiveTab('recent')}
              className=${`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'recent' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <${Clock} size=${16} />
              <span>Recent</span>
            </button>
            <button 
              onClick=${() => setActiveTab('popular')}
              className=${`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'popular' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <${Flame} size=${16} />
              <span>Popular</span>
            </button>
          </div>
        </div>

        ${loading ? html`
          <div className="flex justify-center items-center py-20">
            <${Loader2} className="animate-spin text-primary-500" size=${48} />
          </div>
        ` : carts.length === 0 ? html`
          <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-white/5 border-dashed">
            <p className="text-slate-400 text-lg">No carts detected in the network.</p>
            <${Link} to="/create" className="text-primary-400 hover:text-primary-300 mt-2 inline-block">Create the first one<//>
          </div>
        ` : html`
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            ${carts.map((cart) => html`<${SiteCard} key=${cart.id} cart=${cart} />`)}
          </div>
        `}
      </div>
    </div>
  `;
};

export default Home;
