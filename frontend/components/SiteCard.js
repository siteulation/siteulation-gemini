import React from 'react';
import { Link } from 'react-router-dom';
import { Code2, Clock, UserCircle, Cpu } from 'lucide-react';
import { html } from '../utils.js';

export const SiteCard = ({ cart }) => {
  return html`
    <${Link} to=${`/site/${cart.id}`} className="block group relative">
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-purple-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative h-full bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:border-primary-500/50 transition-all duration-300">
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
          </div>
          
          <h3 className="text-lg font-bold text-white mb-3 line-clamp-2 group-hover:text-primary-400 transition-colors leading-snug">
            ${cart.prompt}
          </h3>
          
          <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-500 font-mono">
            <div className="flex items-center space-x-1.5">
              <${UserCircle} size=${14} />
              <span className="truncate max-w-[100px]">${cart.username || 'System'}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <${Clock} size=${14} />
              <span>${new Date(cart.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    <//>
  `;
};
