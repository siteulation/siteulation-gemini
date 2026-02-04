import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { ArrowLeft, Loader2, Monitor, Smartphone, Tablet, ExternalLink, Code, Trash2, ShieldAlert, GitFork, Pencil, Check, X, Copy, Globe, Lock, FileCode, FileType, File } from 'lucide-react';
import { html, bundleProject } from '../utils.js';
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
        
        // Generate Bundled Preview
        const bundled = bundleProject(parsedFiles);
        setPreviewCode(bundled);
        
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
      navigate('/create', { 
          state: { 
              remixCode: cart.code,
              originalName: cart.name || cart.prompt,
              isListed: cart.is_listed
          }
      });
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
    <div className="flex flex-col h-screen bg-[#050505] pt-16">
      <!-- Toolbar -->
      <div className="bg-[#111] border-b border-white/10 px-4 h-14 flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center space-x-4 flex-1 mr-4 overflow-hidden">
          <${Link} to="/" className="p-2 hover:bg-white/5 rounded-none border border-transparent hover:border-slate-700 text-slate-400 hover:text-white transition-all shrink-0">
            <${ArrowLeft} size=${20} />
          <//>
          
          <div className="flex items-center space-x-2 overflow-hidden w-full">
            ${isEditingName ? html`
                <div className="flex items-center space-x-1 bg-slate-900 border border-slate-700 p-0.5 w-full max-w-sm">
                    <input 
                        type="text" 
                        value=${newName}
                        onChange=${(e) => setNewName(e.target.value)}
                        className="bg-transparent border-none focus:ring-0 text-white text-sm px-2 py-1 w-full font-mono"
                        autoFocus
                    />
                    <button onClick=${handleRename} className="p-1 text-green-400 hover:bg-white/10"><${Check} size=${14} /></button>
                    <button onClick=${() => setIsEditingName(false)} className="p-1 text-red-400 hover:bg-white/10"><${X} size=${14} /></button>
                </div>
            ` : html`
                <h1 className="text-slate-200 font-bold text-sm truncate max-w-[200px] md:max-w-md font-mono uppercase tracking-wide" title=${cart.name || cart.prompt}>
                    ${cart.name || cart.prompt}
                </h1>
                ${isOwner && html`
                    <button onClick=${() => setIsEditingName(true)} className="text-slate-600 hover:text-white transition-colors p-1">
                        <${Pencil} size=${12} />
                    </button>
                `}
                ${!cart.is_listed && html`
                    <span className="text-[9px] bg-red-900/20 text-red-400 px-1.5 py-0.5 border border-red-900 ml-2 shrink-0">PRIVATE</span>
                `}
            `}
          </div>
        </div>

        <div className="flex items-center space-x-0.5 bg-black rounded p-0.5 border border-slate-800 shrink-0 hidden md:flex">
          <button
            onClick=${() => setViewport('desktop')}
            className=${`p-1.5 ${viewport === 'desktop' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:text-slate-400'}`}
          >
            <${Monitor} size=${16} />
          </button>
          <button
            onClick=${() => setViewport('tablet')}
            className=${`p-1.5 ${viewport === 'tablet' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:text-slate-400'}`}
          >
            <${Tablet} size=${16} />
          </button>
          <button
            onClick=${() => setViewport('mobile')}
            className=${`p-1.5 ${viewport === 'mobile' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:text-slate-400'}`}
          >
            <${Smartphone} size=${16} />
          </button>
        </div>
        
        <div className="flex items-center space-x-2 ml-4 shrink-0">
           ${user && html`
             <button 
                onClick=${handleRemix}
                className="flex items-center space-x-1 px-3 py-1.5 bg-purple-900/20 text-purple-400 hover:bg-purple-900/40 border border-purple-800 rounded-sm text-xs font-bold transition-all uppercase"
             >
                <${GitFork} size=${14} />
                <span>Fork</span>
             </button>
           `}

            ${isOwner && html`
                <button
                    onClick=${toggleListed}
                    className=${`flex items-center space-x-1 px-3 py-1.5 rounded-sm text-xs font-bold transition-all border uppercase ${cart.is_listed ? 'bg-green-900/20 text-green-400 border-green-800 hover:bg-green-900/30' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
                >
                    ${cart.is_listed ? html`<${Globe} size=${14} />` : html`<${Lock} size=${14} />`}
                    <span>${cart.is_listed ? 'Public' : 'Private'}</span>
                </button>
            `}

           ${user?.is_admin && html`
             <div className="flex items-center space-x-1 mx-2 border-r border-l border-white/10 px-2">
                <button 
                  onClick=${handleAdminDelete} 
                  disabled=${adminActionLoading}
                  className="p-2 text-red-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                >
                  <${Trash2} size=${18} />
                </button>
             </div>
           `}
           <button 
                onClick=${() => setShowCode(true)}
                className="p-2 text-slate-500 hover:text-white transition-colors" 
                title="View Source"
            >
             <${Code} size=${18} />
           </button>
        </div>
      </div>

      <!-- Canvas -->
      <div className="flex-1 overflow-hidden bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-[#080808] flex justify-center items-center p-4 md:p-8">
        <div 
          className="bg-white h-full transition-all duration-500 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden border-4 border-[#222] relative"
          style=${getViewportStyle()}
        >
          <iframe
            srcDoc=${previewCode}
            title=${`Site ${cart.id}`}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin allow-pointer-lock"
          />
        </div>
      </div>

      <!-- Code Viewer Modal -->
      ${showCode && html`
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#111] border border-slate-800 rounded-none w-full max-w-6xl h-[85vh] flex flex-col shadow-2xl overflow-hidden font-mono">
            <!-- Modal Header -->
            <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-[#151515]">
              <div className="flex items-center space-x-2">
                 <div className="w-3 h-3 bg-slate-500 rounded-full"></div>
                 <h3 className="text-slate-300 font-bold text-xs uppercase tracking-widest">Source_Inspector</h3>
              </div>
              <button 
                  onClick=${() => setShowCode(false)} 
                  className="text-slate-500 hover:text-white transition-colors"
              >
                <${X} size=${20} />
              </button>
            </div>
            
            <!-- Modal Body -->
            <div className="flex flex-1 overflow-hidden">
                <!-- Sidebar -->
                <div className="w-48 md:w-64 bg-[#0a0a0a] border-r border-slate-800 flex flex-col overflow-y-auto">
                    <div className="p-0">
                        ${files.map((file, index) => html`
                            <button 
                                key=${index}
                                onClick=${() => setActiveFileIndex(index)}
                                className=${`w-full text-left px-4 py-3 text-xs border-b border-slate-800/50 flex items-center space-x-2 transition-colors ${activeFileIndex === index ? 'bg-slate-800 text-white border-l-4 border-l-primary-500' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'}`}
                            >
                                ${getFileIcon(file.name)}
                                <span className="truncate">${file.name}</span>
                            </button>
                        `)}
                    </div>
                </div>

                <!-- Editor -->
                <div className="flex-1 overflow-hidden bg-[#1e1e1e]">
                  <${Editor}
                     height="100%"
                     theme="vs-dark"
                     language=${getLanguageFromFilename(files[activeFileIndex]?.name)}
                     value=${files[activeFileIndex]?.content || ''}
                     onChange=${handleEditorChange}
                     options=${{
                         minimap: { enabled: false },
                         fontSize: 13,
                         readOnly: false,
                         fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
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
  `;
};

export default ViewSite;