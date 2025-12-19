import React, { useState, useRef } from 'react';
import { User, Shirt, Upload, AlertCircle, Sparkles, Image as ImageIcon, Download } from 'lucide-react';
import { readFileAsDataURL } from '../services/imageUtils';
import { generateOutfitChange } from '../services/geminiService';

export const OutfitChangePage: React.FC = () => {
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [clothingImage, setClothingImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<'V1' | 'V2'>('V1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (file: File, type: 'model' | 'clothing') => {
    try {
      const url = await readFileAsDataURL(file);
      if (type === 'model') {
        setModelImage(url);
      } else {
        setClothingImage(url);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load image");
    }
  };

  const handleGenerate = async () => {
    if (!modelImage || !clothingImage) {
      setError("请同时上传模特图片和服装图片");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResultImage(null);

    try {
      const result = await generateOutfitChange(modelImage, clothingImage, prompt, model);
      setResultImage(result);
    } catch (err: any) {
      setError(err.message || "换装失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleDownload = () => {
    if (resultImage) {
      const link = document.createElement('a');
      link.href = resultImage;
      link.download = `outfit-change-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 h-full bg-[#0f1115]">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">一键换装</h1>
          <p className="text-slate-400 text-sm">
            利用AI的强大能力，为模特轻松换装，实现完美的服装搭配效果
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
          
          {/* Left Column: Inputs */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Upload Area Row */}
            <div className="grid grid-cols-2 gap-4">
              <UploadBox 
                type="model" 
                image={modelImage} 
                onUpload={(f) => handleImageUpload(f, 'model')} 
              />
              <UploadBox 
                type="clothing" 
                image={clothingImage} 
                onUpload={(f) => handleImageUpload(f, 'clothing')} 
              />
            </div>

            {/* Prompt Input */}
            <div className="bg-[#1e1e2d] border border-white/5 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4 text-indigo-400 font-medium text-sm">
                 <Sparkles className="w-4 h-4" /> 提示词
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="示例：年轻女模特穿上这件优雅的白色连衣裙，展现出时尚优雅的气质"
                className="w-full h-24 bg-[#0f1115] border border-white/10 rounded-lg p-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none text-sm"
              />
            </div>

            {/* Model Selection */}
            <div className="bg-[#1e1e2d] border border-white/5 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4 text-orange-400 font-medium text-sm">
                 <BoxIcon className="w-4 h-4" /> 选择生图模型
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setModel('V1')}
                  className={`py-3 rounded-lg font-medium border transition-all text-sm ${
                    model === 'V1' 
                      ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10' 
                      : 'border-white/10 text-slate-400 bg-[#0f1115] hover:bg-white/5'
                  }`}
                >
                  V1
                </button>
                <button
                   onClick={() => setModel('V2')}
                   className={`py-3 rounded-lg font-medium border transition-all text-sm ${
                    model === 'V2' 
                      ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10' 
                      : 'border-white/10 text-slate-400 bg-[#0f1115] hover:bg-white/5'
                  }`}
                >
                  V2
                </button>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !modelImage || !clothingImage}
              className={`
                w-full py-4 rounded-xl font-bold text-white text-sm shadow-lg flex items-center justify-center gap-2 transition-all
                ${isGenerating || !modelImage || !clothingImage
                  ? 'bg-slate-700 cursor-not-allowed text-slate-400' 
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-900/20 active:scale-[0.99]'
                }
              `}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  AI 换装中...
                </>
              ) : !modelImage || !clothingImage ? (
                "请先上传图片 (5点)"
              ) : (
                "开始换装 (5点)"
              )}
            </button>

             {error && (
              <div className="bg-red-900/20 border border-red-500/30 text-red-200 p-3 rounded-lg flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>

          {/* Right Column: Result */}
          <div className="lg:col-span-5 flex flex-col h-full min-h-[500px]">
             <div className="bg-[#1e1e2d] border border-white/5 rounded-xl p-1 flex flex-col h-full">
                <div className="flex-1 bg-[#0f1115] rounded-lg border border-dashed border-white/10 flex items-center justify-center relative overflow-hidden group">
                  {resultImage ? (
                    <>
                      <img 
                        src={resultImage} 
                        alt="Outfit Change Result" 
                        className="w-full h-full object-contain"
                      />
                       <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={handleDownload}
                          className="bg-white text-slate-900 px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                        >
                          <Download className="w-4 h-4" /> 下载结果
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-8 max-w-xs">
                      <div className="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <ImageIcon className="w-8 h-8 text-slate-500" />
                      </div>
                      <h3 className="text-slate-400 font-medium mb-1">还没有换装结果</h3>
                      <p className="text-slate-600 text-xs">
                        上传模特和服装图片，然后点击换装按钮
                      </p>
                    </div>
                  )}
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const UploadBox = ({ type, image, onUpload }: { type: 'model' | 'clothing', image: string | null, onUpload: (file: File) => void }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) onUpload(e.dataTransfer.files[0]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) onUpload(e.target.files[0]);
  };

  return (
    <div 
      className={`
        relative h-64 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all p-4 text-center overflow-hidden
        ${isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 bg-[#1e1e2d] hover:border-white/20 hover:bg-white/5'}
      `}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input type="file" ref={inputRef} onChange={handleChange} accept="image/*" className="hidden" />
      
      {image ? (
        <img src={image} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <>
          <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center mb-3">
             {type === 'model' ? <User className="w-6 h-6 text-indigo-400" /> : <Shirt className="w-6 h-6 text-indigo-400" />}
          </div>
          <h3 className="text-white font-medium text-sm mb-1">
            {type === 'model' ? '上传模特图片' : '上传服装图片'}
          </h3>
          <p className="text-slate-500 text-xs mb-2">拖拽图片到此处或点击上传</p>
          <p className="text-slate-600 text-[10px]">支持 JPG、PNG 格式，最大 10MB</p>
        </>
      )}
      
      {/* Overlay to change image */}
      {image && (
        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
           <span className="text-white text-xs font-medium bg-black/50 px-3 py-1 rounded-full">点击更换</span>
        </div>
      )}
    </div>
  );
}

const BoxIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
);
