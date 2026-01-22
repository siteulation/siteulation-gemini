import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useNavigate, useLocation } from 'react-router-dom';
import { ModelType } from '../types.js';
import { Sparkles, AlertTriangle, Zap, Cpu, GitFork } from 'lucide-react';
import { html } from '../utils.js';

const CreateSite = () => {
  const [prompt, setPrompt] = useState('');
  const [name, setName] = useState('');
  const [model, setModel] = useState(ModelType.GEMINI_3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Remix state
  const [remixData, setRemixData] = useState(null);

  useEffect(() => {
    if (location.state && location.state.remixCode) {
        setRemixData({
            code: location.state.remixCode,
            originalName: location.state.originalName || 'Original'
        });
        
        // Naming Logic:
        // If the original cart was LISTED (public), prepend "Remix of".
        // If the original cart was UNLISTED (private), keep the name/prompt as is.
        const originalName = location.state.originalName || 'Project';
        if (location.state.isListed) {
            setName(`Remix of ${originalName}`);
        } else {
            setName(originalName);
        }
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        prompt,
        name,
        model,
        remix_code: remixData ? remixData.code : null
      };

      // api.request now returns the data object directly, or throws an error
      const data = await api.request('/api/generate', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

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
          <h1 className="text-4xl font-bold text-white mb-2">
            ${remixData ? 'Remix Cart' : 'Create Cart'}
          </h1>
          <p className="text-slate-400">
            ${remixData ? `Modifying existing code from "${remixData.originalName}".` : 'Configure parameters for your new digital environment.'}
          </p>
        </div>

        ${error && html`
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-3 text-red-200">
            <${AlertTriangle} size=${20} />
            <span>${error}</span>
          </div>
        `}
        
        ${remixData && html`
           <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center space-x-3 text-purple-200">
             <${GitFork} size=${20} />
             <span>Remix Mode Active: Your prompt will be applied to the existing codebase.</span>
             <button onClick=${() => { setRemixData(null); setName(''); }} className="ml-auto text-xs underline hover:text-white">Cancel Remix</button>
           </div>
        `}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Form Section -->
          <div className="lg:col-span-2">
            <form onSubmit=${handleSubmit} className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm space-y-6">
              
              <div>
                <label className="block text-sm font-mono text-slate-400 mb-3 uppercase tracking-wider">
                  Project Name
                </label>
                <input
                    type="text"
                    value=${name}
                    onChange=${(e) => setName(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    placeholder="e.g., Cyberpunk Dashboard"
                    required
                />
              </div>

              <div>
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
                    placeholder=${remixData ? "Describe how you want to modify this cart..." : "Describe the application to simulate..."}
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
                    <span>${remixData ? 'Generate Remix' : 'Generate'}</span>
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
              disabled
              className="w-full p-4 rounded-xl border text-left transition-all relative overflow-hidden group bg-slate-800 border-purple-500 ring-1 ring-purple-500 cursor-default"
            >
              <div className="flex justify-between items-start mb-2">
                <${Cpu} className="text-purple-400" size=${24} />
                <span className="text-[10px] bg-purple-500 text-white px-2 py-0.5 rounded-full font-bold">LATEST</span>
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