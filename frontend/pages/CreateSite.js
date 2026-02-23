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
    <div className="min-h-screen pt-24 pb-12 px-4 overflow-x-hidden" style=${{
        backgroundColor: '#2563eb',
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='30' viewBox='0 0 120 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 15 Q 30 0, 60 15 T 120 15' fill='none' stroke='white' stroke-width='1' opacity='0.4'/%3E%3C/svg%3E")`,
        backgroundSize: '120px 30px'
    }}>
      <div className="max-w-6xl mx-auto bg-[#FFF9D2] border-4 border-[#5C3A21] shadow-2xl relative">
        
        <!-- Blueprint Header -->
        <div className="bg-[#A05A2C] border-b-4 border-[#5C3A21] p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <img 
                    src="https://raw.githubusercontent.com/siteulation/Siteulation/refs/heads/main/playsoul%20outline.svg" 
                    alt="PlaySOUL" 
                    className="h-8"
                    crossOrigin="anonymous"
                />
                <div>
                    <h1 className="text-sm font-bold text-white uppercase tracking-widest leading-none">
                        ${remixData ? 'Modification Blueprint' : 'New Game Blueprint'}
                    </h1>
                </div>
            </div>
            <div className="hidden md:block text-right">
                <div className="text-[10px] text-white/70 uppercase">Creative Engine</div>
                <div className="text-xs text-white font-bold animate-pulse">READY</div>
            </div>
        </div>

        <div className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          <!-- LEFT COLUMN: Inputs -->
          <div className="lg:col-span-2 space-y-8">
            ${error && html`
                <div className="p-3 bg-red-100 border-l-4 border-red-500 text-red-700 text-sm font-bold">
                    ERROR: ${error}
                </div>
            `}
            ${remixData && html`
                <div className="p-3 bg-blue-100 border-l-4 border-blue-500 text-blue-700 text-sm font-bold flex items-center justify-between">
                    <span>> REMIXING: "${remixData.originalName}"</span>
                    <button onClick=${() => { setRemixData(null); setName(''); }} className="underline hover:text-blue-900">ABORT</button>
                </div>
            `}

            <form onSubmit=${handleSubmit} className="space-y-6">
                <!-- Name Field -->
                <div className="relative border-b-2 border-[#5C3A21] pb-2">
                    <label className="block text-xs font-bold text-[#5C3A21] uppercase tracking-widest mb-2">Game Title</label>
                    <input
                        type="text"
                        value=${name}
                        onChange=${(e) => setName(e.target.value)}
                        className="w-full bg-transparent text-xl md:text-2xl font-bold text-[#5C3A21] placeholder-[#5C3A21]/30 outline-none uppercase"
                        placeholder="THE_LEGEND_OF_..."
                        required
                    />
                </div>

                <!-- Prompt Field -->
                <div>
                    <label className="block text-xs font-bold text-[#5C3A21] uppercase tracking-widest mb-2">Game Vision (Prompt)</label>
                    <div className="relative border-2 border-[#5C3A21] bg-white/50 p-1">
                        <textarea
                            value=${prompt}
                            onChange=${(e) => setPrompt(e.target.value)}
                            required
                            rows=${10}
                            className="w-full bg-transparent p-4 text-[#5C3A21] placeholder-[#5C3A21]/30 font-medium text-lg outline-none resize-none leading-relaxed"
                            placeholder=${remixData ? "Define modification parameters..." : "Describe the game you want to create. Be specific about gameplay, art style, and mechanics!"}
                        ></textarea>
                        
                        <div className="absolute bottom-2 right-2 text-[10px] text-[#5C3A21]/50 font-bold">
                            CHARS: ${prompt.length}
                        </div>
                    </div>
                </div>

                <!-- Options -->
                <div className="flex items-center space-x-4">
                     <button
                        type="button"
                        onClick=${() => setIsMultiplayer(!isMultiplayer)}
                        className=${`flex items-center space-x-3 px-4 py-2 border-2 transition-all ${isMultiplayer ? 'border-[#5C3A21] bg-[#5C3A21] text-[#FFF9D2]' : 'border-[#5C3A21] bg-white/30 text-[#5C3A21] hover:bg-white/50'}`}
                    >
                        <div className=${`w-3 h-3 border ${isMultiplayer ? 'bg-[#FFF9D2] border-[#FFF9D2]' : 'bg-transparent border-[#5C3A21]'}`}></div>
                        <div className="text-xs font-bold uppercase tracking-wider">Multiplayer (Socket.IO)</div>
                    </button>
                </div>

                <!-- Fabricate Button -->
                <button
                    type="submit"
                    disabled=${loading}
                    className="w-full bg-[#5C3A21] text-[#FFF9D2] font-black uppercase tracking-widest py-5 hover:bg-[#4A2F1B] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="relative flex items-center justify-center space-x-3">
                         ${loading ? html`
                            <div className="animate-spin w-4 h-4 border-2 border-[#FFF9D2] border-t-transparent"></div>
                            <span>Generating World...</span>
                         ` : html`
                            <${Sparkles} size=${18} />
                            <span>Build Game!</span>
                         `}
                    </div>
                </button>
            </form>
          </div>

          <!-- RIGHT COLUMN: Specs -->
          <div className="space-y-6">
             <div className="border-2 border-[#5C3A21] bg-white/30 p-4">
                <h3 className="text-xs font-bold text-[#5C3A21] uppercase tracking-widest mb-4 border-b-2 border-[#5C3A21] pb-2">AI Engine</h3>
                
                <div className="space-y-3">
                    <button
                        type="button"
                        onClick=${() => selectModel(ModelType.GEMINI_2_FREE, 'openrouter')}
                        className=${`w-full p-3 border-2 text-left transition-all relative group flex items-start space-x-3 ${model === ModelType.GEMINI_2_FREE ? 'bg-[#5C3A21] border-[#5C3A21] text-[#FFF9D2]' : 'bg-white/50 border-[#5C3A21]/30 text-[#5C3A21] hover:border-[#5C3A21]'}`}
                    >
                        <${Cloud} size=${16} className=${model === ModelType.GEMINI_2_FREE ? 'text-[#FFF9D2]' : 'text-[#5C3A21]'} />
                        <div>
                            <div className="text-xs font-bold uppercase">Gemma 3 2B</div>
                            <div className="text-[10px] opacity-70 mt-1">Efficient & Fast.</div>
                        </div>
                        <div className="absolute top-2 right-2 text-[8px] bg-green-600 text-white px-1 font-bold">FREE</div>
                    </button>

                    <button
                        type="button"
                        onClick=${() => selectModel(ModelType.DEEPSEEK_FREE, 'openrouter')}
                        className=${`w-full p-3 border-2 text-left transition-all relative group flex items-start space-x-3 ${model === ModelType.DEEPSEEK_FREE ? 'bg-[#5C3A21] border-[#5C3A21] text-[#FFF9D2]' : 'bg-white/50 border-[#5C3A21]/30 text-[#5C3A21] hover:border-[#5C3A21]'}`}
                    >
                        <${BrainCircuit} size=${16} className=${model === ModelType.DEEPSEEK_FREE ? 'text-[#FFF9D2]' : 'text-[#5C3A21]'} />
                        <div>
                            <div className="text-xs font-bold uppercase">Gemma 3 2B (Alt)</div>
                            <div className="text-[10px] opacity-70 mt-1">Stable Backup.</div>
                        </div>
                        <div className="absolute top-2 right-2 text-[8px] bg-green-600 text-white px-1 font-bold">FREE</div>
                    </button>
                    
                    <div className="w-full p-3 border-2 border-[#5C3A21]/10 bg-white/10 opacity-50 flex items-start space-x-3 cursor-not-allowed">
                        <${Zap} size=${16} className="text-[#5C3A21]/30" />
                         <div>
                            <div className="text-xs font-bold text-[#5C3A21]/30 uppercase">Gemini 3.0</div>
                            <div className="text-[10px] text-[#5C3A21]/30 mt-1">Premium Engine.</div>
                        </div>
                    </div>
                </div>
             </div>

             <div className="bg-[#5C3A21]/10 border-2 border-[#5C3A21]/20 p-4 text-xs font-medium text-[#5C3A21] leading-relaxed">
                > Free models are routed via OpenRouter.<br/>
                > Generation time may vary.<br/>
                > Credits required for premium features.
             </div>
          </div>

        </div>
      </div>
    </div>
  `;
};

export default CreateSite;