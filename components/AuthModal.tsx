
import React, { useState, useEffect, useRef } from 'react';
import { X, Smartphone, Lock, ShieldCheck, Eye, EyeOff, UserPlus, LogIn, User, ShieldAlert, Building2 } from 'lucide-react';
import { UserProfile, SiteSettings } from '../types';
import { getSiteSettings } from '../services/comfyService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    confirmPassword: '',
    captcha: '',
    department: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [captchaCode, setCaptchaCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setSiteSettings(getSiteSettings());
  }, []);

  const generateCaptcha = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    setCaptchaCode(code);
    drawCaptcha(code);
  };

  const drawCaptcha = (code: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#2a2d35';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 24px monospace';
    ctx.textBaseline = 'middle';
    const colors = ['#818cf8', '#34d399', '#f472b6', '#fbbf24'];
    for (let i = 0; i < code.length; i++) {
      ctx.save();
      ctx.translate(20 + i * 25, canvas.height / 2);
      ctx.rotate((Math.random() - 0.5) * 0.4);
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillText(code[i], 0, 0);
      ctx.restore();
    }
  };

  useEffect(() => {
    if (isOpen) {
      generateCaptcha();
      setFormData({ phone: '', password: '', confirmPassword: '', captcha: '', department: '' });
      setError(null);
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    setError(null);

    // Super Admin Logic: Prefer localStorage user if exists (to allow password changes)
    // Fallback to hardcoded 'admin'/'admin' if not found in storage.
    if (activeTab === 'login' && formData.phone === 'admin') {
      const users = JSON.parse(localStorage.getItem('smartpic_users') || '[]');
      const storedAdmin = users.find((u: any) => u.phone === 'admin');

      if (storedAdmin) {
        if (storedAdmin.password === formData.password) {
          onLoginSuccess(storedAdmin);
          onClose();
          return;
        } else {
          setError("密码错误");
          generateCaptcha();
          return;
        }
      } else {
        // Fallback for bootstrap
        if (formData.password === 'admin') {
          onLoginSuccess({ 
            phone: 'admin', 
            nickname: '超级管理员',
            role: 'super_admin' 
          });
          onClose();
          return;
        }
      }
    }

    if (!formData.phone || !formData.password || !formData.captcha || (activeTab === 'register' && !formData.department)) {
      setError("请填写所有字段并选择部门");
      return;
    }
    if (formData.captcha.toUpperCase() !== captchaCode) {
      setError("验证码错误");
      generateCaptcha();
      return;
    }

    if (activeTab === 'register') {
      if (formData.password !== formData.confirmPassword) {
        setError("两次输入的密码不一致");
        return;
      }
      const users = JSON.parse(localStorage.getItem('smartpic_users') || '[]');
      if (users.find((u: any) => u.phone === formData.phone)) {
        setError("该手机号已注册");
        return;
      }
      const newUser = { 
        phone: formData.phone, 
        password: formData.password, 
        department: formData.department,
        role: 'user' // Default role for new users
      };
      users.push(newUser);
      localStorage.setItem('smartpic_users', JSON.stringify(users));
      alert("注册成功！请登录");
      setActiveTab('login');
      generateCaptcha();
    } else {
      const users = JSON.parse(localStorage.getItem('smartpic_users') || '[]');
      const user = users.find((u: any) => u.phone === formData.phone && u.password === formData.password);
      if (user) {
        onLoginSuccess({ 
          phone: user.phone, 
          department: user.department, 
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
          role: user.role || 'user' 
        });
        onClose();
      } else {
        setError("手机号或密码错误");
        generateCaptcha();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#181820]/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors z-10"><X className="w-5 h-5" /></button>
        <div className="p-10">
          <h2 className="text-3xl font-black text-white mb-8 tracking-tight">{activeTab === 'login' ? '欢迎回来' : '开启创作'}</h2>
          <div className="bg-[#0f1115]/50 p-1 rounded-2xl flex mb-8">
            <button onClick={() => setActiveTab('login')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'login' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}>登录</button>
            <button onClick={() => setActiveTab('register')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'register' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}>注册</button>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">手机号 / 账号</label>
              <div className="relative group">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400" />
                <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="请输入账号" className="w-full bg-[#2a2d35]/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all text-sm" />
              </div>
            </div>

            {activeTab === 'register' && (
              <div className="space-y-2 animate-in slide-in-from-top-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">所属部门</label>
                <div className="relative group">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400" />
                  <select name="department" value={formData.department} onChange={handleInputChange} className="w-full bg-[#2a2d35]/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500/50 transition-all text-sm appearance-none">
                    <option value="">-- 请选择部门 --</option>
                    {siteSettings?.departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                  </select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">密码</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400" />
                <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleInputChange} placeholder="请输入密码" className="w-full bg-[#2a2d35]/50 border border-white/5 rounded-2xl py-4 pl-12 pr-12 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all text-sm" />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
            </div>

            {activeTab === 'register' && (
               <div className="space-y-2 animate-in slide-in-from-top-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">确认密码</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400" />
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} placeholder="请再次输入密码" className="w-full bg-[#2a2d35]/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all text-sm" />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">验证码</label>
              <div className="flex gap-4">
                <div className="relative group flex-1">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400" />
                  <input type="text" name="captcha" value={formData.captcha} onChange={handleInputChange} placeholder="字符" maxLength={4} className="w-full bg-[#2a2d35]/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all text-sm uppercase" />
                </div>
                <div className="w-32 h-[56px] rounded-2xl overflow-hidden cursor-pointer border border-white/10 hover:border-white/30 transition-all" onClick={generateCaptcha}><canvas ref={canvasRef} width="128" height="56" className="w-full h-full bg-[#2a2d35]" /></div>
              </div>
            </div>

            {error && <div className="text-red-400 text-xs bg-red-900/20 p-4 rounded-2xl border border-red-500/20 flex items-center gap-2 font-bold"><ShieldAlert className="w-4 h-4" />{error}</div>}

            <button onClick={handleSubmit} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/30 active:scale-[0.98] transition-all uppercase tracking-widest text-sm">{activeTab === 'login' ? '立即登录' : '开启创作'}</button>

            <div className="text-center">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                {activeTab === 'login' ? '没有账号?' : '已有账号?'}
                <button onClick={() => setActiveTab(activeTab === 'login' ? 'register' : 'login')} className="text-indigo-400 hover:text-indigo-300 ml-2">立即{activeTab === 'login' ? '注册' : '登录'}</button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
