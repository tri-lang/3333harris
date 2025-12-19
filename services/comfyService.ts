
import { ComfyWorkflow, MenuConfig, SiteSettings, HomePageSettings, PageLayoutConfig, ComfyServer, HistoryItem, UserProfile, Comment, ModuleType } from '../types';

const STORAGE_KEYS = {
  WORKFLOWS: 'smartpic_comfy_workflows',
  MENU_CONFIGS: 'smartpic_menu_configs_v3',
  COMFY_SERVERS: 'smartpic_comfy_servers',
  SITE_SETTINGS: 'smartpic_site_settings',
  HISTORY: 'smartpic_user_history',
  CURRENT_USER: 'smartpic_current_user',
  COMMENTS: 'smartpic_guestbook_comments',
};

// --- Default UI Structure ---

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

const DEFAULT_MENU_ITEMS: MenuConfig[] = [
  { id: 'home', label: '首页', icon: 'Home', workflowId: null, isEnabled: true, inputMappings: {}, outputNodeId: null, layout: DEFAULT_LAYOUT },
  { 
    id: 't2i', label: 'AI文生图', icon: 'Wand2', workflowId: null, isEnabled: true, 
    pageTitle: 'AI 创意文生图', pageDesc: '输入描述，选择模型与比例，AI 将为您生成创意图像。',
    layout: {
      modules: [
        { id: 'prompt', isEnabled: true, label: '画面描述' },
        { id: 'negativePrompt', isEnabled: true, label: '不希望出现的内容' },
        { id: 'imageUpload', isEnabled: false, label: '上传参考图' },
        { id: 'model', isEnabled: true, label: '风格模型' },
        { id: 'aspectRatio', isEnabled: true, label: '画面比例' },
        { id: 'batchSize', isEnabled: true, label: '生成数量' },
        { id: 'textOutput', isEnabled: false, label: '分析结果文本' },
      ]
    },
    inputMappings: {}, outputNodeId: null 
  },
  { 
    id: 'outfit', label: '一键换装', icon: 'Shirt', workflowId: null, isEnabled: true,
    pageTitle: '智能一键换装', pageDesc: '上传模特图与服装图，保持姿势与光影，完美融合。',
    layout: {
      modules: [
         { id: 'imageUpload', isEnabled: true, label: '上传模特与服装' },
         { id: 'prompt', isEnabled: true, label: '换装描述' },
         { id: 'model', isEnabled: false, label: '模型' },
         { id: 'aspectRatio', isEnabled: false, label: '比例' },
         { id: 'batchSize', isEnabled: false, label: '数量' },
         { id: 'textOutput', isEnabled: false, label: '换装分析' },
      ]
    },
    inputMappings: {}, outputNodeId: null 
  },
  { id: 'history', label: '历史记录', icon: 'History', workflowId: null, isEnabled: true, inputMappings: {}, outputNodeId: null, layout: DEFAULT_LAYOUT },
  { id: 'guestbook', label: '留言板', icon: 'MessageSquare', workflowId: null, isEnabled: true, inputMappings: {}, outputNodeId: null, layout: DEFAULT_LAYOUT },
];

const DEFAULT_HOME_PAGE: HomePageSettings = {
  mainTitle: "灵鹊AI 图像处理中心",
  subTitle: "专业的在线图片处理、AI 文生图与智能一键换装工具。",
  slides: [
    {
      id: 's1',
      title: "智能图像处理工作室",
      desc: "一站式解决图片压缩、格式转换与AI分析。上传图片，开启高效创作之旅。",
      buttonText: "上传图片开始",
      buttonIcon: 'Upload',
      linkTarget: 'upload',
      gradient: "from-indigo-600 to-blue-700"
    }
  ],
  features: [
    { id: 'f1', title: '智能压缩', desc: '无损压缩图片体积，节省存储空间', color: 'from-blue-600 to-cyan-500', linkTarget: 'upload' },
    { id: 'f2', title: '格式转换', desc: '支持 JPG/PNG/WEBP 互转', color: 'from-purple-600 to-pink-500', linkTarget: 'upload' },
    { id: 'f3', title: 'AI 智能换装', desc: '利用 ComfyUI 流程，一键为模特更换服装', color: 'from-orange-500 to-amber-500', linkTarget: 'outfit' },
  ]
};

// --- Storage Logic ---

export const getWorkflows = (): ComfyWorkflow[] => {
  const data = localStorage.getItem(STORAGE_KEYS.WORKFLOWS);
  return data ? JSON.parse(data) : [];
};

export const saveWorkflow = (workflow: ComfyWorkflow) => {
  const workflows = getWorkflows();
  workflows.push(workflow);
  localStorage.setItem(STORAGE_KEYS.WORKFLOWS, JSON.stringify(workflows));
};

export const updateWorkflow = (id: string, updates: Partial<ComfyWorkflow>) => {
  const workflows = getWorkflows().map(w => w.id === id ? { ...w, ...updates } : w);
  localStorage.setItem(STORAGE_KEYS.WORKFLOWS, JSON.stringify(workflows));
};

export const deleteWorkflow = (id: string) => {
  const workflows = getWorkflows().filter(w => w.id !== id);
  localStorage.setItem(STORAGE_KEYS.WORKFLOWS, JSON.stringify(workflows));
};

export const getWorkflowById = (id: string): ComfyWorkflow | undefined => {
  return getWorkflows().find(w => w.id === id);
};

export const getSiteSettings = (): SiteSettings => {
  const data = localStorage.getItem(STORAGE_KEYS.SITE_SETTINGS);
  const settings = data ? JSON.parse(data) : { 
    title: '灵鹊AI', 
    englishTitle: 'Pro Studio', 
    departments: ['设计部', '市场部', '研发部', '运营部']
  };
  if (!settings.homePage) settings.homePage = DEFAULT_HOME_PAGE;
  return settings;
};

export const saveSiteSettings = (settings: SiteSettings) => {
  localStorage.setItem(STORAGE_KEYS.SITE_SETTINGS, JSON.stringify(settings));
};

export const getMenuConfigs = (): MenuConfig[] => {
  const data = localStorage.getItem(STORAGE_KEYS.MENU_CONFIGS);
  try {
    const parsed = data ? JSON.parse(data) : [];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_MENU_ITEMS;
    
    // Data Migration: Ensure every item has a layout property to prevent crashes
    return parsed.map((item: any) => ({
      ...item,
      layout: item.layout || JSON.parse(JSON.stringify(DEFAULT_LAYOUT)),
      inputMappings: item.inputMappings || {},
      modelPresets: item.modelPresets || [],
      isEnabled: item.isEnabled ?? true,
      label: item.label || 'Unknown Page'
    }));
  } catch (e) {
    return DEFAULT_MENU_ITEMS;
  }
};

export const getMenuConfigById = (id: string): MenuConfig | undefined => {
  return getMenuConfigs().find(c => c.id === id);
};

export const saveMenuConfigs = (configs: MenuConfig[]) => {
  localStorage.setItem(STORAGE_KEYS.MENU_CONFIGS, JSON.stringify(configs));
};

export const getComfyServers = (): ComfyServer[] => {
  const data = localStorage.getItem(STORAGE_KEYS.COMFY_SERVERS);
  if (data) return JSON.parse(data);
  return [{ id: 'srv_1', name: '默认服务器', url: '', allowedDepartments: [], isEnabled: true }];
};

export const saveComfyServers = (servers: ComfyServer[]) => {
  localStorage.setItem(STORAGE_KEYS.COMFY_SERVERS, JSON.stringify(servers));
};

export const getAvailableServerUrl = (): string => {
  const servers = getComfyServers().filter(s => s.isEnabled && s.url);
  if (servers.length === 0) {
    throw new Error("API 地址未配置。请进入“后台管理-服务器配置”，填写您的 ComfyUI 地址。");
  }
  const randomServer = servers[Math.floor(Math.random() * servers.length)];
  return randomServer.url.replace(/\/$/, '');
};

/**
 * 增强型连接检查
 * 区分“无法访问”和“跨域拒绝”
 */
export const checkComfyConnection = async (url: string): Promise<boolean> => {
  const normalizedUrl = url.replace(/\/$/, '');
  try {
    // 尝试正常跨域访问
    const res = await fetch(`${normalizedUrl}/system_stats`, { mode: 'cors' });
    return res.ok;
  } catch (e) {
    // 如果失败，尝试 no-cors 探测。no-cors 即使被拦截也会完成请求
    try {
      await fetch(`${normalizedUrl}/system_stats`, { mode: 'no-cors' });
      // 如果 no-cors 没报错，说明服务器是在线的，只是拒绝了 cross-origin 的数据读取
      console.warn("探测到服务器在线，但跨域(CORS)请求被拒绝。");
      return false;
    } catch (innerError) {
      // 如果 no-cors 也报错，说明服务器彻底无法连接
      return false;
    }
  }
};

// --- History & Social ---

export const getHistory = (): HistoryItem[] => {
  const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
  return data ? JSON.parse(data) : [];
};

export const saveHistoryItem = (item: HistoryItem) => {
  const history = getHistory();
  const updated = [item, ...history].slice(0, 50);
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
};

export const getComments = (): Comment[] => {
  const data = localStorage.getItem(STORAGE_KEYS.COMMENTS);
  return data ? JSON.parse(data) : [];
};

export const saveComment = (comment: Comment) => {
  const comments = getComments();
  const updated = [comment, ...comments];
  localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(updated));
};

export const replyToComment = (parentId: string, reply: Comment) => {
  const comments = getComments();
  const updated = comments.map(c => {
    if (c.id === parentId) return { ...c, replies: [...(c.replies || []), reply] };
    return c;
  });
  localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(updated));
};

export const toggleLikeComment = (id: string, isReply: boolean = false, parentId?: string) => {
  const comments = getComments();
  let updated;
  if (isReply && parentId) {
    updated = comments.map(c => {
      if (c.id === parentId) {
        return { ...c, replies: c.replies.map(r => r.id === id ? { ...r, likes: r.likes + 1 } : r) };
      }
      return c;
    });
  } else {
    updated = comments.map(c => c.id === id ? { ...c, likes: c.likes + 1 } : c);
  }
  localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(updated));
};

// --- Core Generation ---

const uploadImageToComfy = async (baseUrl: string, file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('overwrite', 'true');
  const res = await fetch(`${baseUrl}/upload/image`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error("图片上传失败");
  const data = await res.json();
  return data.name;
};

export const generateWithComfy = async (menuId: string, params: any): Promise<{ imageUrl?: string, images?: string[], textOutput?: string }> => {
  const config = getMenuConfigById(menuId);
  if (!config || !config.isEnabled || !config.workflowId) throw new Error("该功能未配置工作流，请在后台绑定 JSON。");

  const workflow = getWorkflowById(config.workflowId);
  if (!workflow) throw new Error("绑定的工作流数据已丢失。");
  
  const baseUrl = getAvailableServerUrl();
  const apiPayload = JSON.parse(JSON.stringify(workflow.apiJson)); 
  const mappings = config.inputMappings;

  let uploadedFilename = '';
  if (params.image && mappings.imageUpload) {
    uploadedFilename = await uploadImageToComfy(baseUrl, params.image);
  }

  // Value injection
  const inject = (nodeId?: string, field?: string, val?: any) => {
    if (nodeId && field && apiPayload[nodeId]) {
      if (!apiPayload[nodeId].inputs) apiPayload[nodeId].inputs = {};
      apiPayload[nodeId].inputs[field] = val;
    }
  };

  inject(mappings.prompt?.nodeId, mappings.prompt?.field, params.prompt);
  inject(mappings.negativePrompt?.nodeId, mappings.negativePrompt?.field, params.negativePrompt);
  inject(mappings.model?.nodeId, mappings.model?.field, params.model);
  inject(mappings.batchSize?.nodeId, mappings.batchSize?.field, params.batchSize);
  inject(mappings.imageUpload?.nodeId, mappings.imageUpload?.field, uploadedFilename);
  
  if (mappings.aspectRatio) {
    inject(mappings.aspectRatio.widthNodeId, mappings.aspectRatio.widthField, params.width);
    inject(mappings.aspectRatio.heightNodeId, mappings.aspectRatio.heightField, params.height);
  }
  
  // Randomize Seed for nodes that have a 'seed', 'noise_seed' or 'seed_int' input
  // This ensures a new image is generated every time the button is clicked.
  // We iterate through all nodes and find inputs that look like a seed value (number or string-number)
  Object.values(apiPayload).forEach((node: any) => {
    if (node.inputs) {
      for (const key in node.inputs) {
        if (key === 'seed' || key === 'noise_seed' || key === 'seed_int') {
           const val = node.inputs[key];
           // Check if it is a number or a string that looks like a number (and is not an array/link)
           if (typeof val === 'number' || (typeof val === 'string' && /^\d+$/.test(val))) {
             // Generate random safe integer
             const randomSeed = Math.floor(Math.random() * 1000000000000000);
             node.inputs[key] = randomSeed;
           }
        }
      }
    }
  });

  const clientId = `client_${Math.random().toString(36).slice(2, 9)}`;
  
  try {
    const res = await fetch(`${baseUrl}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, prompt: apiPayload }),
      mode: 'cors'
    });

    if (!res.ok) {
      const errorMsg = await res.text();
      throw new Error(`ComfyUI 拒绝任务 (${res.status}): ${errorMsg.slice(0, 100)}`);
    }

    const data = await res.json();
    return await pollResult(baseUrl, data.prompt_id, config.outputNodeId, mappings.textOutput?.nodeId, menuId, params);

  } catch (err: any) {
    if (err.name === 'TypeError') {
      // 捕获网络错误/跨域错误
      throw new Error(`连接超时或跨域错误。\n\n关键修复：虽然您能在浏览器打开，但程序需要服务器授权。请在 ComfyUI 启动脚本中添加：--allow-cors-origin *`);
    }
    throw err;
  }
};

const pollResult = async (baseUrl: string, promptId: string, imageNodeId: string | null, textNodeId: string | undefined, menuId: string, params: any): Promise<any> => {
  let consecutiveErrors = 0;
  for (let i = 0; i < 150; i++) { // 延长到 5 分钟
    await new Promise(r => setTimeout(r, 2000));
    try {
      const hRes = await fetch(`${baseUrl}/history/${promptId}`);
      if (!hRes.ok) {
        consecutiveErrors++;
        if (consecutiveErrors > 10) throw new Error("轮询期间多次无法连接服务器");
        continue;
      }
      consecutiveErrors = 0;
      
      const hData = await hRes.json();
      if (!hData[promptId]) continue;

      const outputs = hData[promptId].outputs;
      const result: any = {};

      let imgOut = imageNodeId ? outputs[imageNodeId] : Object.values(outputs).find((o: any) => o.images);
      
      if (imgOut && imgOut.images && imgOut.images.length > 0) {
        // Collect all images
        const images = imgOut.images.map((img: any) => 
          `${baseUrl}/view?filename=${img.filename}&subfolder=${img.subfolder}&type=${img.type}`
        );
        result.images = images;
        result.imageUrl = images[0]; // Keep primary for compatibility
      }

      if (textNodeId && outputs[textNodeId]) {
        const t = outputs[textNodeId];
        result.textOutput = t.text ? t.text[0] : (t.string ? t.string[0] : JSON.stringify(t));
      }

      if (result.imageUrl || result.textOutput) {
        saveHistoryItem({ id: promptId, imageUrl: result.imageUrl, textOutput: result.textOutput, prompt: params.prompt || 'Art Task', timestamp: Date.now(), width: params.width || 0, height: params.height || 0, menuId });
        return result;
      }
    } catch (e) {
      // 忽略单次网络波动
    }
  }
  throw new Error("生成超时，请检查 ComfyUI 内部队列是否卡住或报错。");
};
