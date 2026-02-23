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
    <div className="flex flex-col h-screen pt-16" style=${{
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
                            <${User} size=${14} />
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
  `;
};

export default ViewSite;