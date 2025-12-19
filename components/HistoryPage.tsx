
import React, { useEffect, useState } from 'react';
import { getHistory } from '../services/comfyService';
import { HistoryItem } from '../types';
import { Clock, Download, X, Maximize, ZoomIn } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const formatDate = (ts: number) => new Date(ts).toLocaleString();

  const handleDownload = (e: React.MouseEvent, item: HistoryItem) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = item.imageUrl;
    link.download = `smartpic_history_${item.timestamp}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-transparent p-8 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">创意历史存档</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs ml-1">Gallery of Past Generations</p>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-32 bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-2xl">
            <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-indigo-400" />
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">暂无存档，快去创造您的第一份杰作吧</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {history.map((item) => (
              <div 
                key={item.id} 
                className="group relative bg-white/5 backdrop-blur-md rounded-[1.5rem] border border-white/5 overflow-hidden aspect-square cursor-pointer hover:border-indigo-500 transition-all shadow-xl hover:-translate-y-1"
                onClick={() => setSelectedItem(item)}
              >
                <img 
                  src={item.imageUrl} 
                  alt={item.prompt} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-5">
                   <p className="text-xs text-white font-medium line-clamp-2 mb-3">{item.prompt}</p>
                   <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-300">
                     <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                     <button onClick={(e) => handleDownload(e, item)} className="p-2 bg-white/10 hover:bg-indigo-600 rounded-full text-white transition-colors shadow-lg"><Download className="w-3 h-3" /></button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-3xl p-4 animate-in fade-in duration-300" onClick={() => setSelectedItem(null)}>
           <button onClick={() => setSelectedItem(null)} className="absolute top-8 right-8 p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all z-10"><X className="w-8 h-8" /></button>
           <div className="max-w-6xl w-full h-[85vh] flex flex-col md:flex-row gap-8" onClick={e => e.stopPropagation()}>
              <div className="flex-1 flex items-center justify-center bg-black/40 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl relative group">
                 <img src={selectedItem.imageUrl} alt="Full view" className="max-w-full max-h-full object-contain p-4" />
              </div>
              <div className="w-full md:w-96 bg-[#1e1e2d]/90 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-10 flex flex-col shadow-2xl">
                 <div className="mb-10"><h3 className="text-2xl font-black text-white tracking-tight">作品详情</h3><p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Creation Meta-data</p></div>
                 <div className="space-y-8 flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <div className="space-y-3"><label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">提示词内容</label><p className="text-sm text-slate-300 bg-white/5 p-5 rounded-2xl border border-white/5 leading-relaxed font-medium">{selectedItem.prompt}</p></div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">生成时间</label><p className="text-xs text-white font-bold">{formatDate(selectedItem.timestamp)}</p></div>
                      {selectedItem.width > 0 && (<div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">分辨率</label><p className="text-xs text-white font-mono font-bold">{selectedItem.width} × {selectedItem.height}</p></div>)}
                    </div>
                 </div>
                 <button onClick={(e) => handleDownload(e, selectedItem)} className="w-full mt-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/30 transition-all active:scale-[0.98] uppercase tracking-widest text-xs"><Download className="w-5 h-5" /> 下载超清原图</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
