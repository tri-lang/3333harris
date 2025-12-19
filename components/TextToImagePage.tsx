
import React, { useState, useEffect, useRef } from 'react';
import { Wand2, Image as ImageIcon, Sparkles, AlertCircle, Download, Layout as LayoutIcon, Box as BoxIcon, Expand as ExpandIcon, Upload, Hash, Plus, Minus, Lock, FileText, Clipboard, ZoomIn, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { generateWithComfy, getMenuConfigById } from '../services/comfyService';
import { ModelPreset, MenuConfig, LayoutModule, UserProfile } from '../types';
import { readFileAsDataURL } from '../services/imageUtils';

interface TextToImagePageProps {
  menuId: string;
  user: UserProfile | null;
  onLoginClick: () => void;
}

export const TextToImagePage: React.FC<TextToImagePageProps> = ({ menuId, user, onLoginClick }) => {
  const [config, setConfig] = useState<MenuConfig | undefined>(undefined);
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [model, setModel] = useState<string>(''); 
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [batchSize, setBatchSize] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Image handling state
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const [textOutput, setTextOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadedConfig = getMenuConfigById(menuId);
    setConfig(loadedConfig);
    setPrompt('');
    setNegativePrompt('');
    setUploadedImage(null);
    setUploadedImagePreview(null);
    setGeneratedImages([]);
    setSelectedImageIndex(0);
    setTextOutput(null);
    setError(null);
    setBatchSize(1);
    if (loadedConfig?.modelPresets && loadedConfig.modelPresets.length > 0) {
      setModel(loadedConfig.modelPresets[0].value);
    }
  }, [menuId]);

  // Corrected aspect ratios to match standard resolutions
  const aspectRatios = [
    { label: '1:1', width: 1024, height: 1024 },
    { label: '3:4', width: 864, height: 1152 },
    { label: '4:3', width: 1152, height: 864 },
    { label: '16:9', width: 1280, height: 720 },
    { label: '9:16', width: 720, height: 1280 },
  ];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedImage(file);
      const url = await readFileAsDataURL(file);
      setUploadedImagePreview(url);
    }
  };

  const handleGenerate = async () => {
    if (!user) { onLoginClick(); return; }
    if (getModule('prompt')?.isEnabled && !prompt.trim()) { setError("请输入描述内容"); return; }
    if (getModule('imageUpload')?.isEnabled && !uploadedImage) { setError("请上传参考图"); return; }
    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);
    setSelectedImageIndex(0);
    setTextOutput(null);
    const selectedRatio = aspectRatios.find(r => r.label === aspectRatio) || aspectRatios[0];
    try {
      const result = await generateWithComfy(menuId, {
        prompt, 
        negativePrompt, 
        width: selectedRatio.width, 
        height: selectedRatio.height,
        model: model, 
        image: uploadedImage || undefined, 
        batchSize: batchSize
      });
      
      if (result.images && result.images.length > 0) {
        setGeneratedImages(result.images);
      } else if (result.imageUrl) {
        setGeneratedImages([result.imageUrl]);
      }

      if (result.textOutput) setTextOutput(result.textOutput);
    } catch (err: any) { setError(err.message || "生成失败，请检查配置或重试"); } finally { setIsGenerating(false); }
  };

  const handleDownload = (imageUrl: string) => {
    if (imageUrl) {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `art-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('已复制到剪贴板');
  };

  const getModule = (id: string) => config?.layout?.modules?.find(m => m.id === id && m.isEnabled);
  if (!config) return <div className="p-8 text-white font-black uppercase tracking-widest text-xs">Initializing Session...</div>;

  const activeImage = generatedImages[selectedImageIndex];

  return (
    <div className="flex-1 overflow-y-auto p-8 h-full bg-transparent animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2"><div className="w-1 h-8 bg-indigo-500 rounded-full shadow-glow"></div><h1 className="text-3xl font-black text-white tracking-tight">{config.pageTitle || config.label}</h1></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs ml-4">{config.pageDesc || 'Creative Intelligence Studio'}</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0 pb-10">
          
          {/* LEFT CONFIGURATION COLUMN */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {getModule('imageUpload') && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6">
                <div className="flex items-center gap-2 mb-4 text-[10px] font-black uppercase tracking-widest text-pink-400"><Upload className="w-4 h-4" /> {getModule('imageUpload')?.label || 'IMAGE REFERENCE'}</div>
                <div className="border-2 border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/50 hover:bg-white/5 transition-all relative overflow-hidden h-56" onClick={() => fileInputRef.current?.click()}>
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                  {uploadedImagePreview ? <img src={uploadedImagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-contain bg-black/50" /> : <><Upload className="w-8 h-8 text-slate-700 mb-2" /><p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">DRAG & DROP REFERENCE</p></>}
                </div>
              </div>
            )}
            {getModule('prompt') && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6">
                <div className="flex items-center gap-2 mb-4 text-[10px] font-black uppercase tracking-widest text-indigo-400"><LayoutIcon className="w-4 h-4" /> {getModule('prompt')?.label || 'PROMPT'}</div>
                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="描述您想生成的画面..." className="w-full h-32 bg-black/20 border border-white/5 rounded-2xl p-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all resize-none text-sm font-medium" />
              </div>
            )}
            {getModule('negativePrompt') && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6">
                <div className="flex items-center gap-2 mb-4 text-[10px] font-black uppercase tracking-widest text-slate-500"><LayoutIcon className="w-4 h-4" /> {getModule('negativePrompt')?.label || 'NEGATIVE PROMPT'}</div>
                <textarea value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} placeholder="不希望出现的内容..." className="w-full h-20 bg-black/20 border border-white/5 rounded-2xl p-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all resize-none text-xs font-medium" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-6">
              {getModule('model') && (
                <div className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 col-span-2">
                  <div className="flex items-center gap-2 mb-4 text-[10px] font-black uppercase tracking-widest text-orange-400"><BoxIcon className="w-4 h-4" /> {getModule('model')?.label || 'MODEL'}</div>
                  <div className="flex flex-wrap gap-2">
                    {config.modelPresets && config.modelPresets.length > 0 ? (
                      config.modelPresets.map((preset) => (
                        <button 
                          key={preset.id} 
                          onClick={() => setModel(preset.value)} 
                          className={`py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${model === preset.value ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10' : 'border-white/5 text-slate-500 bg-black/20 hover:bg-white/5'}`}
                        >
                          {preset.name}
                        </button>
                      ))
                    ) : (
                      <p className="text-[10px] text-slate-700 font-black uppercase tracking-widest">No models configured</p>
                    )}
                  </div>
                </div>
              )}
              {getModule('aspectRatio') && (
                <div className={`${getModule('batchSize') ? 'col-span-1' : 'col-span-2'} bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6`}>
                   <div className="flex items-center gap-2 mb-4 text-[10px] font-black uppercase tracking-widest text-blue-400"><ExpandIcon className="w-4 h-4" /> {getModule('aspectRatio')?.label || 'RATIO'}</div>
                   <div className="flex flex-wrap gap-2">{aspectRatios.map((ratio) => <button key={ratio.label} onClick={() => setAspectRatio(ratio.label)} className={`p-2 rounded-xl border transition-all ${aspectRatio === ratio.label ? 'border-indigo-500 bg-indigo-500/10 text-white' : 'border-white/5 bg-black/20 text-slate-500'}`}><span className="text-[10px] font-black">{ratio.label}</span></button>)}</div>
                </div>
              )}
              {getModule('batchSize') && (
                <div className="col-span-1 bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6">
                   <div className="flex items-center gap-2 mb-4 text-[10px] font-black uppercase tracking-widest text-green-400"><Hash className="w-4 h-4" /> {getModule('batchSize')?.label || 'BATCH'}</div>
                   <div className="flex items-center gap-4 bg-black/20 rounded-xl p-2 border border-white/5 justify-center"><button onClick={() => setBatchSize(Math.max(1, batchSize - 1))} className="p-1 hover:text-white text-slate-600"><Minus className="w-4 h-4" /></button><span className="font-black text-lg w-8 text-center text-white">{batchSize}</span><button onClick={() => setBatchSize(Math.min(4, batchSize + 1))} className="p-1 hover:text-white text-slate-600"><Plus className="w-4 h-4" /></button></div>
                </div>
              )}
            </div>
            <button onClick={handleGenerate} disabled={isGenerating} className={`mt-4 w-full py-5 rounded-[1.5rem] font-black text-white text-sm uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 transition-all ${isGenerating ? 'bg-indigo-900/40 cursor-wait opacity-50' : user ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30 active:scale-[0.98]' : 'bg-slate-800'}`}>{isGenerating ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> 生成中，请稍后...</> : user ? <><Sparkles className="w-5 h-5 text-yellow-300 fill-current shadow-glow" /> 立即开启生成</> : <><Lock className="w-5 h-5 text-slate-500" /> 请先登录</>}</button>
            {error && <div className="bg-red-900/40 border border-red-500/20 text-red-200 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold animate-in slide-in-from-bottom-2"><AlertCircle className="w-4 h-4" />{error}</div>}
          </div>

          {/* RIGHT RESULT COLUMN */}
          <div className="lg:col-span-7 flex flex-col h-full min-h-[500px] gap-6">
            
            {/* Image Canvas & Gallery */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 flex flex-col flex-1 shadow-2xl relative">
              <div className="flex items-center gap-3 mb-6 text-[10px] font-black uppercase tracking-widest text-purple-400"><ImageIcon className="w-5 h-5" /> 生成结果</div>
              
              <div className="flex-1 bg-black/40 rounded-3xl border border-dashed border-white/5 flex flex-col items-center justify-center relative overflow-hidden group shadow-inner min-h-[400px]">
                {activeImage ? (
                  <>
                     <div 
                       className="relative w-full h-full flex items-center justify-center cursor-zoom-in p-4"
                       onClick={() => setIsLightboxOpen(true)}
                     >
                       <img src={activeImage} alt="Generated" className="w-full h-full object-contain animate-in zoom-in-95 duration-500" />
                       <div className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                         <ZoomIn className="w-5 h-5" />
                       </div>
                     </div>
                  </>
                ) : (
                  <div className="text-center p-8">
                    <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl"><ImageIcon className="w-10 h-10 text-slate-800" /></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">Awaiting Generation...</p>
                  </div>
                )}
              </div>

              {/* Thumbnails Row (Only if multiple images) */}
              {generatedImages.length > 1 && (
                <div className="mt-6 flex gap-3 overflow-x-auto pb-2 px-1 custom-scrollbar">
                  {generatedImages.map((img, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${selectedImageIndex === idx ? 'border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                      <img src={img} className="w-full h-full object-cover" alt={`thumb-${idx}`} />
                    </div>
                  ))}
                </div>
              )}

              {/* Action Bar (Download) */}
              {activeImage && (
                 <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-end">
                    <button 
                      onClick={() => handleDownload(activeImage)} 
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 hover:-translate-y-1"
                    >
                      <Download className="w-4 h-4" /> 下载当前图片
                    </button>
                 </div>
              )}
            </div>

            {/* Text Output Result */}
            {getModule('textOutput') && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 flex flex-col shadow-2xl animate-in slide-in-from-right-4 duration-500">
                <div className="flex items-center justify-between mb-6">
                   <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-cyan-400"><FileText className="w-5 h-5" /> {getModule('textOutput')?.label || 'TEXT OUTPUT'}</div>
                   {textOutput && (
                     <button onClick={() => copyToClipboard(textOutput)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white"><Clipboard className="w-4 h-4" /></button>
                   )}
                </div>
                <div className="bg-black/40 rounded-2xl border border-white/5 p-5 min-h-[100px] max-h-[200px] overflow-y-auto">
                   {textOutput ? (
                     <p className="text-slate-300 text-sm font-medium leading-relaxed whitespace-pre-wrap">{textOutput}</p>
                   ) : (
                     <p className="text-slate-600 text-xs font-black uppercase tracking-widest text-center mt-8">No text generated yet</p>
                   )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && activeImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300" onClick={() => setIsLightboxOpen(false)}>
           <button className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-20"><X className="w-6 h-6" /></button>
           
           <div className="w-full h-full flex items-center justify-center p-4 md:p-10" onClick={e => e.stopPropagation()}>
             <img src={activeImage} className="max-w-full max-h-full object-contain shadow-2xl" alt="Full view" />
           </div>

           {/* Navigation in Lightbox */}
           {generatedImages.length > 1 && (
             <>
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedImageIndex((prev) => (prev - 1 + generatedImages.length) % generatedImages.length); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-black/50 hover:bg-indigo-600 text-white rounded-full transition-all"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedImageIndex((prev) => (prev + 1) % generatedImages.length); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-black/50 hover:bg-indigo-600 text-white rounded-full transition-all"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
                
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-2 rounded-full text-white text-xs font-bold tracking-widest border border-white/10">
                   {selectedImageIndex + 1} / {generatedImages.length}
                </div>
             </>
           )}
        </div>
      )}
      <style>{`.shadow-glow { filter: drop-shadow(0 0 8px rgba(99, 102, 241, 0.8)); } .custom-scrollbar::-webkit-scrollbar { height: 4px; }`}</style>
    </div>
  );
};
