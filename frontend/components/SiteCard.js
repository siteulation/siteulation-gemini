import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Code2, Clock, UserCircle, Cpu, Eye, Trash2, ShieldCheck, Loader2, Lock } from 'lucide-react';
import { html } from '../utils.js';
import { api } from '../services/api.js';

export const SiteCard = ({ cart, currentUser, onDelete }) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e) => {
    e.preventDefault(); // Prevent link navigation
    if (!window.confirm("Admin: Are you sure you want to delete this cart?")) return;
    
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
  
  // Use name if available, otherwise fallback to prompt
  const displayName = cart.name || cart.prompt;

  return html`
    <${Link} to=${`/site/${cart.id}`} className="block group relative">
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-purple-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative h-full bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:border-primary-500/50 transition-all duration-300 flex flex-col">
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-slate-800 rounded text-primary-400">
                <${Cpu} size=${16} />
              </div>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                ${cart.model}
              </span>
            </div>
            
            <div className="flex items-center space-x-1">
                ${!cart.is_listed && html`
                    <div className="flex items-center space-x-1 bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase" title="Only visible to you">
                        <${Lock} size=${10} />
                        <span>UNLISTED</span>
                    </div>
                `}

                ${isAdminCreator && html`
                <div className="flex items-center space-x-1 bg-red-500/20 border border-red-500/30 text-red-300 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">
                    <${ShieldCheck} size=${12} />
                    <span>ADMIN</span>
                </div>
                `}

                ${isAdminViewer && html`
                <button 
                    onClick=${handleDelete} 
                    disabled=${deleting}
                    className="p-1.5 bg-red-900/50 text-red-400 hover:bg-red-600 hover:text-white rounded transition-colors z-20 ml-1"
                    title="Admin Delete"
                >
                    ${deleting ? html`<${Loader2} size=${14} className="animate-spin" />` : html`<${Trash2} size=${14} />`}
                </button>
                `}
            </div>
          </div>
          
          <h3 className="text-lg font-bold text-white mb-3 line-clamp-2 group-hover:text-primary-400 transition-colors leading-snug">
            ${displayName}
          </h3>
          
          <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-500 font-mono">
            <div className="flex items-center space-x-1.5">
              <${UserCircle} size=${14} />
              <span className="truncate max-w-[80px]">${cart.username || 'System'}</span>
            </div>
            
            <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1" title="Total Views">
                    <${Eye} size=${14} />
                    <span>${cart.views || 0}</span>
                </div>
                <div className="flex items-center space-x-1" title="Created At">
                    <${Clock} size=${14} />
                    <span>${new Date(cart.created_at).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}</span>
                </div>
            </div>
          </div>
        </div>
      </div>
    <//>
  `;
};