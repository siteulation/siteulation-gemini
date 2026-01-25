import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Trash2, Loader2, Lock, Cpu } from 'lucide-react';
import { html } from '../utils.js';
import { api } from '../services/api.js';

export const SiteCard = ({ cart, currentUser, onDelete }) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e) => {
    e.preventDefault(); 
    if (!window.confirm("Admin: Destroy this cartridge?")) return;
    
    setDeleting(true);
    try {
      await api.admin.deleteCart(cart.id);
      if (onDelete) onDelete();
    } catch (err) {
      alert("Failed to delete: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const isAdminCreator = cart.username === 'homelessman';
  const isAdminViewer = currentUser?.is_admin;
  const displayName = cart.name || cart.prompt;

  // Generate a determinstic hue based on cart ID for the label stripe
  const hash = cart.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;

  return html`
    <${Link} to=${`/site/${cart.id}`} className="block relative group cursor-pointer transform transition-transform duration-300 hover:-translate-y-4 hover:rotate-1">
      
      <!-- Cartridge Body (Plastic Casing) -->
      <div className="bg-slate-700 rounded-t-lg rounded-b-md p-1 shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),inset_0_-2px_4px_rgba(0,0,0,0.3),5px_5px_15px_rgba(0,0,0,0.5)] border-r-4 border-b-4 border-slate-800 relative overflow-hidden h-64 flex flex-col">
        
        <!-- Plastic Texture Gradient -->
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-black/20 pointer-events-none"></div>

        <!-- Grip Area (Top) -->
        <div className="h-12 bg-slate-700 border-b border-slate-800 flex flex-col justify-center space-y-1 px-4 mb-2 shadow-inner">
            <div className="h-1 bg-slate-800/50 rounded-full w-full"></div>
            <div className="h-1 bg-slate-800/50 rounded-full w-full"></div>
            <div className="h-1 bg-slate-800/50 rounded-full w-full"></div>
        </div>

        <!-- The Label (Sticker) -->
        <div className="mx-2 flex-1 bg-slate-900 rounded relative overflow-hidden flex flex-col shadow-[inset_0_0_10px_rgba(0,0,0,0.8)] border border-black/50">
            
            <!-- Label Art / Top Stripe -->
            <div className="h-24 relative overflow-hidden border-b-2 border-black" style=${{ backgroundColor: `hsl(${hue}, 60%, 20%)` }}>
                <div className="absolute inset-0 opacity-30" style=${{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.2) 10px, rgba(0,0,0,0.2) 20px)' }}></div>
                
                <div className="absolute top-2 right-2">
                    <div className="bg-black/60 backdrop-blur-sm border border-white/10 px-1.5 py-0.5 rounded text-[9px] font-mono text-white flex items-center space-x-1">
                        <${Cpu} size=${10} />
                        <span className="uppercase">${cart.model.includes('gemini') ? 'GEMINI' : 'DS-R1'}</span>
                    </div>
                </div>

                ${!cart.is_listed && html`
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded border border-red-800 shadow-sm flex items-center space-x-1">
                        <${Lock} size=${8} />
                        <span>PRIVATE</span>
                    </div>
                `}
            </div>

            <!-- Label Text Content -->
            <div className="flex-1 bg-slate-100 p-3 flex flex-col justify-between relative">
                <!-- Subtle paper texture -->
                <div className="absolute inset-0 opacity-[0.05]" style=${{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }}></div>

                <div>
                    <h3 className="text-slate-900 font-black leading-tight text-sm uppercase line-clamp-2 mb-1 tracking-tight" style=${{ fontFamily: 'Impact, sans-serif' }}>
                        ${displayName}
                    </h3>
                    <div className="w-8 h-1 bg-red-500 mb-2"></div>
                </div>

                <div className="flex items-end justify-between z-10">
                    <div className="text-[10px] font-mono text-slate-600 leading-tight">
                        <span className="block font-bold text-slate-800">DEV: ${cart.username || 'Unkown'}</span>
                        <span className="block text-slate-500">ID: ${cart.id.substring(0, 6)}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                         ${isAdminCreator && html`
                            <div className="w-4 h-4 rounded-full bg-yellow-400 border border-yellow-600 flex items-center justify-center text-[8px] font-bold text-yellow-900" title="Official Cart">★</div>
                         `}
                         <div className="flex items-center space-x-1 bg-slate-200 px-1.5 py-0.5 rounded border border-slate-300">
                            <${Eye} size=${10} className="text-slate-500" />
                            <span className="text-[10px] font-mono font-bold text-slate-700">${cart.views || 0}</span>
                         </div>
                    </div>
                </div>

                <!-- Admin Delete Button (Sticker Peel Effect) -->
                ${isAdminViewer && html`
                    <button 
                        onClick=${handleDelete} 
                        disabled=${deleting}
                        className="absolute bottom-1 right-1 p-1.5 text-red-500 hover:text-red-700 transition-colors z-20 opacity-0 group-hover:opacity-100"
                        title="Destroy Cart"
                    >
                        ${deleting ? html`<${Loader2} size=${14} className="animate-spin" />` : html`<${Trash2} size=${14} />`}
                    </button>
                `}
            </div>
        </div>

        <!-- Bottom Connector Opening -->
        <div className="mt-auto h-3 bg-black/40 mx-4 mb-0 rounded-t-sm shadow-inner"></div>
      </div>
      
      <!-- Side label (visible due to css 3d potentially, but just adding a border for now) -->
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-slate-900 rounded-r-lg opacity-50"></div>
    <//>
  `;
};