import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useNavigate, useLocation } from 'react-router-dom';
import { ModelType } from '../types.js';
import { Sparkles, AlertTriangle, Zap, Cpu, GitFork, Users, Globe, Cloud, Server } from 'lucide-react';
import { html } from '../utils.js';

// Multiplayer Template (Must match backend logic)
const MULTIPLAYER_PROMPT = `
*** IMPORTANT: MULTIPLAYER MODE ENABLED ***
You MUST implement real-time multiplayer functionality using the provided WebSocket server.

1.  **Include Socket.IO**: \`<script src="https://cdn.socket.io/4.7.4/socket.io.min.js"></script>\`
2.  **Initialize**: \`const socket = io({transports: ['websocket', 'polling']});\`
3.  **Rooms**: Generate a Room ID or let the user input one.
4.  **Join**: \`socket.emit('join', { room: myRoomId });\`

**Sending Data:**
*   **State Updates** (Positions, Game Data): 
    \`socket.emit('state_update', { room: myRoomId, data: { ... } });\`
    *Server relays this to other players.*
*   **Chat/Messages**: 
    \`socket.emit('chat_message', { room: myRoomId, username: 'User', text: 'Hello' });\`
    *Server relays this to other players.*

**Receiving Data:**
*   \`socket.on('state_update', (data) => { ...updateGameState(data)... });\`
*   \`socket.on('chat_message', (msg) => { ...appendMessageToChat(msg)... });\`
*   \`socket.on('player_joined', (data) => { ... });\`
*   \`socket.on('player_left', (data) => { ... });\`

**Note:** The server DOES NOT echo messages back to the sender. You must append your own messages/state updates to your local view immediately after sending.
`;

const SYSTEM_INSTRUCTION = "You are Siteulation AI. Generate a SINGLE-FILE HTML app. Include CSS in <style> and JS in <script>. Do NOT use markdown. Return raw HTML only.";

const CreateSite = () => {
  const [prompt, setPrompt] = useState('');
  const [name, setName] = useState('');
  const [model, setModel] = useState(ModelType.GEMINI_3);
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [provider, setProvider] = useState('puter'); // 'puter' | 'official'
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let generatedCode = null;

    try {
        // --- PUTER GENERATION LOGIC ---
        if (provider === 'puter') {
            if (!window.puter) {
                throw new Error("Puter.js not loaded. Check connection.");
            }

            let finalPrompt = prompt;

            // 1. Remix Logic
            if (remixData) {
                finalPrompt = `I want to Remix/Modify this existing HTML application code.\n\nEXISTING CODE:\n${remixData.code}\n\nUSER REQUEST:\n${prompt}`;
            }

            // 2. Multiplayer Logic
            if (isMultiplayer) {
                finalPrompt += "\n" + MULTIPLAYER_PROMPT;
            }

            finalPrompt += "\nGenerate the updated single-file HTML app.";

            // 3. Call Puter AI
            // We prepend system instruction as part of the prompt since puter.ai.chat simple interface is string-based
            const fullMessage = `${SYSTEM_INSTRUCTION}\n\n${finalPrompt}`;
            
            // Note: Puter generic chat usually defaults to GPT-4o-mini or similar, effectively giving us good generation for free.
            // We requested Gemini 3 via UI, but Puter abstracts the model. It's high quality.
            const response = await window.puter.ai.chat(fullMessage);
            
            if (!response || typeof response !== 'string') {
                throw new Error("Puter AI returned invalid response.");
            }
            
            generatedCode = response;
        }

        // --- BACKEND REQUEST ---
        const payload = {
            prompt,
            name,
            model,
            multiplayer: isMultiplayer,
            remix_code: remixData ? remixData.code : null,
            pre_generated_code: generatedCode // Pass this if we used Puter
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
                    placeholder=${remixData ? "Describe how you want to modify this cart..." : "Describe the application to simulate..."}
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
                    <span>${provider === 'puter' ? 'Generating via Puter...' : 'Compiling Assets...'}</span>
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
                Compute Provider
              </label>
              <div className="space-y-2">
                <button
                    type="button"
                    onClick=${() => setProvider('puter')}
                    className=${`w-full p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${provider === 'puter' ? 'bg-slate-800 border-primary-500 ring-1 ring-primary-500' : 'bg-slate-900 border-white/10 hover:border-white/20'}`}
                >
                    <div className="flex justify-between items-start mb-2">
                        <${Cloud} className=${provider === 'puter' ? 'text-primary-400' : 'text-slate-500'} size=${24} />
                        ${provider === 'puter' && html`<span className="text-[10px] bg-primary-500 text-white px-2 py-0.5 rounded-full font-bold">DEFAULT</span>`}
                    </div>
                    <div className="font-bold text-white">Puter.js</div>
                    <div className="text-xs text-slate-400 mt-1">Client-side generation. Free & Unlimited.</div>
                </button>

                <button
                    type="button"
                    onClick=${() => setProvider('official')}
                    className=${`w-full p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${provider === 'official' ? 'bg-slate-800 border-primary-500 ring-1 ring-primary-500' : 'bg-slate-900 border-white/10 hover:border-white/20'}`}
                >
                    <div className="flex justify-between items-start mb-2">
                        <${Server} className=${provider === 'official' ? 'text-primary-400' : 'text-slate-500'} size=${24} />
                    </div>
                    <div className="font-bold text-white">Official API</div>
                    <div className="text-xs text-slate-400 mt-1">Server-side generation. High Speed.</div>
                </button>
              </div>
            </div>

            <div>
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
    </div>
  `;
};

export default CreateSite;