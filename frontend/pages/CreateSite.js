import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase.js';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../constants.js';
import { ModelType } from '../types.js';
import { Sparkles, AlertTriangle, Zap, Cpu } from 'lucide-react';
import { html } from '../utils.js';

const CreateSite = () => {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState(ModelType.GEMINI_2_5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
      }
    };
    checkUser();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Auth Token Expired");

      const payload = {
        prompt,
        model,
        userId: user.id,
        username: user.user_metadata.username || user.email?.split('@')[0] || 'Operator'
      };

      const response = await fetch(`${BACKEND_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Generation Failed');
      }

      navigate(`/site/${data.cart.id}`);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return html`
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">Create Cart</h1>
          <p className="text-slate-400">Configure parameters for your new digital environment.</p>
        </div>

        ${error && html`
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-3 text-red-200">
            <${AlertTriangle} size=${20} />
            <span>${error}</span>
          </div>
        `}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Form Section -->
          <div className="lg:col-span-2">
            <form onSubmit=${handleSubmit} className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
              <div className="mb-8">
                <label className="block text-sm font-mono text-slate-400 mb-3 uppercase tracking-wider">
                  Prompt
                </label>
                <div className="relative">
                  <textarea
                    value=${prompt}
                    onChange=${(e) => setPrompt(e.target.value)}
                    required
                    rows=${8}
                    className="w-full bg-slate-950/50 border border-slate-700 rounded-xl p-5 text-white placeholder-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none text-lg leading-relaxed"
                    placeholder="Describe the application to simulate..."
                  />
                  <div className="absolute bottom-4 right-4 text-xs text-slate-600 font-mono">
                    ${prompt.length} CHARS
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled=${loading || !!error}
                className="w-full group relative overflow-hidden bg-white text-slate-950 font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex items-center justify-center space-x-2">
                  ${loading ? html`
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-950"></div>
                    <span>Compiling Assets...</span>
                  ` : html`
                    <${Sparkles} size=${20} />
                    <span>Generate</span>
                  `}
                </div>
              </button>
            </form>
          </div>

          <!-- Settings Section -->
          <div className="space-y-4">
            <label className="block text-sm font-mono text-slate-400 mb-3 uppercase tracking-wider">
              AI Core Selection
            </label>
            
            <button
              type="button"
              onClick=${() => setModel(ModelType.GEMINI_2_5)}
              className=${`w-full p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${
                model === ModelType.GEMINI_2_5
                  ? 'bg-slate-800 border-primary-500 ring-1 ring-primary-500'
                  : 'bg-slate-900/50 border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <${Zap} className=${model === ModelType.GEMINI_2_5 ? 'text-primary-400' : 'text-slate-600'} size=${24} />
                ${model === ModelType.GEMINI_2_5 && html`<span className="text-[10px] bg-primary-500 text-white px-2 py-0.5 rounded-full font-bold">ACTIVE</span>`}
              </div>
              <div className="font-bold text-white">Gemini 2.5 Flash</div>
              <div className="text-xs text-slate-400 mt-1">High-velocity compilation. Best for standard utilities.</div>
            </button>

            <button
              type="button"
              onClick=${() => setModel(ModelType.GEMINI_3)}
              className=${`w-full p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${
                model === ModelType.GEMINI_3
                  ? 'bg-slate-800 border-purple-500 ring-1 ring-purple-500'
                  : 'bg-slate-900/50 border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <${Cpu} className=${model === ModelType.GEMINI_3 ? 'text-purple-400' : 'text-slate-600'} size=${24} />
                ${model === ModelType.GEMINI_3 && html`<span className="text-[10px] bg-purple-500 text-white px-2 py-0.5 rounded-full font-bold">PREVIEW</span>`}
              </div>
              <div className="font-bold text-white">Gemini 3.0 Flash</div>
              <div className="text-xs text-slate-400 mt-1">Advanced reasoning engine. Best for complex logic.</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
};

export default CreateSite;
