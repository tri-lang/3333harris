
import React, { useState, useEffect, useCallback } from 'react';
import { HomeCarousel } from './components/HomeCarousel';
import { Controls } from './components/Controls';
import { AnalysisPanel } from './components/AnalysisPanel';
import { Sidebar } from './components/Sidebar';
import { TextToImagePage } from './components/TextToImagePage';
import { HistoryPage } from './components/HistoryPage';
import { GuestbookPage } from './components/GuestbookPage'; 
import { AuthModal } from './components/AuthModal';
import { AdminDashboard } from './components/AdminDashboard';
import { ProfilePage } from './components/ProfilePage';
import { UploadedImage, ProcessingOptions, ImageFormat, AnalysisResult, UserProfile, SiteSettings } from './types';
import { readFileAsDataURL, loadImage, processImage, formatBytes } from './services/imageUtils';
import { analyzeImageWithGemini } from './services/geminiService';
import { Download, RefreshCw, AlertCircle, Image as ImageIcon, MessageSquare, User, QrCode, Sparkles, Zap } from 'lucide-react';
import { getMenuConfigById, getSiteSettings } from './services/comfyService';
import { AnnouncementBar } from './components/AnnouncementBar';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState('home');

  const [user, setUser] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdminQr, setShowAdminQr] = useState(false);
  
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('smartpic_current_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    const loadSettings = () => {
      setSiteSettings(getSiteSettings());
    };
    loadSettings();
    // Poll for settings changes (e.g. background update)
    const interval = setInterval(loadSettings, 2000);
    return () => clearInterval(interval);
  }, [activePage]);

  const handleLoginSuccess = (userData: UserProfile) => {
    setUser(userData);
    localStorage.setItem('smartpic_current_user', JSON.stringify(userData));
  };

  const handleUpdateUser = (updated: UserProfile) => {
    setUser(updated);
    localStorage.setItem('smartpic_current_user', JSON.stringify(updated));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('smartpic_current_user');
    if (activePage === 'admin' || activePage === 'profile') {
      setActivePage('home');
    }
  };

  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [processedImage, setProcessedImage] = useState<{ url: string; size: number; width: number; height: number; blob: Blob } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingOptions, setProcessingOptions] = useState<ProcessingOptions>({
    quality: 0.8,
    scale: 1,
    format: ImageFormat.JPEG,
    maxWidth: 0
  });

  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasApiKey = !!process.env.API_KEY;

  const handleImageSelected = async (file: File) => {
    try {
      setError(null);
      const url = await readFileAsDataURL(file);
      const img = await loadImage(url);
      
      setUploadedImage({
        file,
        previewUrl: url,
        originalWidth: img.width,
        originalHeight: img.height,
        originalSize: file.size
      });

      setAnalysisResult(null);
      triggerProcessing(img, { ...processingOptions, maxWidth: 0 }); 
      
    } catch (err) {
      setError("Failed to load image.");
      console.error(err);
    }
  };

  const triggerProcessing = useCallback(async (img: HTMLImageElement, options: ProcessingOptions) => {
    setIsProcessing(true);
    try {
      const result = await processImage(img, options);
      setProcessedImage({
        url: result.dataUrl,
        size: result.size,
        width: result.width,
        height: result.height,
        blob: result.blob
      });
    } catch (err) {
      console.error(err);
      setError("Error processing image.");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  useEffect(() => {
    if (uploadedImage) {
      loadImage(uploadedImage.previewUrl).then(img => {
        triggerProcessing(img, processingOptions);
      });
    }
  }, [processingOptions, uploadedImage, triggerProcessing]);

  const handleAnalyze = async () => {
    if (!uploadedImage) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeImageWithGemini(uploadedImage.previewUrl, uploadedImage.file.type);
      setAnalysisResult(result);
    } catch (err) {
      console.error(err);
      setError("Failed to analyze image with AI. Check API Key or try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownload = () => {
    if (!processedImage) return;
    const link = document.createElement('a');
    link.href = processedImage.url;
    const ext = processingOptions.format.split('/')[1];
    link.download = `smartpic-processed.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setUploadedImage(null);
    setProcessedImage(null);
    setAnalysisResult(null);
    setError(null);
  };

  const handleFeatureClick = (target?: string) => {
    if(!target || target === 'upload') {
      document.getElementById('home-upload-trigger')?.click();
    } else {
      setActivePage(target);
    }
  };

  const renderContent = () => {
    if (activePage === 'home') {
       const homeSettings = siteSettings?.homePage;

       return (
        <div className="flex-1 overflow-y-auto bg-transparent scroll-smooth relative z-10">
          <div className="p-8">
            <div className="max-w-7xl mx-auto mb-10">
              <div className="flex items-center gap-3 mb-2">
                 <div className="w-1 h-8 bg-indigo-500 rounded-full"></div>
                 <h1 className="text-3xl font-black text-white tracking-tight">{homeSettings?.mainTitle || "图像处理工作室"}</h1>
              </div>
              <p className="text-slate-400 font-medium ml-4">{homeSettings?.subTitle || "专业的在线图片压缩、格式转换与 AI 分析工具。"}</p>
            </div>

            <div className="max-w-7xl mx-auto">
              {error && (
                <div className="mb-6 bg-red-900/40 backdrop-blur-md border border-red-500/30 text-red-100 px-6 py-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <p className="font-medium">{error}</p>
                  <button onClick={() => setError(null)} className="ml-auto text-sm bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg transition-colors">知道了</button>
                </div>
              )}

              {!uploadedImage ? (
                <div className="space-y-10">
                  <input type="file" id="home-upload-trigger" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageSelected(e.target.files[0])} />

                  <HomeCarousel 
                    slides={homeSettings?.slides || []}
                    onNavigate={setActivePage} 
                    onImageSelected={handleImageSelected} 
                  />
                  
                  <AnnouncementBar text={siteSettings?.announcement || ""} />
                  
                  <div>
                    <div className="flex items-center justify-center gap-3 mb-8">
                       <div className="h-[1px] w-12 bg-white/10"></div>
                       <h2 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em]">发现更多功能</h2>
                       <div className="h-[1px] w-12 bg-white/10"></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(homeSettings?.features || []).map((item, i) => (
                          <div 
                            key={i} 
                            onClick={() => handleFeatureClick(item.linkTarget)}
                            className="group relative overflow-hidden rounded-[2rem] bg-white/5 backdrop-blur-xl border border-white/5 hover:border-indigo-500/30 transition-all p-8 cursor-pointer hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10"
                          >
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.color} opacity-20 blur-3xl rounded-full -mr-12 -mt-12 group-hover:opacity-40 transition-opacity`}></div>
                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6 shadow-lg rotate-3 group-hover:rotate-0 transition-transform`}>
                               <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-black text-white text-xl mb-3 relative z-10 tracking-tight">{item.title}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed relative z-10 font-medium">{item.desc}</p>
                            <div className="mt-6 flex items-center gap-2 text-indigo-400 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                               立即开启 <RefreshCw className="w-3 h-3" />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/5 overflow-hidden">
                      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                        <h2 className="font-bold text-white flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                          处理中心
                        </h2>
                        <button onClick={handleReset} className="text-xs font-bold text-slate-400 hover:text-red-400 flex items-center gap-2 transition-all hover:bg-red-500/10 px-4 py-2 rounded-xl">
                          <RefreshCw className="w-3 h-3" /> 重置画布
                        </button>
                      </div>
                      
                      <div className="relative p-8 min-h-[500px] flex items-center justify-center bg-black/20">
                        {processedImage ? (
                          <img src={processedImage.url} alt="Processed" className="max-w-full max-h-[650px] object-contain shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-2xl animate-in zoom-in-95 duration-500" />
                        ) : (
                          <div className="flex flex-col items-center gap-4">
                             <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                             <p className="text-indigo-400 font-bold animate-pulse">正在施展魔法...</p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 divide-x divide-white/5 border-t border-white/5 bg-black/20">
                        <div className="p-6 text-center">
                            <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black mb-2">原始尺寸</p>
                            <p className="text-xl font-black text-white">{uploadedImage.originalWidth} <span className="text-slate-600">×</span> {uploadedImage.originalHeight}</p>
                            <p className="text-xs text-slate-400 font-bold mt-1">{formatBytes(uploadedImage.originalSize)}</p>
                        </div>
                        <div className="p-6 text-center bg-indigo-500/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 blur-3xl rounded-full"></div>
                            <p className="text-[10px] text-indigo-400 uppercase tracking-[0.2em] font-black mb-2">输出结果</p>
                            {processedImage ? (
                              <>
                                <p className="text-xl font-black text-white">{processedImage.width} <span className="text-slate-600">×</span> {processedImage.height}</p>
                                <div className="flex items-center justify-center gap-2 mt-1">
                                  <span className="text-sm text-indigo-300 font-black">{formatBytes(processedImage.size)}</span>
                                  <span className="text-[10px] font-black text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full ring-1 ring-green-500/30">
                                    -{Math.round((1 - processedImage.size / uploadedImage.originalSize) * 100)}%
                                  </span>
                                </div>
                              </>
                            ) : (
                              <p className="text-sm text-slate-600 font-bold">计算中...</p>
                            )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-indigo-600/10 backdrop-blur-md rounded-3xl border border-indigo-500/20 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-6 z-20 shadow-2xl">
                        <div className="flex items-center gap-3 ml-2">
                           <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                           <span className="text-xs font-black text-indigo-300 uppercase tracking-widest">任务就绪</span>
                        </div>
                        <button onClick={handleDownload} disabled={!processedImage} className="w-full sm:w-auto flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-[1.25rem] font-black text-sm shadow-xl shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50 hover:-translate-y-1">
                          <Download className="w-5 h-5" /> 立即下载作品
                        </button>
                    </div>
                  </div>
                  <div className="lg:col-span-4 space-y-6">
                    <Controls options={processingOptions} onOptionsChange={setProcessingOptions} isProcessing={isProcessing}/>
                    <AnalysisPanel result={analysisResult} isLoading={isAnalyzing} onAnalyze={handleAnalyze} hasApiKey={hasApiKey}/>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-20 border-t border-white/5 py-10 flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto px-4 gap-6">
               <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-indigo-400" />
                    <span className="font-black text-white tracking-widest uppercase text-xs">{siteSettings?.title || '灵鹊AI'}</span>
                  </div>
                  <div className="h-4 w-[1px] bg-white/10 hidden sm:block"></div>
                  <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest hidden sm:block">Professional Creative Operations Studio</p>
               </div>
               <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setShowAdminQr(true)}
                    className="group flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/5 hover:bg-indigo-600 text-slate-400 hover:text-white transition-all duration-300 text-[10px] font-black uppercase tracking-widest border border-white/5 shadow-xl"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> 
                    联系管理员
                  </button>
               </div>
            </div>
          </div>
        </div>
       );
    } 
    
    if (activePage === 'admin' && (user?.role === 'super_admin' || user?.role === 'admin')) {
      return <AdminDashboard user={user} />;
    }

    if (activePage === 'profile' && user) {
      return <ProfilePage user={user} onUpdateUser={handleUpdateUser} />;
    }

    if (activePage === 'history') {
      return <HistoryPage />;
    }

    if (activePage === 'guestbook') {
      return <GuestbookPage user={user} onLoginClick={() => setShowAuthModal(true)} />;
    }

    const config = getMenuConfigById(activePage);
    if (config) {
       return <TextToImagePage menuId={activePage} user={user} onLoginClick={() => setShowAuthModal(true)} />;
    }

    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 bg-transparent relative z-10">
         <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-white/10 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-600">正在开启传送门...</p>
         </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-transparent text-slate-200 relative">
      <Sidebar 
        activeItem={activePage} 
        onNavigate={setActivePage} 
        user={user}
        onLoginClick={() => setShowAuthModal(true)}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        {renderContent()}
      </div>
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {showAdminQr && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4 animate-in fade-in zoom-in-95 duration-300" onClick={() => setShowAdminQr(false)}>
            <div className="bg-[#1e1e2d]/90 p-8 rounded-[2.5rem] max-w-sm w-full text-center shadow-[0_30px_100px_rgba(0,0,0,0.5)] border border-white/10" onClick={e => e.stopPropagation()}>
               <div className="w-16 h-1 bg-white/10 rounded-full mx-auto mb-8"></div>
               <h3 className="text-2xl font-black text-white mb-6 tracking-tight">专属客户服务</h3>
               <div className="relative p-4 bg-white rounded-3xl mx-auto mb-6 shadow-2xl">
                  <div className="absolute inset-0 bg-indigo-500/10 blur-2xl -z-10"></div>
                  {siteSettings?.adminQrCodeUrl ? (
                    <img src={siteSettings.adminQrCodeUrl} alt="Admin QR" className="w-full aspect-square object-contain rounded-xl" />
                  ) : (
                    <div className="w-full aspect-square bg-slate-50 flex items-center justify-center rounded-xl">
                       <QrCode className="w-16 h-16 text-slate-200" />
                    </div>
                  )}
               </div>
               <p className="text-slate-400 text-sm font-medium mb-8 px-4 leading-relaxed">扫描二维码，一键对接管理员<br/><span className="text-indigo-400">为您提供全方位技术支持</span></p>
               <button onClick={() => setShowAdminQr(false)} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black transition-all shadow-xl shadow-indigo-600/30 active:scale-95">返回中心</button>
            </div>
         </div>
      )}
    </div>
  );
};

export default App;
