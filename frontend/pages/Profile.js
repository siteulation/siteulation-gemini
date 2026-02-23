import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { SiteCard } from '../components/SiteCard.js';
import { html } from '../utils.js';
import { Loader2, User, Camera, Save, ArrowLeft, Globe, Calendar, LayoutGrid, Settings, LogOut } from 'lucide-react';

const Profile = ({ currentUser, setUser }) => {
    const { username } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Edit Profile State
    const [isEditing, setIsEditing] = useState(false);
    const [editUsername, setEditUsername] = useState('');
    const [editAvatarUrl, setEditAvatarUrl] = useState('');
    const [updating, setUpdating] = useState(false);

    const isOwnProfile = currentUser && currentUser.username === username;

    const fetchProfileData = async () => {
        setLoading(true);
        try {
            const data = await api.profile.get(username);
            setProfile(data.profile);
            setProjects(data.projects);
            setEditUsername(data.profile.username);
            setEditAvatarUrl(data.profile.avatar_url || '');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfileData();
    }, [username]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            await api.profile.update({
                username: editUsername,
                avatar_url: editAvatarUrl
            });
            
            // If username changed, we need to navigate to the new profile URL
            if (editUsername !== username) {
                // Update local user state too
                const updatedUser = await api.auth.getUser();
                setUser(updatedUser);
                navigate(`/profile/${editUsername}`);
            } else {
                // Just refresh data
                await fetchProfileData();
                setIsEditing(false);
            }
        } catch (err) {
            alert(err.message);
        } finally {
            setUpdating(false);
        }
    };

    const handleLogout = () => {
        api.auth.signOut();
        setUser(null);
        navigate('/auth');
    };

    if (loading) {
        return html`
            <div className="min-h-screen pt-24 flex items-center justify-center bg-[#2563eb]">
                <${Loader2} className="animate-spin text-white" size=${48} />
            </div>
        `;
    }

    if (error) {
        return html`
            <div className="min-h-screen pt-24 flex flex-col items-center justify-center bg-[#2563eb] text-white px-4">
                <div className="bg-white/10 backdrop-blur-md p-8 rounded-lg border-2 border-white/20 text-center max-w-md">
                    <h2 className="text-2xl font-bold mb-4 uppercase tracking-widest">Profile Not Found</h2>
                    <p className="mb-6 opacity-80 font-medium">${error}</p>
                    <${Link} to="/" className="inline-flex items-center space-x-2 bg-white text-blue-600 px-6 py-2 rounded font-bold uppercase tracking-wider hover:bg-blue-50 transition-colors">
                        <${ArrowLeft} size=${16} />
                        <span>Back to Map</span>
                    <//>
                </div>
            </div>
        `;
    }

    return html`
        <div className="min-h-screen pt-24 pb-20 overflow-x-hidden" style=${{
            backgroundColor: '#2563eb',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='30' viewBox='0 0 120 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 15 Q 30 0, 60 15 T 120 15' fill='none' stroke='white' stroke-width='1' opacity='0.4'/%3E%3C/svg%3E")`,
            backgroundSize: '120px 30px'
        }}>
            <div className="container mx-auto px-4 relative z-10">
                
                <!-- Profile Header Card -->
                <div className="max-w-4xl mx-auto mb-12">
                    <div className="bg-[#FFF9D2] border-4 border-[#5C3A21] shadow-2xl relative p-6 md:p-10 transform -rotate-1">
                        
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                            <!-- Avatar Section -->
                            <div className="relative group">
                                <div className="w-32 h-32 md:w-40 md:h-40 bg-[#A05A2C] border-4 border-[#5C3A21] rounded-lg overflow-hidden shadow-lg relative">
                                    ${profile.avatar_url ? html`
                                        <img src=${profile.avatar_url} alt=${profile.username} className="w-full h-full object-cover" />
                                    ` : html`
                                        <div className="w-full h-full flex items-center justify-center text-[#FFF9D2]">
                                            <${User} size=${64} />
                                        </div>
                                    `}
                                    
                                    ${isOwnProfile && html`
                                        <button 
                                            onClick=${() => setIsEditing(true)}
                                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                                        >
                                            <${Camera} size=${24} />
                                        </button>
                                    `}
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-[#5C3A21] text-[#FFF9D2] p-1.5 rounded-full border-2 border-[#FFF9D2] shadow-md">
                                    <${Globe} size=${14} />
                                </div>
                            </div>

                            <!-- Info Section -->
                            <div className="flex-1 text-center md:text-left">
                                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                                    <h1 className="text-3xl md:text-4xl font-black text-[#5C3A21] uppercase tracking-tight">
                                        ${profile.username}
                                    </h1>
                                    
                                    ${isOwnProfile && html`
                                        <div className="flex items-center justify-center md:justify-start gap-2">
                                            <button 
                                                onClick=${() => setIsEditing(!isEditing)}
                                                className="bg-[#A05A2C] text-[#FFF9D2] px-3 py-1 rounded text-xs font-bold uppercase tracking-wider hover:bg-[#5C3A21] transition-colors flex items-center space-x-1"
                                            >
                                                <${Settings} size=${12} />
                                                <span>${isEditing ? 'Cancel' : 'Edit Profile'}</span>
                                            </button>
                                            <button 
                                                onClick=${handleLogout}
                                                className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-wider hover:bg-red-700 transition-colors flex items-center space-x-1"
                                            >
                                                <${LogOut} size=${12} />
                                                <span>Logout</span>
                                            </button>
                                        </div>
                                    `}
                                </div>

                                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-[#5C3A21]/70 font-bold text-sm uppercase tracking-wider">
                                    <div className="flex items-center space-x-1">
                                        <${LayoutGrid} size=${14} />
                                        <span>${projects.length} Projects</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <${Calendar} size=${14} />
                                        <span>Joined ${new Date(profile.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                ${isEditing && html`
                                    <form onSubmit=${handleUpdateProfile} className="mt-8 bg-white/30 border-2 border-[#5C3A21]/20 p-4 rounded space-y-4 animate-in slide-in-from-top-2 duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-[#5C3A21] uppercase tracking-widest mb-1">New Username</label>
                                                <input 
                                                    type="text"
                                                    value=${editUsername}
                                                    onChange=${(e) => setEditUsername(e.target.value)}
                                                    className="w-full bg-white/50 border-2 border-[#5C3A21] rounded px-3 py-2 text-sm text-[#5C3A21] outline-none focus:bg-white"
                                                    placeholder="Username"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-[#5C3A21] uppercase tracking-widest mb-1">Avatar URL</label>
                                                <input 
                                                    type="url"
                                                    value=${editAvatarUrl}
                                                    onChange=${(e) => setEditAvatarUrl(e.target.value)}
                                                    className="w-full bg-white/50 border-2 border-[#5C3A21] rounded px-3 py-2 text-sm text-[#5C3A21] outline-none focus:bg-white"
                                                    placeholder="https://..."
                                                />
                                            </div>
                                        </div>
                                        <button 
                                            type="submit"
                                            disabled=${updating}
                                            className="bg-[#5C3A21] text-[#FFF9D2] px-6 py-2 rounded font-bold uppercase tracking-widest hover:bg-[#4A2F1B] transition-all disabled:opacity-50 flex items-center space-x-2"
                                        >
                                            ${updating ? html`<${Loader2} size=${14} className="animate-spin" />` : html`<${Save} size=${14} />`}
                                            <span>Save Changes</span>
                                        </button>
                                    </form>
                                `}
                            </div>
                        </div>

                        <!-- Blueprint Accents -->
                        <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
                            <${LayoutGrid} size=${120} />
                        </div>
                    </div>
                </div>

                <!-- Projects Section -->
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-12 border-b-4 border-white/20 pb-4">
                        <h2 className="text-2xl font-black text-white uppercase tracking-widest flex items-center space-x-3">
                            <${LayoutGrid} />
                            <span>${isOwnProfile ? 'My Collection' : `${profile.username}'s Collection`}</span>
                        </h2>
                    </div>

                    ${projects.length === 0 ? html`
                        <div className="text-center py-20 bg-white/5 backdrop-blur-sm rounded-xl border-2 border-dashed border-white/20">
                            <p className="text-white font-bold text-xl uppercase tracking-widest opacity-50">No Projects Found</p>
                        </div>
                    ` : html`
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
                            ${projects.map((cart) => html`
                                <div className="relative group perspective-[1000px]">
                                    <div className="absolute -bottom-8 left-0 right-0 h-4 bg-black/20 blur-md rounded-[100%] group-hover:scale-90 transition-transform duration-300"></div>
                                    <${SiteCard} key=${cart.id} cart=${cart} currentUser=${currentUser} onDelete=${fetchProfileData} />
                                    <div className="absolute -bottom-10 left-[-20px] right-[-20px] h-3 bg-[#A05A2C] border-t-2 border-[#C07A4C] rounded-sm -z-10 shadow-lg"></div>
                                </div>
                            `)}
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;
};

export default Profile;
