import React from 'react';
import { AnalysisResult } from '../types';
import { Sparkles, Tag, Palette } from 'lucide-react';

interface AnalysisPanelProps {
  result: AnalysisResult | null;
  isLoading: boolean;
  onAnalyze: () => void;
  hasApiKey: boolean;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ result, isLoading, onAnalyze, hasApiKey }) => {
  if (!hasApiKey) {
    return (
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-yellow-400" />
          <h2 className="font-semibold text-lg">AI Smart Analysis</h2>
        </div>
        <p className="text-slate-300 text-sm mb-4">
          Enable smart image detection to automatically generate captions, tags, and color palettes using Gemini AI.
        </p>
        <div className="text-xs bg-white/10 p-3 rounded border border-white/20">
          API Key required in environment variables to use this feature.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-xl p-6 shadow-lg h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-400" />
          <h2 className="font-semibold text-lg">AI Smart Analysis</h2>
        </div>
        {!result && !isLoading && (
          <button
            onClick={onAnalyze}
            className="px-4 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-xs font-medium transition-colors"
          >
            Analyze Now
          </button>
        )}
      </div>

      {isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 space-y-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-t-indigo-400 rounded-full animate-spin"></div>
          </div>
          <p className="text-indigo-200 text-sm animate-pulse">Analyzing pixels...</p>
        </div>
      )}

      {!result && !isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
           <p className="text-sm">Click "Analyze Now" to let AI describe this image.</p>
        </div>
      )}

      {result && !isLoading && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
            <h3 className="text-xs uppercase tracking-wider text-indigo-300 font-bold mb-2">Description</h3>
            <p className="text-sm leading-relaxed text-slate-100 bg-white/5 p-3 rounded-lg border border-white/10">
              {result.description}
            </p>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-wider text-indigo-300 font-bold mb-2 flex items-center gap-1">
              <Tag className="w-3 h-3" /> Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {result.tags.map((tag) => (
                <span key={tag} className="px-2 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded text-xs text-indigo-200">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-wider text-indigo-300 font-bold mb-2 flex items-center gap-1">
              <Palette className="w-3 h-3" /> Palette
            </h3>
            <div className="flex gap-2">
              {result.mainColors.map((color) => (
                <div key={color} className="group relative">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-white/20 shadow-sm cursor-pointer hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  ></div>
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {color}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
