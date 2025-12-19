
import React from 'react';
import { Megaphone, Sparkles } from 'lucide-react';

interface AnnouncementBarProps {
  text: string;
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({ text }) => {
  if (!text) return null;

  return (
    <div className="relative p-[1px] rounded-2xl bg-gradient-to-r from-indigo-500/30 via-violet-500/30 to-indigo-500/30 mb-8 shadow-lg">
      <div className="bg-[#151520]/80 backdrop-blur-md rounded-[15px] py-3 px-5 flex items-center overflow-hidden">
        <div className="flex items-center gap-3 text-indigo-400 shrink-0 z-10 bg-[#151520] pr-6 border-r border-white/5">
          <div className="relative">
            <Megaphone className="w-4 h-4" />
            <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-40 animate-pulse"></div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">系统公告</span>
        </div>
        
        <div className="flex-1 overflow-hidden relative h-6 mx-4">
           {/* Animation duration 60s for slow scrolling. Start at translateX(0) to be visible immediately. */}
           <div className="absolute whitespace-nowrap animate-scroll text-sm font-medium text-slate-200 top-1/2 -translate-y-1/2 left-0 flex items-center" style={{ animation: 'scroll-left 60s linear infinite' }}>
              <span className="flex items-center gap-2">{text} <Sparkles className="w-3 h-3 text-yellow-500/50"/></span>
              <span className="mx-12 opacity-20 text-lg">✦</span>
              <span className="flex items-center gap-2">{text} <Sparkles className="w-3 h-3 text-yellow-500/50"/></span>
              <span className="mx-12 opacity-20 text-lg">✦</span>
              <span className="flex items-center gap-2">{text} <Sparkles className="w-3 h-3 text-yellow-500/50"/></span>
           </div>
        </div>
      </div>
      <style>{`
        @keyframes scroll-left {
          0% { transform: translateY(-50%) translateX(0%); }
          100% { transform: translateY(-50%) translateX(-100%); }
        }
      `}</style>
    </div>
  );
};
