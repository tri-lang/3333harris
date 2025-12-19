
import React, { useState, useEffect, useRef } from 'react';
import { 
  Server, Activity, Upload, FileJson, Trash2, 
  Settings, Play, Link as LinkIcon, Save, 
  Workflow as WorkflowIcon, CheckCircle, XCircle, Type, Image as ImageIcon, Hash, Maximize, AlertCircle, Box, Plus, X, Users, Search, Edit, Globe, LayoutGrid, Monitor, ChevronDown, ChevronUp, Layers, Network, QrCode, Megaphone, Building2, ShieldCheck, Key, Laptop, Code, ToggleLeft, ToggleRight, Database, Info, Terminal, Sliders, Maximize2, Layout, FilePlus, ChevronRight, ArrowUp, ArrowDown
} from 'lucide-react';
import { ComfyWorkflow, MenuConfig, SiteSettings, CarouselSlide, FeatureItem, LayoutModule, ComfyServer, UserProfile, UserRole, ModuleType, ModelPreset, HomePageSettings, PageLayoutConfig } from '../types';
import { 
  getWorkflows, saveWorkflow, deleteWorkflow, updateWorkflow,
  getMenuConfigs, saveMenuConfigs, 
  getComfyServers, saveComfyServers, checkComfyConnection,
  getSiteSettings, saveSiteSettings
} from '../services/comfyService';
import { readFileAsDataURL } from '../services/imageUtils';

interface AdminDashboardProps {
  user: UserProfile | null;
}

const DEFAULT_LAYOUT: PageLayoutConfig = {
  modules: [
    { id: 'prompt', isEnabled: true, label: '提示词 (Prompt)' },
    { id: 'negativePrompt', isEnabled: false, label: '负向提示词' },
    { id: 'imageUpload', isEnabled: false, label: '上传参考图' },
    { id: 'model', isEnabled: true, label: '模型选择' },
    { id: 'aspectRatio', isEnabled: true, label: '画面比例' },
    { id: 'batchSize', isEnabled: false, label: '生成数量' },
    { id: 'textOutput', isEnabled: false, label: '结果文本显示' },
  ]
};

// Define system pages that cannot be deleted
const SYSTEM_PAGE_IDS = ['history', 'guestbook', 'outfit', 't2i'];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user: currentAdmin }) => {
  const [activeTab, setActiveTab] = useState<'status' | 'settings' | 'workflows' | 'menu' | 'users'>('status');
  const [servers, setServers] = useState<ComfyServer[]>([]);
  const [testingServerId, setTestingServerId] = useState<string | null>(null);
  const [workflows, setWorkflows] = useState<ComfyWorkflow[]>([]);
  const [menuConfigs, setMenuConfigs] = useState<MenuConfig[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editingWorkflow, setEditingWorkflow] = useState<ComfyWorkflow | null>(null);
  const [deletingWorkflow, setDeletingWorkflow] = useState<ComfyWorkflow | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const [siteSettings, setSiteSettingsLocal] = useState<SiteSettings>({ title: '', englishTitle: '', logoUrl: '', announcement: '', adminQrCodeUrl: '', departments: [] });
  
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedMenuId, setExpandedMenuId] = useState<string | null>(null);

  const workflowInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);
  const slideBgInputRef = useRef<HTMLInputElement>(null);
  
  // Use ref for active slide ID to prevent closure staleness issues during file selection
  const activeSlideIdRef = useRef<string | null>(null);

  const isSuperAdmin = currentAdmin?.role === 'super_admin';

  const refreshWorkflowList = () => {
    const list = getWorkflows();
    setWorkflows([...list]); 
  };

  useEffect(() => {
    refreshWorkflowList();
    setMenuConfigs(getMenuConfigs());
    setServers(getComfyServers());
    
    // Load users and ensure Admin exists
    let storedUsers = JSON.parse(localStorage.getItem('smartpic_users') || '[]');
    if (!storedUsers.find((u: any) => u.phone === 'admin')) {
      const defaultAdmin = {
        phone: 'admin',
        nickname: '超级管理员',
        role: 'super_admin',
        department: 'Management',
        password: 'admin', // Default password
        avatarUrl: ''
      };
      storedUsers = [defaultAdmin, ...storedUsers];
      localStorage.setItem('smartpic_users', JSON.stringify(storedUsers));
    }
    setUsers(storedUsers);
    
    setSiteSettingsLocal(getSiteSettings());
  }, []);

  const getAvailableNodes = (workflowId: string | null) => {
    if (!workflowId) return [];
    const wf = workflows.find(w => w.id === workflowId);
    if (!wf || !wf.apiJson) return [];
    
    return Object.keys(wf.apiJson).map(id => ({
      id,
      type: wf.apiJson[id].class_type,
      title: wf.apiJson[id]._meta?.title || wf.apiJson[id].class_type || `Node ${id}`,
      inputs: Object.keys(wf.apiJson[id].inputs || {})
    }));
  };

  const toggleModuleExpansion = (menuId: string, moduleId: string) => {
    const key = `${menuId}_${moduleId}`;
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(key)) newExpanded.delete(key);
    else newExpanded.add(key);
    setExpandedModules(newExpanded);
  };

  const handleWorkflowUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const newWorkflow: ComfyWorkflow = {
          id: `wf_${Date.now()}`,
          name: file.name.replace('.json', ''),
          description: 'Uploaded workflow',
          apiJson: json,
          createdAt: Date.now()
        };
        saveWorkflow(newWorkflow);
        refreshWorkflowList();
        alert('工作流已上传');
      } catch (err) {
        alert('无效的 JSON 文件，请确保上传的是 API 格式导出的 JSON。');
      }
    };
    reader.readAsText(file);
  };

  const handleInitiateDelete = (e: React.MouseEvent, wf: ComfyWorkflow) => {
    e.stopPropagation();
    setDeletingWorkflow(wf);
  };

  const handleConfirmDelete = () => {
    if (deletingWorkflow) {
      deleteWorkflow(deletingWorkflow.id);
      refreshWorkflowList();
      setDeletingWorkflow(null);
    }
  };

  const openRenameModal = (e: React.MouseEvent, wf: ComfyWorkflow) => {
    e.stopPropagation();
    setEditingWorkflow(wf);
    setRenameValue(wf.name);
  };

  const handleSaveWorkflowName = () => {
    if (editingWorkflow && renameValue.trim()) {
      updateWorkflow(editingWorkflow.id, { name: renameValue.trim() });
      setEditingWorkflow(null);
      refreshWorkflowList();
    }
  };

  // --- Menu Management ---

  const handleAddPage = () => {
    const newId = `page_${Date.now()}`;
    const newPage: MenuConfig = {
      id: newId,
      label: '新页面',
      icon: 'LayoutTemplate',
      pageTitle: '新功能页面',
      pageDesc: '页面描述...',
      workflowId: null,
      isEnabled: true,
      layout: JSON.parse(JSON.stringify(DEFAULT_LAYOUT)),
      inputMappings: {},
      outputNodeId: null,
      modelPresets: []
    };
    const updated = [...menuConfigs, newPage];
    setMenuConfigs(updated);
    saveMenuConfigs(updated);
    setExpandedMenuId(newId); // Auto expand new page
  };

  const handleDeletePage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (SYSTEM_PAGE_IDS.includes(id)) {
      alert("系统默认页面无法删除，但您可以禁用它。");
      return;
    }
    if (window.confirm("确定要删除这个页面吗？此操作无法撤销。")) {
      const updated = menuConfigs.filter(m => m.id !== id);
      setMenuConfigs(updated);
      saveMenuConfigs(updated);
      if (expandedMenuId === id) setExpandedMenuId(null);
    }
  };

  const handleToggleMenu = (id: string) => {
    const newMenu = menuConfigs.map(m => m.id === id ? { ...m, isEnabled: !m.isEnabled } : m);
    setMenuConfigs(newMenu);
    saveMenuConfigs(newMenu);
  };

  const updateMenuItem = (id: string, updates: Partial<MenuConfig>) => {
    const newMenu = menuConfigs.map(m => m.id === id ? { ...m, ...updates } : m);
    setMenuConfigs(newMenu);
    saveMenuConfigs(newMenu);
  };

  const moveMenuItem = (index: number, direction: 'up' | 'down') => {
    const newConfigs = [...menuConfigs];
    if (direction === 'up' && index > 0) {
      [newConfigs[index], newConfigs[index - 1]] = [newConfigs[index - 1], newConfigs[index]];
    } else if (direction === 'down' && index < newConfigs.length - 1) {
      [newConfigs[index], newConfigs[index + 1]] = [newConfigs[index + 1], newConfigs[index]];
    }
    setMenuConfigs(newConfigs);
    saveMenuConfigs(newConfigs);
  };

  const toggleLayoutModule = (e: React.MouseEvent, menuId: string, moduleId: ModuleType) => {
    e.stopPropagation(); 
    const menu = menuConfigs.find(m => m.id === menuId);
    if (!menu) return;
    const currentModules = menu.layout?.modules || DEFAULT_LAYOUT.modules;
    const newModules = currentModules.map(mod => 
      mod.id === moduleId ? { ...mod, isEnabled: !mod.isEnabled } : mod
    );
    updateMenuItem(menuId, { layout: { ...menu.layout, modules: newModules } });
  };

  const updateModuleLabel = (menuId: string, moduleId: ModuleType, label: string) => {
    const menu = menuConfigs.find(m => m.id === menuId);
    if (!menu) return;
    const currentModules = menu.layout?.modules || DEFAULT_LAYOUT.modules;
    const newModules = currentModules.map(mod => 
      mod.id === moduleId ? { ...mod, label } : mod
    );
    updateMenuItem(menuId, { layout: { ...menu.layout, modules: newModules } });
  };

  const updateModuleMapping = (menuId: string, moduleId: ModuleType, field: string, value: string) => {
    const menu = menuConfigs.find(m => m.id === menuId);
    if (!menu) return;
    const currentMappings = { ...menu.inputMappings };
    const currentModuleMapping = currentMappings[moduleId] || { nodeId: '', field: '' };
    
    const updated = { ...currentModuleMapping, [field]: value };

    if (field === 'nodeId' && moduleId !== 'aspectRatio') {
      const nodes = getAvailableNodes(menu.workflowId);
      const selectedNode = nodes.find(n => n.id === value);
      updated.field = selectedNode && selectedNode.inputs.length > 0 ? selectedNode.inputs[0] : '';
    }
    
    currentMappings[moduleId] = updated;
    updateMenuItem(menuId, { inputMappings: currentMappings });
  };

  const addModelPreset = (menuId: string) => {
    const menu = menuConfigs.find(m => m.id === menuId);
    if (!menu) return;
    const presets = [...(menu.modelPresets || [])];
    presets.push({ id: `preset_${Date.now()}`, name: '新模型', value: 'model_filename.safetensors' });
    updateMenuItem(menuId, { modelPresets: presets });
  };

  const removeModelPreset = (menuId: string, presetId: string) => {
    const menu = menuConfigs.find(m => m.id === menuId);
    if (!menu) return;
    const presets = (menu.modelPresets || []).filter(p => p.id !== presetId);
    updateMenuItem(menuId, { modelPresets: presets });
  };

  const updateModelPreset = (menuId: string, presetId: string, updates: Partial<ModelPreset>) => {
    const menu = menuConfigs.find(m => m.id === menuId);
    if (!menu) return;
    const presets = (menu.modelPresets || []).map(p => p.id === presetId ? { ...p, ...updates } : p);
    updateMenuItem(menuId, { modelPresets: presets });
  };

  const handleSaveServers = () => {
    saveComfyServers(servers);
    alert('服务器配置已保存');
  };

  const addServer = () => {
    setServers([...servers, { id: `srv_${Date.now()}`, name: 'New Server', url: 'https://', allowedDepartments: [], isEnabled: true }]);
  };

  const removeServer = (id: string) => {
    setServers(servers.filter(s => s.id !== id));
  };

  const updateServer = (id: string, updates: Partial<ComfyServer>) => {
    setServers(servers.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const toggleServerDept = (serverId: string, dept: string) => {
    const srv = servers.find(s => s.id === serverId);
    if (!srv) return;
    const depts = srv.allowedDepartments.includes(dept) 
      ? srv.allowedDepartments.filter(d => d !== dept)
      : [...srv.allowedDepartments, dept];
    updateServer(serverId, { allowedDepartments: depts });
  };

  const testConnection = async (id: string, url: string) => {
    if (!url) {
      alert("请输入服务器地址");
      return;
    }
    setTestingServerId(id);
    try {
      const normalizedUrl = url.replace(/\/$/, '');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      try {
        const res = await fetch(`${normalizedUrl}/system_stats`, { 
          mode: 'cors',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          alert('✅ 连接成功！服务器状态正常且支持跨域访问。');
        } else {
          alert(`⚠️ 连接失败。服务器返回状态码: ${res.status}`);
        }
      } catch (corsErr) {
        clearTimeout(timeoutId);
        try {
          await fetch(`${normalizedUrl}/system_stats`, { mode: 'no-cors' });
          alert('⚠️ 服务器在线，但浏览器拦截了跨域请求(CORS)。\n请在 ComfyUI 启动参数中添加: --allow-cors-origin *');
        } catch (networkErr) {
          alert('❌ 无法连接到服务器。\n请检查地址是否正确，或服务器是否已启动。');
        }
      }
    } catch (e) {
       alert('❌ 发生未知错误');
    } finally {
      setTestingServerId(null);
    }
  };

  const handleSaveUser = () => {
    if (!editingUser) return;
    const newUsers = users.map(u => u.phone === editingUser.phone ? editingUser : u);
    setUsers(newUsers);
    localStorage.setItem('smartpic_users', JSON.stringify(newUsers));
    setEditingUser(null);
    alert('用户信息已同步');
  };

  const handleSaveSiteSettings = () => {
    try {
      saveSiteSettings(siteSettings);
      alert('全局设置已保存');
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.message.includes('quota')) {
        alert('保存失败：背景图片过大。\n\n浏览器本地存储空间有限(约5MB)。\n请先压缩图片到 <500KB 后再上传，或者使用纯色渐变背景。');
      } else {
        alert('保存设置时发生未知错误。');
      }
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const dataUrl = await readFileAsDataURL(file);
      setSiteSettingsLocal({ ...siteSettings, logoUrl: dataUrl });
    }
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const dataUrl = await readFileAsDataURL(file);
      setSiteSettingsLocal({ ...siteSettings, adminQrCodeUrl: dataUrl });
    }
  };

  const addDepartment = () => {
    const name = prompt("请输入新部门名称");
    if (name && !siteSettings.departments.includes(name)) {
      setSiteSettingsLocal({ ...siteSettings, departments: [...siteSettings.departments, name] });
    }
  };

  const removeDepartment = (name: string) => {
    setSiteSettingsLocal({ ...siteSettings, departments: siteSettings.departments.filter(d => d !== name) });
  };

  // --- Home Page Helpers ---
  const updateHomePage = (updates: Partial<HomePageSettings>) => {
    const currentHome = siteSettings.homePage || { mainTitle: '灵鹊AI 图像处理中心', subTitle: '专业的在线图片处理、AI 文生图与智能一键换装工具。', slides: [], features: [] };
    setSiteSettingsLocal({ 
      ...siteSettings, 
      homePage: { ...currentHome, ...updates } 
    });
  };

  const addSlide = () => {
    const currentSlides = siteSettings.homePage?.slides || [];
    updateHomePage({
      slides: [...currentSlides, {
        id: `s_${Date.now()}`,
        title: '新幻灯片标题',
        desc: '这里填写描述文案...',
        buttonText: '立即查看',
        buttonIcon: 'ArrowRight',
        linkTarget: 'home',
        gradient: 'from-blue-600 to-indigo-700'
      }]
    });
  };

  const removeSlide = (id: string) => {
    const currentSlides = siteSettings.homePage?.slides || [];
    updateHomePage({ slides: currentSlides.filter(s => s.id !== id) });
  };

  const updateSlide = (id: string, updates: Partial<CarouselSlide>) => {
    const currentSlides = siteSettings.homePage?.slides || [];
    updateHomePage({ slides: currentSlides.map(s => s.id === id ? { ...s, ...updates } : s) });
  };

  const handleSlideBgUploadTrigger = (slideId: string) => {
    activeSlideIdRef.current = slideId;
    slideBgInputRef.current?.click();
  };

  const handleSlideBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeSlideIdRef.current) {
      try {
        const dataUrl = await readFileAsDataURL(file);
        
        // 1. Construct new state synchronously
        const currentSlides = siteSettings.homePage?.slides || [];
        const newSlides = currentSlides.map(s => s.id === activeSlideIdRef.current ? { ...s, bgImage: dataUrl } : s);
        
        const newHomePage = { ...(siteSettings.homePage || {}), slides: newSlides } as HomePageSettings;
        const newSettings = { ...siteSettings, homePage: newHomePage };

        // 2. Update Local State for UI feedback
        setSiteSettingsLocal(newSettings);

        // 3. Persist Immediately to Storage (Critical Fix)
        saveSiteSettings(newSettings);
        
        alert('幻灯片背景已上传并生效！');
      } catch (err: any) {
        console.error(err);
        if (err.name === 'QuotaExceededError' || err.message?.includes('quota')) {
           alert('上传失败：文件过大，超出浏览器存储限制 (建议 < 1MB)');
        } else {
           alert('图片处理失败，请重试');
        }
      } finally {
        activeSlideIdRef.current = null;
        if (slideBgInputRef.current) slideBgInputRef.current.value = '';
      }
    }
  };

  const addFeature = () => {
    const currentFeatures = siteSettings.homePage?.features || [];
    updateHomePage({
      features: [...currentFeatures, {
        id: `f_${Date.now()}`,
        title: '新特性',
        desc: '特性描述...',
        color: 'from-blue-600 to-cyan-500',
        linkTarget: 'home'
      }]
    });
  };

  const removeFeature = (id: string) => {
    const currentFeatures = siteSettings.homePage?.features || [];
    updateHomePage({ features: currentFeatures.filter(f => f.id !== id) });
  };

  const updateFeature = (id: string, updates: Partial<FeatureItem>) => {
    const currentFeatures = siteSettings.homePage?.features || [];
    updateHomePage({ features: currentFeatures.map(f => f.id === id ? { ...f, ...updates } : f) });
  };

  const roles: {value: UserRole, label: string}[] = [
    { value: 'super_admin', label: '超级管理员' },
    { value: 'admin', label: '管理员' },
    { value: 'user', label: '普通用户' }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-transparent text-slate-200 pb-20">
      <div className="max-w-7xl mx-auto p-10">
        <header className="mb-10 flex items-center justify-between">
          <div><h1 className="text-3xl font-black text-white mb-2 tracking-tight">后台管理中心</h1><p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Governance & Advanced Control</p></div>
        </header>

        <div className="flex gap-4 border-b border-white/5 mb-10 overflow-x-auto pb-2">
          {['status', 'settings', 'workflows', 'menu', 'users'].map(tab => {
             const isLocked = !isSuperAdmin && (tab === 'settings' || tab === 'users');
             if (isLocked) return null;
             return (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-4 flex items-center gap-2 font-black uppercase tracking-[0.2em] text-xs transition-all relative ${activeTab === tab ? 'text-indigo-400' : 'text-slate-500 hover:text-white'}`}>
                {tab === 'status' && <Server className="w-4 h-4" />}
                {tab === 'settings' && <Globe className="w-4 h-4" />}
                {tab === 'workflows' && <FileJson className="w-4 h-4" />}
                {tab === 'menu' && <LayoutGrid className="w-4 h-4" />}
                {tab === 'users' && <Users className="w-4 h-4" />}
                {tab === 'status' ? '服务器配置' : tab === 'settings' ? '全局设置' : tab === 'workflows' ? '工作流库' : tab === 'menu' ? '菜单编排' : '用户管理'}
                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>}
              </button>
             );
          })}
        </div>

        {/* ... (Previous tabs for status and workflows remain unchanged) ... */}
        {activeTab === 'status' && (
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className="flex justify-between items-center bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/5">
                <h3 className="text-xl font-black text-white flex items-center gap-3"><Network className="w-6 h-6 text-indigo-400" /> 后端服务器集群</h3>
                <div className="flex gap-3">
                   <button onClick={addServer} className="bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all"><Plus className="w-4 h-4"/> 添加节点</button>
                   <button onClick={handleSaveServers} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all shadow-xl shadow-indigo-600/30"><Save className="w-4 h-4"/> 同步配置</button>
                </div>
             </div>
             <div className="grid grid-cols-1 gap-6">
               {servers.map((srv) => (
                 <div key={srv.id} className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">节点名称</label>
                          <input type="text" value={srv.name} onChange={(e) => updateServer(srv.id, { name: e.target.value })} className="w-full bg-[#0f1115]/50 border border-white/5 rounded-2xl px-4 py-3.5 text-white font-bold" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">API 地址</label>
                          <input type="text" value={srv.url} onChange={(e) => updateServer(srv.id, { url: e.target.value })} className="w-full bg-[#0f1115]/50 border border-white/5 rounded-2xl px-4 py-3.5 text-white font-mono" />
                       </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-4 block">允许访问的部门 (复选限制)</label>
                        <div className="flex flex-wrap gap-2">
                           {siteSettings.departments.map(dept => (
                              <button 
                                key={dept} 
                                onClick={() => toggleServerDept(srv.id, dept)} 
                                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${srv.allowedDepartments.includes(dept) ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'}`}
                              >
                                {dept}
                              </button>
                           ))}
                        </div>
                    </div>
                    <div className="flex justify-between items-center border-t border-white/5 pt-6">
                       <div className="flex gap-4">
                          <button onClick={() => testConnection(srv.id, srv.url)} className="text-xs font-black uppercase tracking-widest px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-xl hover:bg-indigo-500 hover:text-white transition-all">{testingServerId === srv.id ? 'Connecting...' : '测试连接'}</button>
                          <label className="flex items-center gap-3 cursor-pointer">
                             <input type="checkbox" checked={srv.isEnabled} onChange={(e) => updateServer(srv.id, { isEnabled: e.target.checked })} className="hidden" />
                             <div className={`w-3 h-3 rounded-full ${srv.isEnabled ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></div>
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{srv.isEnabled ? '已启用' : '已禁用'}</span>
                          </label>
                       </div>
                       <button onClick={() => removeServer(srv.id)} className="p-3 text-slate-600 hover:text-red-400 transition-colors"><Trash2 className="w-5 h-5" /></button>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {activeTab === 'workflows' && (
           <div className="space-y-8 animate-in fade-in duration-500">
             <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/5 flex justify-between items-center">
                <h3 className="text-xl font-black text-white flex items-center gap-3"><Code className="w-6 h-6 text-indigo-400" /> 工作流中心 (JSON API)</h3>
                <button onClick={() => workflowInputRef.current?.click()} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all"><Upload className="w-4 h-4" /> 上传 .json</button>
                <input type="file" ref={workflowInputRef} onChange={handleWorkflowUpload} accept=".json" className="hidden" />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {workflows.map(wf => (
                 <div key={wf.id} className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col justify-between">
                    <div>
                      <h4 className="text-lg font-black text-white mb-2">{wf.name}</h4>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-4">ID: {wf.id}</p>
                    </div>
                    <div className="flex justify-end gap-2">
                       <button onClick={(e) => openRenameModal(e, wf)} className="text-indigo-400 hover:bg-indigo-500/10 p-2.5 rounded-xl transition-all" title="重命名"><Edit className="w-5 h-5" /></button>
                       <button onClick={(e) => handleInitiateDelete(e, wf)} className="text-red-400 hover:bg-red-400/10 p-2.5 rounded-xl transition-all" title="删除"><Trash2 className="w-5 h-5" /></button>
                    </div>
                 </div>
               ))}
               {workflows.length === 0 && <div className="col-span-full py-20 text-center text-slate-600 font-black uppercase tracking-widest text-sm bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">暂无上传的工作流</div>}
             </div>
           </div>
        )}

        {/* --- MENU ORCHESTRATION TAB (Refactored for Cleanliness) --- */}
        {activeTab === 'menu' && (
           <div className="space-y-10 animate-in fade-in duration-500">
             <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-white">功能菜单编排与页面定义</h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">点击卡片可展开详细配置</p>
                </div>
                <button onClick={handleAddPage} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all shadow-lg"><FilePlus className="w-4 h-4" /> 新建页面</button>
             </div>
             <div className="space-y-4">
               {menuConfigs.filter(m => m.id !== 'home').map((menu, index) => {
                 // Note: index passed to moveMenuItem needs to account for filtering if we support reordering 'home'
                 // But since we are filtering 'home' out, we should only allow reordering relative to other custom pages.
                 // The 'moveMenuItem' function operates on the FULL array. We need to find the REAL index.
                 const realIndex = menuConfigs.findIndex(m => m.id === menu.id);
                 
                 const availableNodes = getAvailableNodes(menu.workflowId);
                 const layoutModules = menu.layout?.modules || DEFAULT_LAYOUT.modules;
                 const isMenuExpanded = expandedMenuId === menu.id;

                 return (
                 <div key={menu.id} className={`bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl transition-all hover:border-indigo-500/20 ${isMenuExpanded ? 'ring-1 ring-indigo-500/50' : ''}`}>
                    {/* Collapsed Header / Summary View */}
                    <div 
                      className="bg-white/5 p-6 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors"
                      onClick={() => setExpandedMenuId(isMenuExpanded ? null : menu.id)}
                    >
                       <div className="flex items-center gap-6">
                          <div className={`p-3 rounded-2xl transition-colors ${isMenuExpanded ? 'bg-indigo-600 text-white' : 'bg-indigo-500/10 text-indigo-400'}`}>
                             {isMenuExpanded ? <Settings className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                          </div>
                          <div>
                             <h4 className="text-lg font-black text-white">{menu.label}</h4>
                             <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">ID: {menu.id}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-6">
                          {/* Sorting Controls */}
                          <div className="flex items-center gap-2 mr-4 bg-black/20 rounded-lg p-1" onClick={e => e.stopPropagation()}>
                             <button 
                               onClick={() => moveMenuItem(realIndex, 'up')} 
                               disabled={realIndex <= 1} // assuming home is index 0
                               className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                               title="上移"
                             >
                               <ArrowUp className="w-4 h-4" />
                             </button>
                             <div className="w-[1px] h-4 bg-white/10"></div>
                             <button 
                               onClick={() => moveMenuItem(realIndex, 'down')} 
                               disabled={realIndex === menuConfigs.length - 1}
                               className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                               title="下移"
                             >
                               <ArrowDown className="w-4 h-4" />
                             </button>
                          </div>

                          <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{menu.isEnabled ? '已发布' : '草稿'}</span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={menu.isEnabled} onChange={() => handleToggleMenu(menu.id)} className="sr-only peer" />
                                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                              </label>
                          </div>
                          <div className={`p-2 rounded-full transition-transform duration-300 ${isMenuExpanded ? 'rotate-180 bg-white/10 text-white' : 'text-slate-500'}`}>
                             <ChevronDown className="w-5 h-5" />
                          </div>
                       </div>
                    </div>
                    
                    {/* Expanded Content View */}
                    {isMenuExpanded && (
                      <div className="p-8 pt-0 space-y-10 border-t border-white/5 bg-black/20 animate-in slide-in-from-top-2 duration-300">
                         {/* Header Actions */}
                         <div className="flex justify-end pt-6">
                            {!SYSTEM_PAGE_IDS.includes(menu.id) ? (
                              <button onClick={(e) => handleDeletePage(menu.id, e)} className="text-xs font-bold text-red-400 hover:bg-red-500/10 px-4 py-2 rounded-xl transition-colors flex items-center gap-2"><Trash2 className="w-4 h-4"/> 删除此页面</button>
                            ) : (
                              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> 系统核心页面 (已保护)</span>
                            )}
                         </div>

                         {/* 1. Basic Info & Binding */}
                         <div className="space-y-6">
                            <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5 pb-2 mb-4">基础信息与绑定</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">导航显示名称</label>
                                  <input type="text" value={menu.label} onChange={(e) => updateMenuItem(menu.id, { label: e.target.value })} className="w-full bg-[#1e1e2d] border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-sm outline-none focus:border-indigo-500 transition-all" />
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">API 工作流 (JSON)</label>
                                  <select value={menu.workflowId || ''} onChange={(e) => updateMenuItem(menu.id, { workflowId: e.target.value })} className="w-full bg-[#1e1e2d] border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-sm outline-none focus:border-indigo-500 transition-all">
                                     <option value="">-- 选择绑定的流程 --</option>
                                     {workflows.map(wf => <option key={wf.id} value={wf.id}>{wf.name}</option>)}
                                  </select>
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">页面主标题</label>
                                  <input type="text" value={menu.pageTitle || ''} onChange={(e) => updateMenuItem(menu.id, { pageTitle: e.target.value })} className="w-full bg-[#1e1e2d] border border-white/10 rounded-xl px-4 py-3 text-white font-medium text-sm outline-none focus:border-indigo-500 transition-all" />
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">页面副标题</label>
                                  <input type="text" value={menu.pageDesc || ''} onChange={(e) => updateMenuItem(menu.id, { pageDesc: e.target.value })} className="w-full bg-[#1e1e2d] border border-white/10 rounded-xl px-4 py-3 text-slate-300 text-sm outline-none focus:border-indigo-500 transition-all" />
                               </div>
                               <div className="space-y-2 md:col-span-2">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">图像输出节点 (Image Output)</label>
                                  <select value={menu.outputNodeId || ''} onChange={(e) => updateMenuItem(menu.id, { outputNodeId: e.target.value })} className="w-full bg-[#1e1e2d] border border-white/10 rounded-xl px-4 py-3 text-indigo-300 font-mono text-xs outline-none focus:border-indigo-500 transition-all">
                                     <option value="">-- 自动检测或指定 --</option>
                                     {availableNodes.map(node => <option key={node.id} value={node.id}>[{node.id}] {node.title} ({node.type})</option>)}
                                  </select>
                               </div>
                            </div>
                         </div>

                         {/* 2. Layout Modules */}
                         <div className="space-y-6">
                            <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5 pb-2 mb-4">组件开关与参数映射</h5>
                            <div className="grid grid-cols-1 gap-4">
                               {layoutModules.map(mod => {
                                 const currentMapping = menu.inputMappings[mod.id] || { nodeId: '', field: '' };
                                 const isRatio = mod.id === 'aspectRatio';
                                 const isModExpanded = expandedModules.has(`${menu.id}_${mod.id}`);

                                 return (
                                 <div key={mod.id} className={`rounded-2xl border transition-all overflow-hidden ${mod.isEnabled ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-white/5 border-white/5 opacity-70'}`}>
                                    <div 
                                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                                      onClick={() => toggleModuleExpansion(menu.id, mod.id)}
                                    >
                                       <div className="flex items-center gap-4">
                                          <button onClick={(e) => toggleLayoutModule(e, menu.id, mod.id)} className="transition-all">
                                             {mod.isEnabled ? <ToggleRight className="w-6 h-6 text-indigo-400" /> : <ToggleLeft className="w-6 h-6 text-slate-600" />}
                                          </button>
                                          <div className="flex flex-col">
                                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{mod.id}</span>
                                             <input 
                                               type="text" 
                                               value={mod.label} 
                                               onClick={(e) => e.stopPropagation()}
                                               onChange={(e) => updateModuleLabel(menu.id, mod.id, e.target.value)} 
                                               className="bg-transparent border-none p-0 text-sm font-bold text-white outline-none w-40 hover:text-indigo-300 transition-colors"
                                             />
                                          </div>
                                       </div>
                                       <div className="flex items-center gap-3">
                                          {mod.isEnabled && (
                                             <span className="text-[9px] font-mono text-indigo-300/70 hidden sm:inline-block">
                                               {isRatio ? 'W/H Mapped' : (currentMapping.nodeId ? `Mapped to [${currentMapping.nodeId}]` : 'Unmapped')}
                                             </span>
                                          )}
                                          <ChevronRight className={`w-4 h-4 text-slate-600 transition-transform ${isModExpanded ? 'rotate-90' : ''}`} />
                                       </div>
                                    </div>

                                    {isModExpanded && (
                                      <div className="p-4 pt-0 border-t border-white/5 bg-black/10">
                                         <div className="mt-4">
                                            {isRatio ? (
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                  <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest">宽度节点 (Width)</label>
                                                  <select value={currentMapping.widthNodeId || ''} onChange={(e) => updateModuleMapping(menu.id, mod.id, 'widthNodeId', e.target.value)} className="w-full bg-[#1e1e2d] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono outline-none">
                                                    <option value="">-- Node --</option>
                                                    {availableNodes.map(node => <option key={node.id} value={node.id}>{node.id} | {node.title}</option>)}
                                                  </select>
                                                  <select value={currentMapping.widthField || ''} onChange={(e) => updateModuleMapping(menu.id, mod.id, 'widthField', e.target.value)} className="w-full bg-[#1e1e2d] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono outline-none">
                                                    <option value="">-- Input --</option>
                                                    {(availableNodes.find(n => n.id === currentMapping.widthNodeId)?.inputs || []).map(f => <option key={f} value={f}>{f}</option>)}
                                                  </select>
                                                </div>
                                                <div className="space-y-2">
                                                  <label className="text-[9px] font-black text-pink-400 uppercase tracking-widest">高度节点 (Height)</label>
                                                  <select value={currentMapping.heightNodeId || ''} onChange={(e) => updateModuleMapping(menu.id, mod.id, 'heightNodeId', e.target.value)} className="w-full bg-[#1e1e2d] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono outline-none">
                                                    <option value="">-- Node --</option>
                                                    {availableNodes.map(node => <option key={node.id} value={node.id}>{node.id} | {node.title}</option>)}
                                                  </select>
                                                  <select value={currentMapping.heightField || ''} onChange={(e) => updateModuleMapping(menu.id, mod.id, 'heightField', e.target.value)} className="w-full bg-[#1e1e2d] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono outline-none">
                                                    <option value="">-- Input --</option>
                                                    {(availableNodes.find(n => n.id === currentMapping.heightNodeId)?.inputs || []).map(f => <option key={f} value={f}>{f}</option>)}
                                                  </select>
                                                </div>
                                              </div>
                                            ) : (
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                  <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">目标节点 (Node)</label>
                                                    <select value={currentMapping.nodeId || ''} onChange={(e) => updateModuleMapping(menu.id, mod.id, 'nodeId', e.target.value)} className="w-full bg-[#1e1e2d] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono outline-none">
                                                      <option value="">-- Select Node --</option>
                                                      {availableNodes.map(node => <option key={node.id} value={node.id}>{node.id} | {node.title}</option>)}
                                                    </select>
                                                  </div>
                                                  <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">输入字段 (Input)</label>
                                                    <select value={currentMapping.field || ''} onChange={(e) => updateModuleMapping(menu.id, mod.id, 'field', e.target.value)} className="w-full bg-[#1e1e2d] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono outline-none">
                                                      <option value="">-- Select Field --</option>
                                                      {(availableNodes.find(n => n.id === currentMapping.nodeId)?.inputs || []).map(f => <option key={f} value={f}>{f}</option>)}
                                                    </select>
                                                  </div>
                                              </div>
                                            )}
                                         </div>
                                      </div>
                                    )}
                                 </div>
                               );})}
                            </div>
                         </div>

                         {/* 3. Model Presets */}
                         {layoutModules.find(m => m.id === 'model')?.isEnabled && (
                           <div className="space-y-6">
                              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-4">
                                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">模型预设列表</h5>
                                <button onClick={() => addModelPreset(menu.id)} className="text-[10px] font-bold text-indigo-400 hover:text-white flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-500 px-3 py-1.5 rounded-lg transition-colors"><Plus className="w-3 h-3"/> 添加模型</button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                 {(menu.modelPresets || []).map(preset => (
                                   <div key={preset.id} className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3 relative group">
                                      <button onClick={() => removeModelPreset(menu.id, preset.id)} className="absolute top-2 right-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><X className="w-3 h-3" /></button>
                                      <div className="space-y-1">
                                         <label className="text-[9px] font-black text-slate-500">显示名称</label>
                                         <input type="text" value={preset.name} onChange={e => updateModelPreset(menu.id, preset.id, { name: e.target.value })} className="w-full bg-black/20 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white" />
                                      </div>
                                      <div className="space-y-1">
                                         <label className="text-[9px] font-black text-slate-500">模型文件名</label>
                                         <input type="text" value={preset.value} onChange={e => updateModelPreset(menu.id, preset.id, { value: e.target.value })} className="w-full bg-black/20 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-indigo-300 font-mono" />
                                      </div>
                                   </div>
                                 ))}
                                 {(menu.modelPresets || []).length === 0 && <div className="col-span-full py-4 text-center text-[10px] text-slate-600">暂无预设，前台将不显示选项</div>}
                              </div>
                           </div>
                         )}
                      </div>
                    )}
                 </div>
               );})}
             </div>
           </div>
        )}

        {activeTab === 'settings' && isSuperAdmin && (
          <div className="grid grid-cols-1 gap-10 animate-in fade-in duration-500">
            {/* Same settings UI */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8">
              <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-black text-white flex items-center gap-3"><Globe className="w-6 h-6 text-indigo-400" /> 全局站点配置</h2>
                  <button onClick={handleSaveSiteSettings} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-2xl text-xs font-black shadow-xl shadow-indigo-600/30 transition-all">保存设置</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">站点标题 (中文)</label>
                    <input type="text" value={siteSettings.title} onChange={(e) => setSiteSettingsLocal({ ...siteSettings, title: e.target.value })} className="w-full bg-[#0f1115]/50 border border-white/5 rounded-2xl px-4 py-3.5 text-white font-black" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">站点标题 (英文)</label>
                    <input type="text" value={siteSettings.englishTitle} onChange={(e) => setSiteSettingsLocal({ ...siteSettings, englishTitle: e.target.value })} className="w-full bg-[#0f1115]/50 border border-white/5 rounded-2xl px-4 py-3.5 text-white font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">站点 Logo 图标</label>
                    <div className="flex items-center gap-6 bg-[#0f1115]/50 p-6 rounded-3xl border border-white/5">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                           {siteSettings.logoUrl ? (
                             <img src={siteSettings.logoUrl} className="w-full h-full object-cover" alt="Logo" />
                           ) : (
                             <ImageIcon className="w-8 h-8 text-slate-700" />
                           )}
                        </div>
                        <div className="flex-1">
                           <button 
                             onClick={() => logoInputRef.current?.click()}
                             className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all border border-white/5"
                           >
                             上传图片
                           </button>
                           <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                        </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">管理员二维码 (Footer)</label>
                    <div className="flex items-center gap-6 bg-[#0f1115]/50 p-6 rounded-3xl border border-white/5">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                           {siteSettings.adminQrCodeUrl ? (
                             <img src={siteSettings.adminQrCodeUrl} className="w-full h-full object-cover" alt="QR" />
                           ) : (
                             <QrCode className="w-8 h-8 text-slate-700" />
                           )}
                        </div>
                        <div className="flex-1">
                           <button 
                             onClick={() => qrInputRef.current?.click()}
                             className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all border border-white/5"
                           >
                             上传二维码
                           </button>
                           <input type="file" ref={qrInputRef} onChange={handleQrUpload} accept="image/*" className="hidden" />
                        </div>
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">公告内容</label>
                    <textarea value={siteSettings.announcement || ''} onChange={(e) => setSiteSettingsLocal({ ...siteSettings, announcement: e.target.value })} className="w-full bg-[#0f1115]/50 border border-white/5 rounded-2xl px-4 py-3.5 text-white text-sm h-20 resize-none" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">部门预设管理</label>
                     <div className="bg-[#0f1115]/50 p-6 rounded-3xl border border-white/5">
                        <div className="flex flex-wrap gap-2 mb-4">
                           {siteSettings.departments.map(dept => (
                              <div key={dept} className="bg-indigo-500/10 pl-4 pr-2 py-2 rounded-xl flex items-center gap-3 border border-indigo-500/20">
                                 <span className="text-xs font-bold text-indigo-300">{dept}</span>
                                 <button onClick={() => removeDepartment(dept)} className="p-1 hover:text-red-400 text-slate-600"><X className="w-4 h-4" /></button>
                              </div>
                           ))}
                        </div>
                        <button onClick={addDepartment} className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-xs font-black transition-all border border-white/5 uppercase tracking-widest">+ 新增部门名称</button>
                     </div>
                  </div>
              </div>
            </div>

            {/* Home Page Content Editor */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8">
               <div className="flex items-center gap-3 mb-8">
                  <Layout className="w-6 h-6 text-indigo-400" />
                  <h2 className="text-xl font-black text-white">首页内容编排</h2>
               </div>
               
               <div className="space-y-10">
                  {/* Hero Texts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">首页主标题</label>
                        <input type="text" value={siteSettings.homePage?.mainTitle || ''} onChange={(e) => updateHomePage({ mainTitle: e.target.value })} className="w-full bg-[#0f1115]/50 border border-white/5 rounded-2xl px-4 py-3.5 text-white font-black" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">首页副标题</label>
                        <input type="text" value={siteSettings.homePage?.subTitle || ''} onChange={(e) => updateHomePage({ subTitle: e.target.value })} className="w-full bg-[#0f1115]/50 border border-white/5 rounded-2xl px-4 py-3.5 text-white font-medium text-sm" />
                     </div>
                  </div>

                  {/* Carousel Editor */}
                  <div className="space-y-4">
                     <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">顶部轮播幻灯片</label>
                        <button onClick={addSlide} className="text-xs bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-lg font-bold transition-all">+ 添加幻灯片</button>
                     </div>
                     <input type="file" ref={slideBgInputRef} onChange={handleSlideBgUpload} accept="image/*" className="hidden" />
                     <div className="grid grid-cols-1 gap-4">
                        {(siteSettings.homePage?.slides || []).map(slide => (
                           <div key={slide.id} className="bg-[#0f1115]/50 border border-white/5 rounded-2xl p-5 relative group overflow-hidden">
                              <button onClick={() => removeSlide(slide.id)} className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition-all z-10"><Trash2 className="w-4 h-4" /></button>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-12 relative z-10">
                                 <input type="text" value={slide.title} onChange={e => updateSlide(slide.id, { title: e.target.value })} placeholder="标题" className="bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-white font-bold text-sm backdrop-blur-sm" />
                                 <input type="text" value={slide.desc} onChange={e => updateSlide(slide.id, { desc: e.target.value })} placeholder="描述" className="bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-slate-300 text-xs backdrop-blur-sm" />
                                 <input type="text" value={slide.buttonText} onChange={e => updateSlide(slide.id, { buttonText: e.target.value })} placeholder="按钮文案" className="bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-white text-xs font-bold backdrop-blur-sm" />
                                 <select value={slide.linkTarget} onChange={e => updateSlide(slide.id, { linkTarget: e.target.value })} className="bg-[#1e1e2d] border border-white/10 rounded-xl px-3 py-2 text-slate-200 text-xs font-mono outline-none focus:border-indigo-500">
                                    <option value="upload">Trigger Upload</option>
                                    {menuConfigs.map(m => <option key={m.id} value={m.id}>Page: {m.label}</option>)}
                                 </select>
                                 <div className="col-span-2 flex flex-col gap-2">
                                     <div className="flex gap-4">
                                        <input type="text" value={slide.gradient} onChange={e => updateSlide(slide.id, { gradient: e.target.value })} placeholder="Tailwind Gradient (e.g., from-blue-600 to-purple-600)" className="flex-1 bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-slate-400 text-xs font-mono backdrop-blur-sm" />
                                        <button onClick={() => handleSlideBgUploadTrigger(slide.id)} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-[10px] font-bold text-white transition-all whitespace-nowrap border border-white/5">
                                            {slide.bgImage ? '更换背景图' : '上传背景图'}
                                        </button>
                                     </div>
                                     <p className="text-[9px] text-slate-500 font-bold ml-1 flex items-center gap-1">
                                        <Info className="w-3 h-3"/> 建议尺寸: 1920x640px (16:9), 文件大小 &lt;2MB
                                     </p>
                                 </div>
                              </div>

                              {/* Preview Background */}
                              {slide.bgImage && (
                                <div className="absolute inset-0 z-0 opacity-30">
                                   <img src={slide.bgImage} className="w-full h-full object-cover" alt="bg-preview" />
                                   <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent"></div>
                                </div>
                              )}
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Features Editor */}
                  <div className="space-y-4 pt-6 border-t border-white/5">
                     <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">功能特性网格</label>
                        <button onClick={addFeature} className="text-xs bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-lg font-bold transition-all">+ 添加特性块</button>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(siteSettings.homePage?.features || []).map(feature => (
                           <div key={feature.id} className="bg-[#0f1115]/50 border border-white/5 rounded-2xl p-5 relative">
                              <button onClick={() => removeFeature(feature.id)} className="absolute top-2 right-2 p-1.5 hover:bg-red-500/10 text-slate-600 hover:text-red-400 rounded-lg transition-all"><X className="w-3 h-3" /></button>
                              <div className="space-y-3 mt-2">
                                 <input type="text" value={feature.title} onChange={e => updateFeature(feature.id, { title: e.target.value })} placeholder="特性标题" className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-white font-bold text-xs" />
                                 <textarea value={feature.desc} onChange={e => updateFeature(feature.id, { desc: e.target.value })} placeholder="简短描述" className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-slate-400 text-[10px] resize-none h-16" />
                                 <input type="text" value={feature.color} onChange={e => updateFeature(feature.id, { color: e.target.value })} placeholder="Gradient Colors" className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-slate-500 text-[10px] font-mono" />
                                 <select value={feature.linkTarget || ''} onChange={e => updateFeature(feature.id, { linkTarget: e.target.value })} className="w-full bg-[#1e1e2d] border border-white/10 rounded-xl px-3 py-2 text-slate-200 text-[10px] outline-none focus:border-indigo-500">
                                    <option value="">No Link</option>
                                    <option value="upload">Trigger Upload</option>
                                    {menuConfigs.map(m => <option key={m.id} value={m.id}>Page: {m.label}</option>)}
                                 </select>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* ... (Users Tab remains the same) ... */}
        {activeTab === 'users' && isSuperAdmin && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/5 flex justify-between items-center">
               <h3 className="text-xl font-black text-white">用户库与权限管理</h3>
               <div className="relative group">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-indigo-400" />
                 <input type="text" placeholder="搜索账号手机号..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-[#0f1115]/50 border border-white/5 rounded-2xl pl-12 pr-6 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 w-64" />
               </div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
               <table className="w-full text-left">
                  <thead className="bg-white/5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                     <tr><th className="px-8 py-5">账号手机</th><th className="px-8 py-5">部门</th><th className="px-8 py-5">角色</th><th className="px-8 py-5 text-right">操作</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm font-medium">
                     {users.filter(u => u.phone.includes(searchTerm)).map(user => (
                       <tr key={user.phone} className="hover:bg-white/5 transition-colors">
                          <td className="px-8 py-5 text-white font-bold">{user.phone}</td>
                          <td className="px-8 py-5 text-slate-400">{user.department || '未分配'}</td>
                          <td className="px-8 py-5">
                             <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                               user.role === 'super_admin' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                               user.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                               'bg-slate-500/10 text-slate-500 border-white/10'
                             }`}>
                               {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'User'}
                             </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                             <button onClick={() => setEditingUser(user)} className="p-2.5 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white rounded-xl transition-all"><Edit className="w-4 h-4" /></button>
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </div>
        )}
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-[#1e1e2d] border border-white/10 rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden p-10 space-y-8">
             <div className="flex justify-between items-center"><h3 className="text-2xl font-black text-white tracking-tight">管理用户信息</h3><button onClick={() => setEditingUser(null)} className="p-2 text-slate-600 hover:text-white hover:bg-white/5 rounded-full transition-all"><X className="w-6 h-6" /></button></div>
             <div className="space-y-6">
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">手机号 (账号)</label><input type="text" value={editingUser.phone} disabled className="w-full bg-[#0f1115] border border-white/5 rounded-2xl px-5 py-4 text-slate-500 text-sm font-bold" /></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">所属部门</label>
                  <select value={editingUser.department || ''} onChange={e => setEditingUser({...editingUser, department: e.target.value})} className="w-full bg-[#1e1e2d] border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:border-indigo-500 transition-all">
                    <option value="">-- 未指定 --</option>
                    {siteSettings.departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                  </select>
                </div>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">权限级别 (Role)</label>
                  <div className="grid grid-cols-1 gap-2">
                    {roles.map(r => (
                      <button 
                        key={r.value} 
                        onClick={() => setEditingUser({...editingUser, role: r.value})}
                        className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-between ${editingUser.role === r.value ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'}`}
                      >
                        {r.label}
                        {editingUser.role === r.value && <ShieldCheck className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2 pt-4 border-t border-white/5">
                   <label className="text-[10px] font-black text-red-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Key className="w-3 h-3"/> 重置密码</label>
                   <input 
                     type="text" 
                     placeholder="直接输入新密码"
                     onChange={e => setEditingUser({...editingUser, password: e.target.value})}
                     className="w-full bg-red-500/5 border border-red-500/10 rounded-2xl px-5 py-4 text-white text-sm focus:border-red-500/50 outline-none transition-all" 
                   />
                </div>
             </div>
             <button onClick={handleSaveUser} className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-2xl shadow-indigo-600/30 active:scale-[0.98] transition-all uppercase tracking-widest text-xs">更新用户信息</button>
          </div>
        </div>
      )}

      {/* Workflow Rename Modal */}
      {editingWorkflow && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-[#1e1e2d] border border-white/10 rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden p-8 space-y-6">
             <div className="flex justify-between items-center">
               <h3 className="text-xl font-black text-white tracking-tight">编辑工作流名称</h3>
               <button onClick={() => setEditingWorkflow(null)} className="p-2 text-slate-600 hover:text-white hover:bg-white/5 rounded-full transition-all"><X className="w-5 h-5" /></button>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">新名称</label>
                <input 
                  type="text" 
                  value={renameValue} 
                  onChange={e => setRenameValue(e.target.value)}
                  className="w-full bg-[#0f1115] border border-white/5 rounded-2xl px-5 py-4 text-white text-sm font-bold focus:border-indigo-500/50 outline-none transition-all"
                  autoFocus
                />
             </div>
             <button onClick={handleSaveWorkflowName} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/30 active:scale-[0.98] transition-all uppercase tracking-widest text-xs">确认修改</button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingWorkflow && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-sm bg-[#1e1e2d] border border-white/10 rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden p-8 space-y-6">
                <div className="flex justify-between items-center">
                   <h3 className="text-xl font-black text-white tracking-tight">确认删除</h3>
                   <button onClick={() => setDeletingWorkflow(null)} className="p-2 text-slate-600 hover:text-white hover:bg-white/5 rounded-full transition-all"><X className="w-5 h-5" /></button>
                </div>
                <p className="text-slate-400 text-sm font-medium">
                   确定要删除工作流 <span className="text-white font-bold">"{deletingWorkflow.name}"</span> 吗？<br/>
                   <span className="text-red-400 text-xs mt-2 block">此操作不可恢复，已绑定的前端页面将无法生成图片。</span>
                </p>
                <div className="flex gap-4">
                   <button onClick={() => setDeletingWorkflow(null)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-2xl transition-all text-xs">取消</button>
                   <button onClick={handleConfirmDelete} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl shadow-xl shadow-red-600/20 active:scale-[0.98] transition-all text-xs">确认删除</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
