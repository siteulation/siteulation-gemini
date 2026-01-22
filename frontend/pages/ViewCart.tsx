import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabase.ts';
import { ArrowLeft, Loader2, Maximize2, Monitor, Smartphone, Tablet } from 'lucide-react';
import { html } from '../utils.ts';

const ViewCart = () => {
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
        console.error("Error fetching cart:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [id]);

  if (loading) {
    return html`
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
        <${Loader2} className="animate-spin text-blue-500" size=${48} />
      </div>
    `;
  }

  if (!cart) {
    return html`
      <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center text-gray-400">
        <p className="text-xl mb-4">Cart not found.</p>
        <${Link} to="/" className="text-blue-400 hover:underline">Return Home<//>
      </div>
    `;
  }

  // Viewport width styles
  const getViewportStyle = () => {
    switch(viewport) {
      case 'mobile': return { width: '375px' };
      case 'tablet': return { width: '768px' };
      default: return { width: '100%' };
    }
  };

  return html`
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-950">
      <div className="bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <${Link} to="/" className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
            <${ArrowLeft} size=${20} />
          <//>
          <div>
            <h1 className="text-white font-bold truncate max-w-[200px] md:max-w-md">${cart.prompt}</h1>
            <p className="text-xs text-gray-500">By ${cart.username || 'Anonymous'} • ${cart.model}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-1 border border-gray-700">
          <button
            onClick=${() => setViewport('desktop')}
            className=${`p-2 rounded ${viewport === 'desktop' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
            title="Desktop View"
          >
            <${Monitor} size=${18} />
          </button>
          <button
            onClick=${() => setViewport('tablet')}
            className=${`p-2 rounded ${viewport === 'tablet' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
            title="Tablet View"
          >
            <${Tablet} size=${18} />
          </button>
          <button
            onClick=${() => setViewport('mobile')}
            className=${`p-2 rounded ${viewport === 'mobile' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
            title="Mobile View"
          >
            <${Smartphone} size=${18} />
          </button>
        </div>
        
        <div className="w-[40px]"></div>
      </div>

      <div className="flex-1 overflow-hidden bg-gray-800 flex justify-center items-center p-4">
        <div 
          className="bg-white h-full transition-all duration-300 shadow-2xl overflow-hidden rounded-md border border-gray-700 relative"
          style=${getViewportStyle()}
        >
          <iframe
            srcDoc=${cart.code}
            title=${`Cart ${cart.id}`}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin"
          />
        </div>
      </div>
    </div>
  `;
};

export default ViewCart;
