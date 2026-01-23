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
      // Navigate to create page with current code in state
      navigate('/create', { 
          state: { 
              remixCode: cart.code, // Pass the raw DB code (JSON or string)
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
    // Optional: Allow editing in memory
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
    <div className="flex flex-col h-screen bg-slate-950 pt-16">
      <!-- Toolbar -->
      <div className="bg-slate-900 border-b border-white/5 px-4 h-14 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-4 flex-1 mr-4 overflow-hidden">
          <${Link} to="/" className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors shrink-0">
            <${ArrowLeft} size=${20} />
          <//>
          
          <div className="flex items-center space-x-2 overflow-hidden w-full">
            ${isEditingName ? html`
                <div className="flex items-center space-x-1 bg-slate-800 rounded p-0.5 w-full max-w-sm">
                    <input 
                        type="text" 
                        value=${newName}
                        onChange=${(e) => setNewName(e.target.value)}
                        className="bg-transparent border-none focus:ring-0 text-white text-sm px-2 py-1 w-full"
                        autoFocus
                    />
                    <button onClick=${handleRename} className="p-1 text-green-400 hover:bg-white/10 rounded"><${Check} size=${14} /></button>
                    <button onClick=${() => setIsEditingName(false)} className="p-1 text-red-400 hover:bg-white/10 rounded"><${X} size=${14} /></button>
                </div>
            ` : html`
                <h1 className="text-white font-bold text-sm truncate max-w-[200px] md:max-w-md" title=${cart.name || cart.prompt}>
                    ${cart.name || cart.prompt}
                </h1>
                ${isOwner && html`
                    <button onClick=${() => setIsEditingName(true)} className="text-slate-500 hover:text-primary-400 transition-colors p-1">
                        <${Pencil} size=${12} />
                    </button>
                `}
                ${!cart.is_listed && html`
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded ml-2 shrink-0 border border-slate-700">UNLISTED</span>
                `}
                ${cart.username === 'homelessman' && html`
                  <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider ml-1 shrink-0">ADMIN CREATION</span>
                `}
            `}
          </div>
        </div>

        <div className="flex items-center space-x-1 bg-slate-800/50 rounded-lg p-1 border border-white/5 shrink-0 hidden md:flex">
          <button
            onClick=${() => setViewport('desktop')}
            className=${`p-1.5 rounded ${viewport === 'desktop' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <${Monitor} size=${16} />
          </button>
          <button
            onClick=${() => setViewport('tablet')}
            className=${`p-1.5 rounded ${viewport === 'tablet' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <${Tablet} size=${16} />
          </button>
          <button
            onClick=${() => setViewport('mobile')}
            className=${`p-1.5 rounded ${viewport === 'mobile' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <${Smartphone} size=${16} />
          </button>
        </div>
        
        <div className="flex items-center space-x-2 ml-4 shrink-0">
           ${user && html`
             <button 
                onClick=${handleRemix}
                className="flex items-center space-x-1 px-3 py-1.5 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg text-xs font-bold transition-all"
             >
                <${GitFork} size=${14} />
                <span>Remix</span>
             </button>
           `}

            ${isOwner && html`
                <button
                    onClick=${toggleListed}
                    className=${`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${cart.is_listed ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
                    title=${cart.is_listed ? "Listed on public feed" : "Hidden from public feed"}
                >
                    ${cart.is_listed ? html`<${Globe} size=${14} />` : html`<${Lock} size=${14} />`}
                    <span>${cart.is_listed ? 'Listed' : 'Release'}</span>
                </button>
            `}

           ${user?.is_admin && html`
             <div className="flex items-center space-x-1 mx-2 border-r border-l border-white/10 px-2">
                <button 
                  onClick=${handleAdminDelete} 
                  disabled=${adminActionLoading}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                  title="Delete Cart"
                >
                  <${Trash2} size=${18} />
                </button>
                <button 
                  onClick=${handleAdminBan}
                  disabled=${adminActionLoading} 
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                  title="Ban User"
                >
                  <${ShieldAlert} size=${18} />
                </button>
             </div>
           `}
           <button 
                onClick=${() => setShowCode(true)}
                className="p-2 text-slate-400 hover:text-white transition-colors" 
                title="View Source"
            >
             <${Code} size=${18} />
           </button>
        </div>
      </div>

      <!-- Canvas -->
      <div className="flex-1 overflow-hidden bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-slate-925 flex justify-center items-center p-4 md:p-8">
        <div 
          className="bg-white h-full transition-all duration-500 shadow-2xl overflow-hidden rounded-lg ring-1 ring-white/10 relative"
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-5xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <!-- Modal Header -->
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-slate-800/50">
              <div className="flex items-center space-x-2">
                 <${Code} size=${16} className="text-primary-400"/>
                 <h3 className="text-white font-bold font-mono text-sm">Source Code</h3>
                 <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">${files.length} Files</span>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick=${handleCopyCode}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-primary-500/10 text-primary-300 hover:bg-primary-500/20 rounded-lg text-xs font-bold transition-colors"
                >
                  ${copied ? html`<${Check} size=${14} />` : html`<${Copy} size=${14} />`}
                  <span>${copied ? 'Copied' : 'Copy'}</span>
                </button>
                <div className="w-px h-6 bg-white/10 mx-1"></div>
                <button 
                    onClick=${() => setShowCode(false)} 
                    className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  <${X} size=${20} />
                </button>
              </div>
            </div>
            
            <!-- Modal Body: File Explorer Layout -->
            <div className="flex flex-1 overflow-hidden">
                <!-- Sidebar -->
                <div className="w-48 md:w-64 bg-slate-950 border-r border-white/5 flex flex-col overflow-y-auto">
                    <div className="p-2 space-y-1">
                        ${files.map((file, index) => html`
                            <button 
                                key=${index}
                                onClick=${() => setActiveFileIndex(index)}
                                className=${`w-full text-left px-3 py-2 rounded-lg text-sm font-mono flex items-center space-x-2 transition-colors ${activeFileIndex === index ? 'bg-primary-500/10 text-primary-300 border border-primary-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                            >
                                ${getFileIcon(file.name)}
                                <span className="truncate">${file.name}</span>
                            </button>
                        `)}
                    </div>
                </div>

                <!-- Code Editor View (Monaco) -->
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
                         readOnly: false, // Allow local editing for experimentation
                         fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
                         scrollBeyondLastLine: false,
                         padding: { top: 16 }
                     }}
                     loading=${html`
                         <div className="flex items-center justify-center h-full text-slate-400 space-x-2">
                             <${Loader2} className="animate-spin" size=${20} />
                             <span>Initializing Editor...</span>
                         </div>
                     `}
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