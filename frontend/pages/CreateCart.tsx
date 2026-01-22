import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../constants';
import { ModelType } from '../types';
import { Sparkles, AlertCircle } from 'lucide-react';

const CreateCart: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<ModelType>(ModelType.GEMINI_2_5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check verification status
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      
      // If signed up via email/password, ensure confirmed
      if (user.app_metadata.provider === 'email' && !user.email_confirmed_at) {
        setError("Please verify your email address to create carts.");
      }
    };
    checkUser();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      if (user.app_metadata.provider === 'email' && !user.email_confirmed_at) {
        throw new Error("Please verify your email address first.");
      }

      // Prepare payload
      const payload = {
        prompt,
        model,
        userId: user.id,
        username: user.user_metadata.username || user.email?.split('@')[0] || 'Anonymous'
      };

      const response = await fetch(`${BACKEND_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate cart');
      }

      // Navigate to the new cart
      navigate(`/cart/${data.cart.id}`);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Create New Cart</h1>
          <p className="text-gray-400">Describe your mini-app and let Gemini build it for you.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-xl flex items-center space-x-3 text-red-200">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                What should we build?
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                required
                rows={6}
                className="w-full bg-gray-900 border border-gray-600 rounded-xl p-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                placeholder="e.g., A pomodoro timer with a dark theme and sound notifications..."
              />
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Model
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setModel(ModelType.GEMINI_2_5)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    model === ModelType.GEMINI_2_5
                      ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500'
                      : 'bg-gray-900 border-gray-700 hover:border-gray-500'
                  }`}
                >
                  <div className="font-semibold text-white">Gemini 2.5 Flash</div>
                  <div className="text-xs text-gray-400 mt-1">Fast & Efficient</div>
                </button>

                <button
                  type="button"
                  onClick={() => setModel(ModelType.GEMINI_3)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    model === ModelType.GEMINI_3
                      ? 'bg-purple-600/20 border-purple-500 ring-1 ring-purple-500'
                      : 'bg-gray-900 border-gray-700 hover:border-gray-500'
                  }`}
                >
                  <div className="font-semibold text-white">Gemini 3.0 Flash Preview</div>
                  <div className="text-xs text-gray-400 mt-1">Next Gen Intelligence</div>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !!error}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-[1.01] shadow-lg hover:shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  <span>Generate Cart</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCart;