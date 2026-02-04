import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useNavigate, useLocation } from 'react-router-dom';
import { ModelType } from '../types.js';
import { Sparkles, AlertTriangle, Zap, Cpu, GitFork, Users, Globe, Cloud, Server, BrainCircuit, Terminal } from 'lucide-react';
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
    <div className="min-h-screen pt-24 pb-12 px-4 bg-[#111] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]">
      <div className="max-w-6xl mx-auto border border-slate-800 bg-slate-950/80 shadow-2xl relative">
        
        <!-- Blueprint Header -->
        <div className="bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <div className="p-2 border border-slate-600 bg-slate-800"><${Cpu} size=${20} className="text-blue-400"/></div>
                <div>
                    <h1 className="text-sm font-bold text-white uppercase tracking-[0.2em] leading-none">
                        ${remixData ? 'Modification_Module' : 'Cartridge_Fabricator'}
                    </h1>
                    <span className="text-[10px] text-slate-500 font-mono">ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
                </div>
            </div>
            <div className="hidden md:block text-right">
                <div className="text-[10px] text-slate-500 uppercase">System Status</div>
                <div className="text-xs text-green-500 font-mono font-bold animate-pulse">ONLINE</div>
            </div>
        </div>

        <div className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          <!-- LEFT COLUMN: Inputs -->
          <div className="lg:col-span-2 space-y-8">
            ${error && html`
                <div className="p-3 bg-red-900/20 border-l-2 border-red-500 text-red-400 text-xs font-mono">
                    ERROR: ${error}
                </div>
            `}
            ${remixData && html`
                <div className="p-3 bg-purple-900/20 border-l-2 border-purple-500 text-purple-300 text-xs font-mono flex items-center justify-between">
                    <span>> REMIXING SOURCE: "${remixData.originalName}"</span>
                    <button onClick=${() => { setRemixData(null); setName(''); }} className="underline hover:text-white">ABORT</button>
                </div>
            `}

            <form onSubmit=${handleSubmit} className="space-y-6">
                <!-- Name Field -->
                <div className="relative border-b border-slate-700 pb-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Project Designation</label>
                    <input
                        type="text"
                        value=${name}
                        onChange=${(e) => setName(e.target.value)}
                        className="w-full bg-transparent text-xl md:text-2xl font-mono text-white placeholder-slate-700 outline-none uppercase"
                        placeholder="ENTER_NAME..."
                        required
                    />
                    <div className="absolute right-0 bottom-2 text-slate-700"><${Terminal} size=${16} /></div>
                </div>

                <!-- Prompt Field -->
                <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Specifications (Prompt)</label>
                    <div className="relative border border-slate-700 bg-[#0a0a0a] p-1">
                        <!-- Ruler markers -->
                        <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-slate-500"></div>
                        <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-slate-500"></div>
                        <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-slate-500"></div>
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-slate-500"></div>
                        
                        <textarea
                            value=${prompt}
                            onChange=${(e) => setPrompt(e.target.value)}
                            required
                            rows=${10}
                            className="w-full bg-transparent p-4 text-slate-300 placeholder-slate-700 font-mono text-sm outline-none resize-none leading-relaxed"
                            placeholder=${remixData ? "Define modification parameters..." : "Describe the digital environment to simulate. Detailed inputs yield higher fidelity results."}
                        ></textarea>
                        
                        <div className="absolute bottom-2 right-2 text-[10px] text-slate-600 font-mono">
                            BYTES: ${prompt.length}
                        </div>
                    </div>
                </div>

                <!-- Options -->
                <div className="flex items-center space-x-4">
                     <button
                        type="button"
                        onClick=${() => setIsMultiplayer(!isMultiplayer)}
                        className=${`flex items-center space-x-3 px-4 py-2 border transition-all ${isMultiplayer ? 'border-primary-500 bg-primary-900/20 text-primary-400' : 'border-slate-700 bg-slate-900 text-slate-500 hover:border-slate-500'}`}
                    >
                        <div className=${`w-3 h-3 border ${isMultiplayer ? 'bg-primary-500 border-primary-400' : 'bg-transparent border-slate-500'}`}></div>
                        <div className="text-xs font-bold uppercase tracking-wider">Netplay (Socket.IO)</div>
                    </button>
                </div>

                <!-- Fabricate Button -->
                <button
                    type="submit"
                    disabled=${loading}
                    className="w-full group relative overflow-hidden bg-white text-black font-black uppercase tracking-widest py-5 hover:bg-slate-200 transition-all border-b-4 border-slate-400 active:border-b-0 active:translate-y-[4px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="relative flex items-center justify-center space-x-3">
                         ${loading ? html`
                            <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent"></div>
                            <span>Compiling Assets...</span>
                         ` : html`
                            <${Sparkles} size=${18} />
                            <span>Initiate Fabrication</span>
                         `}
                    </div>
                </button>
            </form>
          </div>

          <!-- RIGHT COLUMN: Specs -->
          <div className="space-y-6">
             <div className="border border-slate-700 bg-slate-900/50 p-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-700 pb-2">Processing Core</h3>
                
                <div className="space-y-3">
                    <button
                        type="button"
                        onClick=${() => selectModel(ModelType.GEMINI_2_FREE, 'openrouter')}
                        className=${`w-full p-3 border text-left transition-all relative group flex items-start space-x-3 ${model === ModelType.GEMINI_2_FREE ? 'bg-blue-900/20 border-blue-500' : 'bg-transparent border-slate-700 hover:border-slate-500'}`}
                    >
                        <${Cloud} size=${16} className=${model === ModelType.GEMINI_2_FREE ? 'text-blue-400' : 'text-slate-600'} />
                        <div>
                            <div className="text-xs font-bold text-white uppercase">Gemini 2.0 Flash</div>
                            <div className="text-[10px] text-slate-500 mt-1">Standard Issue. High Speed.</div>
                        </div>
                        <div className="absolute top-2 right-2 text-[8px] bg-green-900 text-green-400 px-1 border border-green-700">FREE</div>
                    </button>

                    <button
                        type="button"
                        onClick=${() => selectModel(ModelType.DEEPSEEK_FREE, 'openrouter')}
                        className=${`w-full p-3 border text-left transition-all relative group flex items-start space-x-3 ${model === ModelType.DEEPSEEK_FREE ? 'bg-cyan-900/20 border-cyan-500' : 'bg-transparent border-slate-700 hover:border-slate-500'}`}
                    >
                        <${BrainCircuit} size=${16} className=${model === ModelType.DEEPSEEK_FREE ? 'text-cyan-400' : 'text-slate-600'} />
                        <div>
                            <div className="text-xs font-bold text-white uppercase">DeepSeek R1</div>
                            <div className="text-[10px] text-slate-500 mt-1">Logic Optimized. Distilled.</div>
                        </div>
                        <div className="absolute top-2 right-2 text-[8px] bg-green-900 text-green-400 px-1 border border-green-700">FREE</div>
                    </button>
                    
                    <div className="w-full p-3 border border-slate-800 bg-slate-900 opacity-50 flex items-start space-x-3 cursor-not-allowed">
                        <${Zap} size=${16} className="text-slate-700" />
                         <div>
                            <div className="text-xs font-bold text-slate-500 uppercase">Gemini 3.0</div>
                            <div className="text-[10px] text-slate-600 mt-1">Premium Core. Offline.</div>
                        </div>
                    </div>
                </div>
             </div>

             <div className="bg-slate-900 border border-slate-800 p-4 text-[10px] font-mono text-slate-500 leading-relaxed">
                > NOTE: Free tier models are routed via OpenRouter.<br/>
                > Latency may vary based on network congestion.<br/>
                > Credits required for premium tier.
             </div>
          </div>

        </div>
      </div>
    </div>
  `;
};

export default CreateSite;