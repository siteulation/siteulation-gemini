import React from 'react';
import { Link } from 'react-router-dom';
import { Cart } from '../types';
import { Code, Clock, User } from 'lucide-react';

interface CartCardProps {
  cart: Cart;
}

export const CartCard: React.FC<CartCardProps> = ({ cart }) => {
  return (
    <Link to={`/cart/${cart.id}`} className="block group">
      <div className="h-full bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-blue-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/20">
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-gray-700 rounded-lg group-hover:bg-blue-600 transition-colors">
              <Code size={20} className="text-white" />
            </div>
            <span className="text-xs font-mono text-gray-500 bg-gray-900 px-2 py-1 rounded">
              {cart.model}
            </span>
          </div>
          
          <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
            {cart.prompt}
          </h3>
          
          <div className="mt-auto flex items-center justify-between text-sm text-gray-400 pt-4 border-t border-gray-700">
            <div className="flex items-center space-x-1">
              <User size={14} />
              <span className="truncate max-w-[100px]">{cart.username || 'Anonymous'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock size={14} />
              <span>{new Date(cart.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
