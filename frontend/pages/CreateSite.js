import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useNavigate, useLocation } from 'react-router-dom';
import { ModelType } from '../types.js';
import { Sparkles, AlertTriangle, Zap, Cpu, GitFork, Users, Globe, Cloud, Server, BrainCircuit } from 'lucide-react';
import { html } from '../utils.js';

const CreateSite = () => {
  const [prompt, setPrompt] = useState('');
  const [name, setName] = useState('');
  const [model, setModel] = useState(ModelType.GEMINI_2_FREE);
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [provider, setProvider] = useState('openrouter'); 
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
        
        const originalName = location.state.originalName || 'Project';
        if (location.state.isListed) {
            setName(`Remix of ${originalName}`);
        } else {
            setName(originalName);
        }
    }
  }, [location]);

  // Handle Model Selection Updates
  const selectModel = (selectedModel, selectedProvider) => {
      setModel(selectedModel);
      setProvider(selectedProvider);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const isMobile = window.innerWidth < 768;

    try {
        const payload = {
            prompt,
            name,
            model,
            multiplayer: isMultiplayer,
            remix_code: remixData ? remixData.code : null,
            provider: provider,
            is_mobile: isMobile
        };

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
                    placeholder=${remixData ? "Describe how you want to modify this cart..." : "Describe the application to simulate. Complex prompts will generate multiple files automatically."}
                  />
                  <div className="absolute bottom-4 right-4 text-xs text-slate-600 font-mono">
                    ${prompt.length} CHARS
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-slate-800/50 rounded-xl border border-white/5">
                <button
                    type="button"
                    onClick=${() => setIsMultiplayer(!isMultiplayer)}
                    className=${`w-12 h-6 rounded-full transition-colors relative ${isMultiplayer ? 'bg-primary-500' : 'bg-slate-700'}`}
                >
                    <div className=${`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${isMultiplayer ? 'left-7' : 'left-1'}`}></div>
                </button>
                <div>
                    <div className="flex items-center space-x-2">
                        <${Users} size=${16} className=${isMultiplayer ? 'text-primary-400' : 'text-slate-500'} />
                        <span className="font-bold text-sm text-white">Enable Real-Time Multiplayer</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">Allow users to interact via shared sockets.</p>
                </div>
              </div>

              <button
                type="submit"
                disabled=${loading}
                className="w-full group relative overflow-hidden bg-white text-slate-950 font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex items-center justify-center space-x-2">
                  ${loading ? html`
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-950"></div>
                    <span>Processing...</span>
                  ` : html`
                    <${Sparkles} size=${20} />
                    <span>${remixData ? 'Generate Remix' : 'Generate'}</span>
                  `}
                </div>
              </button>
            </form>
          </div>

          <!-- Settings Section -->
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-mono text-slate-400 mb-3 uppercase tracking-wider">
                Model Selection
              </label>
              
              <div className="space-y-3">
                
                <!-- Gemini 3.0 (Paid) - UNAVAILABLE -->
                <button
                    type="button"
                    disabled=${true}
                    className="w-full p-4 rounded-xl border border-white/5 text-left transition-all relative overflow-hidden group bg-slate-900/50 opacity-60 cursor-not-allowed"
                >
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                             <${Zap} className="text-slate-500" size=${20} />
                             <span className="font-bold text-slate-400 text-sm">Gemini 3.0 Flash</span>
                        </div>
                        <span className="text-[10px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full font-bold border border-slate-600">UNAVAILABLE</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 pl-7">Official API. Reasoning engine. Temporarily offline.</div>
                </button>

                <!-- Gemini 2.0 Free -->
                <button
                    type="button"
                    onClick=${() => selectModel(ModelType.GEMINI_2_FREE, 'openrouter')}
                    className=${`w-full p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${model === ModelType.GEMINI_2_FREE ? 'bg-slate-800 border-blue-500 ring-1 ring-blue-500' : 'bg-slate-900 border-white/10 hover:border-white/20'}`}
                >
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                             <${Cloud} className=${model === ModelType.GEMINI_2_FREE ? 'text-blue-400' : 'text-slate-500'} size=${20} />
                             <span className="font-bold text-white text-sm">Gemini 2.0 Flash</span>
                        </div>
                        <span className="text-[10px] bg-green-500/20 text-green-200 px-2 py-0.5 rounded-full font-bold border border-green-500/30">FREE</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 pl-7">OpenRouter. Fast experimental build.</div>
                </button>
                
                <!-- DeepSeek Free -->
                <button
                    type="button"
                    onClick=${() => selectModel(ModelType.DEEPSEEK_FREE, 'openrouter')}
                    className=${`w-full p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${model === ModelType.DEEPSEEK_FREE ? 'bg-slate-800 border-cyan-500 ring-1 ring-cyan-500' : 'bg-slate-900 border-white/10 hover:border-white/20'}`}
                >
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                             <${BrainCircuit} className=${model === ModelType.DEEPSEEK_FREE ? 'text-cyan-400' : 'text-slate-500'} size=${20} />
                             <span className="font-bold text-white text-sm">DeepSeek R1</span>
                        </div>
                        <span className="text-[10px] bg-green-500/20 text-green-200 px-2 py-0.5 rounded-full font-bold border border-green-500/30">FREE</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 pl-7">OpenRouter. Distilled Llama 70B.</div>
                </button>

              </div>
            </div>
            
             <div className="p-4 bg-slate-800/30 rounded-lg border border-white/5 text-xs text-slate-400">
                <span className="font-bold text-slate-300">Note:</span> Free models are provided via OpenRouter and may have rate limits or lower availability. Credits reset daily.
            </div>

          </div>
        </div>
      </div>
    </div>
  `;
};

export default CreateSite;