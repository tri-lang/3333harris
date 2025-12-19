
import React, { useEffect, useState } from 'react';
import { 
  Home, Wand2, Shirt, LayoutTemplate, Palette, 
  Edit3, Crop, Scissors, Grid, History, Zap, User, LogOut, Shield,
  Image, Box, Circle, Square, Star, Heart, Bookmark, Settings, MessageSquare
} from 'lucide-react';
import { UserProfile, MenuConfig, SiteSettings } from '../types';
import { getMenuConfigs, getSiteSettings } from '../services/comfyService';

interface SidebarProps {
  activeItem?: string;
  onNavigate: (item: string) => void;
  user: UserProfile | null;
  onLoginClick: () => void;
  onLogout: () => void;
}

const IconMap: Record<string, any> = {
  Home, Wand2, Shirt, LayoutTemplate, Palette, 
  Edit3, Crop, Scissors, Grid, History, 
  Image, Box, Circle, Square, Star, Heart, Bookmark, Settings, MessageSquare
};

export const Sidebar: React.FC<SidebarProps> = ({ activeItem, onNavigate, user, onLoginClick, onLogout }) => {
  const [menuItems, setMenuItems] = useState<MenuConfig[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({ title: '灵鹊AI', englishTitle: 'Pro Studio', logoUrl: '', departments: [] });

  useEffect(() => {
    const loadConfig = () => {
      setMenuItems(getMenuConfigs());
      setSiteSettings(getSiteSettings());
    };
    loadConfig();
    const interval = setInterval(loadConfig, 2000); 
    return () => clearInterval(interval);
  }, []);

  const isAdminAccess = user?.role === 'super_admin' || user?.role === 'admin';

  return (
    <div className="w-64 h-screen bg-black/30 backdrop-blur-2xl border-r border-white/5 flex flex-col shrink-0 shadow-2xl relative z-50">
      <div className="h-20 flex items-center gap-3 px-6 border-b border-white/5 cursor-pointer" onClick={() => onNavigate('home')}>
        {siteSettings.logoUrl ? (
          <img src={siteSettings.logoUrl} alt="Logo" className="w-9 h-9 rounded-xl object-cover shadow-lg shadow-indigo-500/20" />
        ) : (
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30"><Zap className="w-6 h-6 text-white fill-current" /></div>
        )}
        <div className="flex flex-col">
          <span className="font-bold text-white tracking-tight text-lg leading-tight truncate max-w-[140px]">{siteSettings.title}</span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em] opacity-80">{siteSettings.englishTitle || 'Pro Studio'}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 space-y-1 custom-scrollbar">
        {menuItems.filter(item => item.isEnabled).map((item) => {
          const IconComponent = IconMap[item.icon] || Grid;
          const isActive = activeItem === item.id;
          return (
            <div key={item.id} onClick={() => onNavigate(item.id)} className={`group flex items-center justify-between mx-3 px-4 py-3 cursor-pointer transition-all rounded-xl ${isActive ? 'bg-indigo-500/20 text-white shadow-lg shadow-indigo-500/5' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
              <div className="flex items-center gap-3">
                <IconComponent className={`w-5 h-5 transition-all duration-300 ${isActive ? 'text-indigo-400 scale-110' : 'group-hover:text-indigo-400'}`} />
                <span className={`text-sm font-semibold tracking-wide ${isActive ? 'translate-x-1' : ''} transition-transform`}>{item.label}</span>
              </div>
              {isActive && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-glow"></div>}
            </div>
          );
        })}
        {isAdminAccess && (
           <div onClick={() => onNavigate('admin')} className={`mt-8 group flex items-center justify-between mx-3 px-4 py-3 cursor-pointer transition-all rounded-xl ${activeItem === 'admin' ? 'bg-red-500/20 text-red-400 shadow-lg shadow-red-500/5' : 'text-slate-500 hover:text-red-400 hover:bg-red-500/5'}`}><div className="flex items-center gap-3"><Shield className="w-5 h-5" /><span className="text-sm font-bold">后台管理</span></div></div>
        )}
      </div>

      <div className="p-4 bg-black/20 border-t border-white/5">
        <div 
          onClick={() => user && onNavigate('profile')}
          className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-white/5 cursor-pointer transition-all group border border-transparent hover:border-white/5"
        >
          <div className="w-10 h-10 rounded-full bg-slate-800/80 border border-white/10 flex items-center justify-center overflow-hidden group-hover:border-indigo-500/40 transition-all shadow-inner">
            {user?.avatarUrl ? (
               <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
               <User className="w-6 h-6 text-slate-500" />
            )}
          </div>
          <div className="flex flex-col overflow-hidden">
            {user ? (
               <>
                 <span className="text-sm font-bold text-white truncate">{user.nickname || user.phone.slice(-4)}</span>
                 <div className="flex flex-col">
                   {user.department && <span className="text-[10px] text-slate-500 truncate uppercase font-bold tracking-widest">{user.department}</span>}
                 </div>
               </>
            ) : (<span className="text-sm font-bold text-white/80 uppercase tracking-widest text-[10px]">GUEST</span>)}
          </div>
        </div>
        {user ? (
          <button onClick={onLogout} className="w-full mt-3 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400/80 text-[11px] font-bold rounded-xl transition-all border border-red-500/10 flex items-center justify-center gap-2"><LogOut className="w-3 h-3" /> 退出登录</button>
        ) : (
          <button onClick={onLoginClick} className="w-full mt-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30 ring-1 ring-white/10">登录体验</button>
        )}
      </div>
      <style>{`.shadow-glow { box-shadow: 0 0 10px rgba(99, 102, 241, 0.6); }`}</style>
    </div>
  );
};
