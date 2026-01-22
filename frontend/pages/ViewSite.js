import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { ArrowLeft, Loader2, Monitor, Smartphone, Tablet, ExternalLink, Code, Trash2, ShieldAlert } from 'lucide-react';
import { html } from '../utils.js';

const ViewSite = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewport, setViewport] = useState('desktop');
  const [adminActionLoading, setAdminActionLoading] = useState(false);

  useEffect(() => {
    const fetchCart = async () => {
      if (!id) return;
      try {
        // Fetch cart data
        const data = await api.request(`/api/carts/${id}`);
        setCart(data);
        
        // Increment view count asynchronously (don't await or block UI)
        api.request(`/api/carts/${id}/view`, { method: 'POST' }).catch(err => {
            console.warn("Failed to count view", err);
        });
        
      } catch (error) {
        console.error("Error fetching site:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [id]);

  const handleAdminDelete = async () => {
    if (!window.confirm("Admin: Permanently delete this cart?")) return;
    setAdminActionLoading(true);
    try {
        await api.admin.deleteCart(cart.id);
        navigate('/');
    } catch (e) {
        alert(e.message);
    } finally {
        setAdminActionLoading(false);
    }
  };

  const handleAdminBan = async () => {
    if (!window.confirm(`Admin: BAN user '${cart.username}'? They will be unable to generate new carts.`)) return;
    setAdminActionLoading(true);
    try {
        await api.admin.banUser(cart.user_id);
        alert(`User ${cart.username} has been banned.`);
    } catch (e) {
        alert(e.message);
    } finally {
        setAdminActionLoading(false);
    }
  };

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
        <p className="text-xl mb-4">Cart data corrupted or missing.</p>
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
            ${cart.username === 'homelessman' && html`
              <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider ml-1">ADMIN CREATION</span>
            `}
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
           ${user?.is_admin && html`
             <div className="flex items-center space-x-1 mr-4 border-r border-white/10 pr-4">
                <button 
                  onClick=${handleAdminDelete} 
                  disabled=${adminActionLoading}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                  title="Delete Cart"
                >
                  <${Trash2} size=${18} />
                </button>
                <button 
                  onClick=${handleAdminBan}
                  disabled=${adminActionLoading} 
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                  title="Ban User"
                >
                  <${ShieldAlert} size=${18} />
                </button>
             </div>
           `}
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
