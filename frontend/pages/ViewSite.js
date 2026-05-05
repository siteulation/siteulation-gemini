import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { ArrowLeft, Loader2, Monitor, Smartphone, Tablet, ExternalLink, Code, Trash2, ShieldAlert, GitFork, Pencil, Check, X, Copy, Globe, Lock, FileCode, FileType, File, User as UserIcon, Sparkles, BrainCircuit, Zap } from 'lucide-react';
import { html, bundleProject } from '../utils.js';
import { ModelType } from '../types.js';
import Editor from '@monaco-editor/react';

const ViewSite = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewport, setViewport] = useState('desktop');
  const [adminActionLoading, setAdminActionLoading] = useState(false);
  
  // Renaming State
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  
  // Code View State
  const [showCode, setShowCode] = useState(false);
  const [files, setFiles] = useState([]); // Array of {name, content}
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [previewCode, setPreviewCode] = useState('');
  const [copied, setCopied] = useState(false);

  // Forking State
  const [isForking, setIsForking] = useState(false);
  const [forkName, setForkName] = useState('');
  const [forkPrompt, setForkPrompt] = useState('');
  const [forkModel, setForkModel] = useState(ModelType.GEMMA_3_27B);
  const [isForkingLoading, setIsForkingLoading] = useState(false);

  // Console Logs State
  const [logs, setLogs] = useState([]);
  const [showConsole, setShowConsole] = useState(false);
  const consoleRef = React.useRef(null);

  useEffect(() => {
    if (showConsole && consoleRef.current) {
        consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs, showConsole]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'iframe_console') {
        const { logType, args } = event.data;
        setLogs(prev => [...prev, {
            id: Date.now() + Math.random(),
            type: logType,
            content: args.join(' '),
            timestamp: new Date().toLocaleTimeString()
        }].slice(-100)); // Keep last 100 logs
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    const fetchCart = async () => {
      if (!id) return;
      try {
        // Fetch cart data
        const data = await api.request(`/api/carts/${id}`);
        setCart(data);
        setNewName(data.name || data.prompt);

        // Process Code (Handle JSON vs Legacy String)
        let parsedFiles = [];
        try {
            const json = JSON.parse(data.code);
            if (json.files && Array.isArray(json.files)) {
                parsedFiles = json.files;
            } else {
                throw new Error("Not structured JSON");
            }
        } catch (e) {
            // Fallback for legacy single-string carts
            parsedFiles = [{ name: 'index.html', content: data.code }];
        }
        
        setFiles(parsedFiles);
        
        // Increment view count asynchronously
        api.request(`/api/carts/${id}/view`, { method: 'POST' }).catch(err => {
            console.warn("Failed to count view", err);
        });
        
      } catch (error) {
        console.error("Error fetching site:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [id]);

  // Re-bundle when files change
  useEffect(() => {
     if (files.length > 0) {
         const bundled = bundleProject(files);
         setPreviewCode(bundled);
         setLogs([]); // Clear console on reload/change
     }
  }, [files]);

  const handleAdminDelete = async () => {
    if (!window.confirm("Admin: Permanently delete this cart?")) return;
    setAdminActionLoading(true);
    try {
        await api.admin.deleteCart(cart.id);
        navigate('/');
    } catch (e) {
        alert(e.message);
    } finally {
        setAdminActionLoading(false);
    }
  };

  const handleAdminBan = async () => {
    if (!window.confirm(`Admin: BAN user '${cart.username}'? They will be unable to generate new carts.`)) return;
    setAdminActionLoading(true);
    try {
        await api.admin.banUser(cart.user_id);
        alert(`User ${cart.username} has been banned.`);
    } catch (e) {
        alert(e.message);
    } finally {
        setAdminActionLoading(false);
    }
  };
  
  const handleRemix = () => {
    if (cart.is_listed) {
        setForkName(`Fork of ${cart.name || 'Project'}`);
    } else {
        setForkName(cart.name || 'Project');
    }
    setForkPrompt(cart.prompt || '');
    setForkModel(cart.model || ModelType.GEMMA_3_27B);
    setIsForking(true);
  };

  const executeFork = async () => {
    setIsForkingLoading(true);
    try {
        const isMobile = window.innerWidth < 768;
        const payload = {
            prompt: forkPrompt,
            name: forkName,
            model: forkModel,
            multiplayer: false,
            remix_code: cart.code,
            provider: 'official',
            is_mobile: isMobile
        };

        const res = await api.request('/api/generate', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (res.success && res.cart) {
            navigate(`/site/${res.cart.id}`);
            setIsForking(false);
        } else {
            throw new Error(res.error || "Generation failed");
        }
    } catch (err) {
        alert("Fork failed: " + err.message);
    } finally {
        setIsForkingLoading(false);
    }
  };
  
  const handleRename = async () => {
      if (!newName.trim()) return;
      try {
          await api.request(`/api/carts/${cart.id}`, {
              method: 'PATCH',
              body: JSON.stringify({ name: newName })
          });
          setCart({ ...cart, name: newName });
          setIsEditingName(false);
      } catch (err) {
          alert("Failed to rename: " + err.message);
      }
  };
  
  const toggleListed = async () => {
    try {
        const newStatus = !cart.is_listed;
        await api.request(`/api/carts/${cart.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ is_listed: newStatus })
        });
        setCart({ ...cart, is_listed: newStatus });
    } catch (err) {
        alert("Failed to update status: " + err.message);
    }
  };
  
  const handleCopyCode = () => {
    const content = files[activeFileIndex]?.content;
    if (content) {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  const getLanguageFromFilename = (filename) => {
      if (!filename) return 'plaintext';
      const ext = filename.split('.').pop().toLowerCase();
      switch (ext) {
          case 'html': return 'html';
          case 'js': return 'javascript';
          case 'css': return 'css';
          case 'json': return 'json';
          default: return 'plaintext';
      }
  };

  const handleEditorChange = (value) => {
    const newFiles = [...files];
    newFiles[activeFileIndex].content = value;
    setFiles(newFiles);
  };

  if (loading) {
    return html`
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <${Loader2} className="animate-spin text-primary-500" size=${48} />
      </div>
    `;
  }

  if (!cart) {
    return html`
      <div className="h-screen flex flex-col items-center justify-center text-slate-400 bg-slate-950">
        <p className="text-xl mb-4">Cart data corrupted or missing.</p>
        <${Link} to="/" className="text-primary-400 hover:underline">Return to Hub<//>
      </div>
    `;
  }

  const getViewportStyle = () => {
    switch(viewport) {
      case 'mobile': return { width: '375px' };
      case 'tablet': return { width: '768px' };
      default: return { width: '100%' };
    }
  };
  
  const isOwner = user && user.id === cart.user_id;

  const getFileIcon = (name) => {
      if (name.endsWith('.html')) return html`<${Globe} size=${14} className="text-orange-400"/>`;
      if (name.endsWith('.css')) return html`<${FileType} size=${14} className="text-blue-400"/>`;
      if (name.endsWith('.js')) return html`<${FileCode} size=${14} className="text-yellow-400"/>`;
      return html`<${File} size=${14} className="text-slate-400"/>`;
  };

  return html`
    <div className=${`flex flex-col h-screen pt-16 transition-all duration-700 ${isForking ? 'blur-md brightness-50 scale-[0.98]' : ''}`} style=${{
        backgroundColor: '#2563eb',
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='30' viewBox='0 0 120 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 15 Q 30 0, 60 15 T 120 15' fill='none' stroke='white' stroke-width='1' opacity='0.4'/%3E%3C/svg%3E")`,
        backgroundSize: '120px 30px'
    }}>
      <!-- Toolbar -->
      <div className="bg-[#A05A2C] border-b-4 border-[#5C3A21] px-4 h-14 flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center space-x-4 flex-1 mr-4 overflow-hidden">
          <${Link} to="/" className="p-2 hover:bg-white/10 rounded text-white transition-all shrink-0">
            <${ArrowLeft} size=${20} />
          <//>
          
          <div className="flex items-center space-x-2 overflow-hidden w-full">
            ${isEditingName ? html`
                <div className="flex items-center space-x-1 bg-white/20 border-2 border-white/30 p-0.5 w-full max-w-sm rounded">
                    <input 
                        type="text" 
                        value=${newName}
                        onChange=${(e) => setNewName(e.target.value)}
                        className="bg-transparent border-none focus:ring-0 text-white text-sm px-2 py-1 w-full font-bold"
                        autoFocus
                    />
                    <button onClick=${handleRename} className="p-1 text-green-200 hover:bg-white/10"><${Check} size=${14} /></button>
                    <button onClick=${() => setIsEditingName(false)} className="p-1 text-red-200 hover:bg-white/10"><${X} size=${14} /></button>
                </div>
            ` : html`
                <h1 className="text-white font-bold text-sm truncate max-w-[200px] md:max-w-md uppercase tracking-wide" title=${cart.name || cart.prompt}>
                    ${cart.name || cart.prompt}
                </h1>
                ${isOwner && html`
                    <button onClick=${() => setIsEditingName(true)} className="text-white/60 hover:text-white transition-colors p-1">
                        <${Pencil} size=${12} />
                    </button>
                `}
                ${!cart.is_listed && html`
                    <span className="text-[9px] bg-black/20 text-white px-1.5 py-0.5 border border-white/30 ml-2 shrink-0 font-bold">PRIVATE</span>
                `}
            `}
          </div>
          
          <!-- Creator Info -->
          <div className="hidden lg:flex items-center ml-4 border-l border-white/20 pl-4">
            <${Link} to=${`/profile/${cart.profiles?.username || cart.username}`} className="flex items-center space-x-2 group/creator">
                <div className="w-8 h-8 rounded border border-white/30 overflow-hidden bg-[#5C3A21]">
                    ${cart.profiles?.avatar_url ? html`
                        <img src=${cart.profiles.avatar_url} className="w-full h-full object-cover" />
                    ` : html`
                        <div className="w-full h-full flex items-center justify-center text-white">
                            <${UserIcon} size=${14} />
                        </div>
                    `}
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] text-white/60 uppercase font-bold leading-none mb-1">Creator</span>
                    <span className="text-xs text-white font-bold group-hover/creator:text-blue-200 transition-colors leading-none">
                        ${cart.profiles?.username || cart.username || 'Unknown'}
                    </span>
                </div>
            <//>
          </div>
        </div>

        <div className="flex items-center space-x-0.5 bg-black/20 rounded p-0.5 border border-white/20 shrink-0 hidden md:flex">
          <button
            onClick=${() => setViewport('desktop')}
            className=${`p-1.5 rounded ${viewport === 'desktop' ? 'bg-white text-blue-600' : 'text-white/60 hover:text-white'}`}
          >
            <${Monitor} size=${16} />
          </button>
          <button
            onClick=${() => setViewport('tablet')}
            className=${`p-1.5 rounded ${viewport === 'tablet' ? 'bg-white text-blue-600' : 'text-white/60 hover:text-white'}`}
          >
            <${Tablet} size=${16} />
          </button>
          <button
            onClick=${() => setViewport('mobile')}
            className=${`p-1.5 rounded ${viewport === 'mobile' ? 'bg-white text-blue-600' : 'text-white/60 hover:text-white'}`}
          >
            <${Smartphone} size=${16} />
          </button>
        </div>
        
        <div className="flex items-center space-x-2 ml-4 shrink-0">
           ${user && html`
             <button 
                onClick=${handleRemix}
                className="flex items-center space-x-1 px-3 py-1.5 bg-white text-[#A05A2C] hover:bg-gray-100 border border-[#5C3A21] rounded text-xs font-bold transition-all uppercase shadow-sm"
             >
                <${GitFork} size=${14} />
                <span>Fork</span>
             </button>
           `}

            ${isOwner && html`
                <button
                    onClick=${toggleListed}
                    className=${`flex items-center space-x-1 px-3 py-1.5 rounded text-xs font-bold transition-all border uppercase shadow-sm ${cart.is_listed ? 'bg-white text-green-600 border-green-600 hover:bg-gray-100' : 'bg-white text-gray-600 border-gray-600 hover:bg-gray-100'}`}
                >
                    ${cart.is_listed ? html`<${Globe} size=${14} />` : html`<${Lock} size=${14} />`}
                    <span>${cart.is_listed ? 'Public' : 'Private'}</span>
                </button>
            `}

           ${user?.is_admin && html`
             <div className="flex items-center space-x-1 mx-2 border-r border-l border-white/20 px-2">
                <button 
                  onClick=${handleAdminDelete} 
                  disabled=${adminActionLoading}
                  className="p-2 text-white hover:text-red-200 transition-colors"
                >
                  <${Trash2} size=${18} />
                </button>
             </div>
           `}
           <button 
                onClick=${() => setShowCode(true)}
                className="p-2 text-white/70 hover:text-white transition-colors" 
                title="View Source"
            >
             <${Code} size=${18} />
           </button>
        </div>
      </div>

      <!-- Canvas -->
      <div className="flex-1 overflow-hidden flex justify-center items-center p-4 md:p-8">
        <div 
          className="bg-white h-full transition-all duration-500 shadow-2xl overflow-hidden border-8 border-[#5C3A21] rounded-lg relative"
          style=${getViewportStyle()}
        >
          <iframe
            srcDoc=${previewCode}
            title=${`Site ${cart.id}`}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin allow-pointer-lock"
          />
          
          <!-- Console Toggle Tab -->
          <button 
             onClick=${() => setShowConsole(!showConsole)}
             className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-[10px] font-bold uppercase tracking-widest rounded border border-white/20 hover:bg-black transition-colors z-10"
          >
             ${showConsole ? 'Hide Console' : 'Show Console'}
          </button>

          <!-- Docked Console Overlay -->
          ${showConsole && html`
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-black/95 text-green-400 font-mono text-[10px] border-t-2 border-[#5C3A21] flex flex-col z-20 animate-in slide-in-from-bottom duration-300">
                <div className="flex items-center justify-between p-1 bg-white/10 border-b border-white/10">
                    <span className="px-2 uppercase font-bold tracking-tighter opacity-70">Project Console</span>
                    <div className="flex items-center space-x-2">
                        <button onClick=${() => setLogs([])} className="hover:text-white px-2">Clear</button>
                        <button onClick=${() => setShowConsole(false)} className="hover:text-white px-2 text-xs"><${X} size=${12} /><//>
                    </div>
                </div>
                <div ref=${consoleRef} className="flex-1 overflow-y-auto p-2 space-y-1">
                    ${logs.length === 0 ? html`
                        <div className="text-white/30 italic">No logs yet...</div>
                    ` : logs.map(log => html`
                        <div key=${log.id} className=${`flex space-x-2 ${log.type === 'error' ? 'text-red-400' : log.type === 'warn' ? 'text-yellow-400' : 'text-green-400'}`}>
                            <span className="opacity-40 shrink-0">[${log.timestamp}]</span>
                            <span className="break-all">${log.content}</span>
                        </div>
                    `)}
                </div>
            </div>
          `}
        </div>
      </div>

      <!-- Code Viewer Modal -->
      ${showCode && html`
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#FFF9D2] border-4 border-[#5C3A21] rounded-none w-full max-w-6xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <!-- Modal Header -->
            <div className="flex items-center justify-between p-3 border-b-4 border-[#5C3A21] bg-[#A05A2C]">
              <div className="flex items-center space-x-2">
                 <h3 className="text-white font-bold text-sm uppercase tracking-widest">Source Inspector</h3>
              </div>
              <button 
                  onClick=${() => setShowCode(false)} 
                  className="text-white hover:text-red-200 transition-colors"
              >
                <${X} size=${20} />
              </button>
            </div>
            
            <!-- Modal Body -->
            <div className="flex flex-1 overflow-hidden">
                <!-- Sidebar -->
                <div className="w-48 md:w-64 bg-[#5C3A21]/10 border-r-4 border-[#5C3A21] flex flex-col overflow-y-auto">
                    <div className="p-0">
                        ${files.map((file, index) => html`
                            <button 
                                key=${index}
                                onClick=${() => setActiveFileIndex(index)}
                                className=${`w-full text-left px-4 py-3 text-xs border-b border-[#5C3A21]/20 flex items-center space-x-2 transition-colors ${activeFileIndex === index ? 'bg-[#5C3A21] text-white' : 'text-[#5C3A21] hover:bg-[#5C3A21]/20'}`}
                            >
                                ${getFileIcon(file.name)}
                                <span className="truncate font-bold">${file.name}</span>
                            </button>
                        `)}
                    </div>
                </div>

                <!-- Editor -->
                <div className="flex-1 overflow-hidden bg-white">
                  <${Editor}
                     height="100%"
                     theme="vs-light"
                     language=${getLanguageFromFilename(files[activeFileIndex]?.name)}
                     value=${files[activeFileIndex]?.content || ''}
                     onChange=${handleEditorChange}
                     options=${{
                         minimap: { enabled: false },
                         fontSize: 13,
                         readOnly: false,
                         fontFamily: "monospace",
                         scrollBeyondLastLine: false,
                         padding: { top: 16 }
                     }}
                  />
                </div>
            </div>
          </div>
        </div>
      `}
    </div>

    <!-- Forking Menu Overlay -->
    ${isForking && html`
        <div className="fixed inset-0 z-[150] flex flex-col justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
            <!-- Dismissal click area -->
            <div className="flex-1" onClick=${() => !isForkingLoading && setIsForking(false)}></div>
            
            <!-- The Menu -->
            <div className="w-full max-w-5xl mx-auto bg-[#FFF9D2] border-t-8 border-x-4 border-[#5C3A21] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] p-6 md:p-8 rounded-t-[40px] animate-in slide-in-from-bottom duration-500 overflow-y-auto max-h-[90vh]">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-[#A05A2C] border-2 border-[#5C3A21] rounded-2xl shadow-inner">
                            <${GitFork} size=${32} className="text-[#FFF9D2]" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-[#5C3A21] uppercase tracking-tighter leading-none mb-1">Fabricate Fork</h2>
                            <p className="text-[#5C3A21]/60 text-xs font-bold uppercase tracking-widest">Create a unique instance with modifications</p>
                        </div>
                    </div>
                    <button 
                        onClick=${() => setIsForking(false)}
                        className="p-3 hover:bg-[#5C3A21]/10 rounded-full text-[#5C3A21] transition-all"
                        disabled=${isForkingLoading}
                    >
                        <${X} size=${24} />
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <!-- LEFT COLUMN: Inputs -->
                    <div className="lg:col-span-2 space-y-6">
                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-[#5C3A21] uppercase tracking-widest ml-1">Instance Name</label>
                             <input 
                                type="text"
                                value=${forkName}
                                onChange=${(e) => setForkName(e.target.value)}
                                placeholder="THE_NEW_VERSION..."
                                className="w-full bg-white/50 border-4 border-[#5C3A21] px-4 py-3 text-lg font-bold text-[#5C3A21] placeholder-[#5C3A21]/30 focus:bg-white transition-all outline-none rounded-xl uppercase"
                                disabled=${isForkingLoading}
                             />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#5C3A21] uppercase tracking-widest ml-1">Modification Instructions (Prompt)</label>
                            <div className="relative border-4 border-[#5C3A21] bg-white/50 rounded-xl overflow-hidden">
                                <textarea
                                    value=${forkPrompt}
                                    onChange=${(e) => setForkPrompt(e.target.value)}
                                    rows=${6}
                                    className="w-full bg-transparent p-4 text-[#5C3A21] font-bold text-base outline-none resize-none leading-relaxed"
                                    placeholder="Describe changes or additions..."
                                    disabled=${isForkingLoading}
                                ></textarea>
                                <div className="absolute bottom-2 right-2 text-[9px] text-[#5C3A21]/40 font-black">
                                    REMIX_MODE: ACTIVE
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- RIGHT COLUMN: Specs & Action -->
                    <div className="space-y-6 flex flex-col">
                        <div className="border-4 border-[#5C3A21] bg-white/30 p-4 rounded-xl flex-1">
                            <h3 className="text-xs font-black text-[#5C3A21] uppercase tracking-widest mb-4 border-b-2 border-[#5C3A21] pb-2 text-center">AI Engine</h3>
                            
                            <div className="space-y-3">
                                <button
                                    onClick=${() => setForkModel(ModelType.GEMMA_3_27B)}
                                    className=${`w-full p-3 border-2 text-left transition-all relative flex items-start space-x-3 rounded-lg ${forkModel === ModelType.GEMMA_3_27B ? 'bg-[#5C3A21] border-[#5C3A21] text-[#FFF9D2]' : 'bg-white/50 border-[#5C3A21]/30 text-[#5C3A21] hover:border-[#5C3A21]'}`}
                                >
                                    <${BrainCircuit} size=${16} />
                                    <div>
                                        <div className="text-[10px] font-bold uppercase">Gemma 3 27B</div>
                                        <div className="text-[8px] opacity-70">Balanced. (1 CR)</div>
                                    </div>
                                </button>

                                <button
                                    onClick=${() => setForkModel(ModelType.GEMMA_4_31B)}
                                    className=${`w-full p-3 border-2 text-left transition-all relative flex items-start space-x-3 rounded-lg ${forkModel === ModelType.GEMMA_4_31B ? 'bg-[#5C3A21] border-[#5C3A21] text-[#FFF9D2]' : 'bg-white/50 border-[#5C3A21]/30 text-[#5C3A21] hover:border-[#5C3A21]'}`}
                                >
                                    <${Zap} size=${16} />
                                    <div>
                                        <div className="text-[10px] font-bold uppercase">Gemma 4 31B</div>
                                        <div className="text-[8px] opacity-70">Advanced. (3 CR)</div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick=${executeFork}
                                disabled=${isForkingLoading || !forkName.trim()}
                                className=${`w-full py-4 rounded-2xl text-xl font-black uppercase tracking-tighter shadow-[0_8px_0_#3d2716] active:translate-y-1 active:shadow-[0_4px_0_#3d2716] transition-all flex items-center justify-center space-x-3 ${isForkingLoading || !forkName.trim() ? 'bg-gray-400 border-gray-500 text-gray-200 cursor-not-allowed shadow-none translate-y-2' : 'bg-[#5C3A21] text-[#FFF9D2] hover:bg-[#4a2f1b] border-2 border-[#5A3A21]'}`}
                            >
                                ${isForkingLoading ? html`
                                    <${Loader2} className="animate-spin" size=${24} />
                                    <span>Building...</span>
                                ` : html`
                                    <${Sparkles} size=${24} />
                                    <span>Build Fork</span>
                                `}
                            </button>
                            <p className="text-center text-[9px] font-bold text-[#5C3A21]/40 uppercase">
                                Official Gemma API • Credits required
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `}
  `;
};

export default ViewSite;