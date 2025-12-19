
import React, { useState, useEffect } from 'react';
import { User, Lock, Save, Camera, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';

interface ProfilePageProps {
  user: UserProfile | null;
  onUpdateUser: (updatedUser: UserProfile) => void;
}

const PREDEFINED_AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aiden",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Sasha",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Jack",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Willow",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Milo",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Robot1",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Robot2",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Robot3",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Robot4",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Robot5",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=P1",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=P2",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=P3",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=P4",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=P5"
];

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUpdateUser }) => {
  const [formData, setFormData] = useState({
    nickname: '',
    avatarUrl: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        nickname: user.nickname || '',
        avatarUrl: user.avatarUrl || PREDEFINED_AVATARS[0]
      }));
    }
  }, [user]);

  const handleSave = () => {
    if (!user) return;
    setStatus(null);

    const users = JSON.parse(localStorage.getItem('smartpic_users') || '[]');
    const userIdx = users.findIndex((u: any) => u.phone === user.phone);
    
    if (userIdx === -1 && user.phone !== 'admin') {
      setStatus({ type: 'error', msg: '用户数据同步异常' });
      return;
    }

    // Password logic
    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        setStatus({ type: 'error', msg: '新密码两次输入不一致' });
        return;
      }
      if (userIdx !== -1) users[userIdx].password = formData.newPassword;
    }

    // Info logic
    if (userIdx !== -1) {
      users[userIdx].nickname = formData.nickname;
      users[userIdx].avatarUrl = formData.avatarUrl;
      localStorage.setItem('smartpic_users', JSON.stringify(users));
    }
    
    const updated = { ...user, nickname: formData.nickname, avatarUrl: formData.avatarUrl };
    onUpdateUser(updated);
    setStatus({ type: 'success', msg: '设置已更新' });
    
    setFormData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
  };

  if (!user) return null;

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-transparent animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">个人中心</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Identity & Visual Persona</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Avatar Selector Column */}
          <div className="lg:col-span-7 bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
             <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-widest">选择个性化头像</h3>
             </div>
             <div className="grid grid-cols-5 gap-4">
                {PREDEFINED_AVATARS.map((url, idx) => (
                  <div 
                    key={idx}
                    onClick={() => setFormData({...formData, avatarUrl: url})}
                    className={`aspect-square rounded-2xl cursor-pointer border-2 transition-all p-1 hover:scale-105 active:scale-95 ${formData.avatarUrl === url ? 'border-indigo-500 bg-indigo-500/20' : 'border-transparent bg-white/5 hover:bg-white/10'}`}
                  >
                    <img src={url} alt={`Avatar ${idx}`} className="w-full h-full object-cover rounded-xl" />
                  </div>
                ))}
             </div>
          </div>

          {/* Info Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 space-y-8 shadow-2xl">
              <div className="flex flex-col items-center pb-6 border-b border-white/5">
                <div className="w-24 h-24 rounded-full bg-slate-800 border-4 border-indigo-500/50 p-1 shadow-2xl mb-4">
                   <img src={formData.avatarUrl} alt="Preview" className="w-full h-full object-cover rounded-full" />
                </div>
                <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">预览效果</span>
              </div>

              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">修改昵称</label>
                    <input 
                      type="text" 
                      value={formData.nickname} 
                      onChange={e => setFormData({...formData, nickname: e.target.value})}
                      className="w-full bg-[#0f1115]/50 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:border-indigo-500/50 outline-none transition-all font-bold"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">新密码</label>
                    <input 
                      type="password" 
                      value={formData.newPassword}
                      onChange={e => setFormData({...formData, newPassword: e.target.value})}
                      placeholder="不修改请留空"
                      className="w-full bg-[#0f1115]/50 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:border-indigo-500/50 outline-none transition-all"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">确认新密码</label>
                    <input 
                      type="password" 
                      value={formData.confirmPassword}
                      onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                      placeholder="再次确认"
                      className="w-full bg-[#0f1115]/50 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:border-indigo-500/50 outline-none transition-all"
                    />
                 </div>
              </div>

              {status && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-bold animate-in slide-in-from-top-2 ${status.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {status.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {status.msg}
                </div>
              )}

              <button 
                onClick={handleSave}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/30 active:scale-[0.98] transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3"
              >
                <Save className="w-5 h-5" /> 保存更新
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
