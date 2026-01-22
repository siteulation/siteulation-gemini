import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabase.js';
import { ArrowLeft, Loader2, Monitor, Smartphone, Tablet, ExternalLink, Code } from 'lucide-react';
import { html } from '../utils.js';

const ViewSite = () => {
  const { id } = useParams();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewport, setViewport] = useState('desktop');

  useEffect(() => {
    const fetchCart = async () => {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from('carts')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        setCart(data);
      } catch (error) {
        console.error("Error fetching site:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [id]);

  if (loading) {
    return html`
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <${Loader2} className="animate-spin text-primary-500" size=${48} />
      </div>
    `;
  }

  if (!cart) {
    return html`
      <div className="h-screen flex flex-col items-center justify-center text-slate-400 bg-slate-950">
        <p className="text-xl mb-4">Simulation data corrupted or missing.</p>
        <${Link} to="/" className="text-primary-400 hover:underline">Return to Hub<//>
      </div>
    `;
  }

  const getViewportStyle = () => {
    switch(viewport) {
      case 'mobile': return { width: '375px' };
      case 'tablet': return { width: '768px' };
      default: return { width: '100%' };
    }
  };

  return html`
    <div className="flex flex-col h-screen bg-slate-950 pt-16">
      <!-- Toolbar -->
      <div className="bg-slate-900 border-b border-white/5 px-4 h-14 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-4">
          <${Link} to="/" className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
            <${ArrowLeft} size=${20} />
          <//>
          <div>
            <h1 className="text-white font-bold text-sm truncate max-w-[150px] md:max-w-xs">${cart.prompt}</h1>
          </div>
        </div>

        <div className="flex items-center space-x-1 bg-slate-800/50 rounded-lg p-1 border border-white/5">
          <button
            onClick=${() => setViewport('desktop')}
            className=${`p-1.5 rounded ${viewport === 'desktop' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <${Monitor} size=${16} />
          </button>
          <button
            onClick=${() => setViewport('tablet')}
            className=${`p-1.5 rounded ${viewport === 'tablet' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <${Tablet} size=${16} />
          </button>
          <button
            onClick=${() => setViewport('mobile')}
            className=${`p-1.5 rounded ${viewport === 'mobile' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <${Smartphone} size=${16} />
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
           <button className="p-2 text-slate-400 hover:text-white transition-colors" title="View Source (Coming Soon)">
             <${Code} size=${18} />
           </button>
        </div>
      </div>

      <!-- Canvas -->
      <div className="flex-1 overflow-hidden bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-slate-925 flex justify-center items-center p-4 md:p-8">
        <div 
          className="bg-white h-full transition-all duration-500 shadow-2xl overflow-hidden rounded-lg ring-1 ring-white/10 relative"
          style=${getViewportStyle()}
        >
          <iframe
            srcDoc=${cart.code}
            title=${`Site ${cart.id}`}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin"
          />
        </div>
      </div>
    </div>
  `;
};

export default ViewSite;
