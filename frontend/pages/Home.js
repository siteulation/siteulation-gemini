import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { SiteCard } from '../components/SiteCard.js';
import { Loader2, Sparkles, Command } from 'lucide-react';
import { html } from '../utils.js';
import { Link } from 'react-router-dom';

const Home = () => {
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCarts = async () => {
      try {
        const response = await api.request('/api/carts');
        if (response.ok) {
          const data = await response.json();
          // Ensure data is an array before setting state
          if (Array.isArray(data)) {
            setCarts(data);
          } else {
            console.error("Expected array of carts, got:", data);
            setCarts([]);
          }
        }
      } catch (error) {
        console.error("Error fetching sites:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCarts();
  }, []);

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
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
            <${Sparkles} className="text-primary-400" size=${24} />
            <span>Recent Carts</span>
          </h2>
          <div className="text-sm text-slate-500 font-mono">LIVE FEED</div>
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
