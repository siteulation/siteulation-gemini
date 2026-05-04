import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { html, bundleProject } from '../utils.js';
import { Loader2, X, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const FullpageView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [previewCode, setPreviewCode] = useState('');
    const [showPlank, setShowPlank] = useState(false);
    const [isPlankDismissed, setIsPlankDismissed] = useState(false);

    useEffect(() => {
        const fetchCart = async () => {
            try {
                const data = await api.request(`/api/carts/${id}`);
                setCart(data);

                let parsedFiles = [];
                try {
                    const json = JSON.parse(data.code);
                    if (json.files && Array.isArray(json.files)) {
                        parsedFiles = json.files;
                    } else {
                        throw new Error("Legacy code");
                    }
                } catch (e) {
                    parsedFiles = [{ name: 'index.html', content: data.code }];
                }

                const bundled = bundleProject(parsedFiles);
                setPreviewCode(bundled);

                // Short delay before showing plank
                setTimeout(() => setShowPlank(true), 1500);
            } catch (err) {
                console.error("Fullpage fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCart();
    }, [id]);

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
                <p>Project not found.</p>
                <button onClick=${() => navigate(-1)} className="mt-4 text-blue-400">Go Back</button>
            </div>
        `;
    }

    return html`
        <div className="fixed inset-0 bg-black overflow-hidden h-screen w-screen">
            <iframe
                srcDoc=${previewCode}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin allow-pointer-lock"
            />

            <${AnimatePresence}>
                ${showPlank && !isPlankDismissed && html`
                    <${motion.div} 
                        initial=${{ x: -300, y: 100, rotate: -5 }}
                        animate=${{ x: 20, y: -20, rotate: 0 }}
                        exit=${{ x: -400, y: 200, rotate: -20 }}
                        transition=${{ type: 'spring', damping: 15, stiffness: 60 }}
                        className="fixed bottom-0 left-0 z-50 pointer-events-none"
                    >
                        <!-- Wooden Plank Container -->
                        <div className="relative pointer-events-auto h-24 w-80 bg-[#A05A2C] border-b-8 border-r-8 border-[#5C3A21] shadow-[10px_10px_20px_rgba(0,0,0,0.5)] p-4 flex items-center mt-auto"
                             style=${{
                                 backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10 Q 50 20 100 10' fill='none' stroke='%235C3A21' stroke-width='2' opacity='0.2'/%3E%3Cpath d='M0 40 Q 50 30 100 40' fill='none' stroke='%235C3A21' stroke-width='2' opacity='0.2'/%3E%3Cpath d='M0 70 Q 50 80 100 70' fill='none' stroke='%235C3A21' stroke-width='2' opacity='0.2'/%3E%3C/svg%3E")`
                             }}
                        >
                            <!-- Clickable Area to go back -->
                            <div 
                                onClick=${() => navigate(`/site/${id}`)}
                                className="flex items-center space-x-3 cursor-pointer group flex-1"
                            >
                                <div className="w-12 h-12 rounded-lg border-2 border-[#5C3A21] overflow-hidden bg-[#5C3A21] shrink-0 shadow-inner">
                                    ${cart.profiles?.avatar_url ? html`
                                        <img src=${cart.profiles.avatar_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                    ` : html`
                                        <div className="w-full h-full flex items-center justify-center text-white">
                                            <${UserIcon} size=${20} />
                                        </div>
                                    `}
                                </div>
                                <div className="flex flex-col">
                                    <img src="/playsoullogo.png" className="h-6 object-contain self-start" alt="PlaySOUL" />
                                    <span className="text-[10px] text-[#FFF9D2] font-black uppercase tracking-tighter opacity-80 mt-1">
                                        Back to HUB
                                    </span>
                                </div>
                            </div>

                            <!-- Close Button -->
                            <button 
                                onClick=${(e) => { e.stopPropagation(); setIsPlankDismissed(true); }}
                                className="absolute -top-3 -right-3 w-8 h-8 bg-red-600 border-4 border-[#5C3A21] text-white flex items-center justify-center hover:bg-red-500 transition-colors shadow-lg"
                                title="Dismiss Overlay"
                            >
                                <${X} size=${16} strokeWidth=${4} />
                            </button>

                            <!-- Wooden Texture Detail -->
                            <div className="absolute top-2 left-2 w-1 h-1 bg-[#5C3A21] rounded-full opacity-40"></div>
                            <div className="absolute bottom-2 right-4 w-1 h-1 bg-[#5C3A21] rounded-full opacity-40"></div>
                        </div>
                    </${motion.div}>
                `}
            <//>
        </div>
    `;
};

export default FullpageView;
