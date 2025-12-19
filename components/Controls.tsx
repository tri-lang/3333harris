import React from 'react';
import { ImageFormat, ProcessingOptions } from '../types';
import { Settings, Sliders, Hash } from 'lucide-react';

interface ControlsProps {
  options: ProcessingOptions;
  onOptionsChange: (newOptions: ProcessingOptions) => void;
  isProcessing: boolean;
}

export const Controls: React.FC<ControlsProps> = ({ options, onOptionsChange, isProcessing }) => {
  
  const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onOptionsChange({ ...options, format: e.target.value as ImageFormat });
  };

  const handleQualityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({ ...options, quality: parseFloat(e.target.value) });
  };

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({ ...options, scale: parseFloat(e.target.value) });
  };
  
  const handleMaxWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     onOptionsChange({ ...options, maxWidth: parseInt(e.target.value) || 0 });
  };

  return (
    <div className="bg-[#1e1e2d] rounded-xl shadow-lg border border-white/5 p-6 space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-white/5">
        <Settings className="w-5 h-5 text-indigo-400" />
        <h2 className="font-semibold text-white">处理选项</h2>
      </div>

      {/* Format Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-300 block">输出格式</label>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(ImageFormat).map(([key, value]) => (
            <button
              key={value}
              onClick={() => onOptionsChange({ ...options, format: value })}
              className={`
                py-2 px-3 rounded-lg text-sm font-medium border transition-all
                ${options.format === value 
                  ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300' 
                  : 'border-white/10 text-slate-400 hover:border-white/20 hover:bg-white/5'}
              `}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      {/* Quality Slider */}
      <div className="space-y-3">
        <div className="flex justify-between">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Sliders className="w-4 h-4" /> 质量 (Quality)
          </label>
          <span className="text-sm font-mono text-indigo-400">{Math.round(options.quality * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.05"
          value={options.quality}
          onChange={handleQualityChange}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
        <p className="text-xs text-slate-500">降低质量可以显著减小文件体积。</p>
      </div>

      {/* Scale Slider */}
      <div className="space-y-3">
         <div className="flex justify-between">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
             缩放比例 (Scale)
          </label>
          <span className="text-sm font-mono text-indigo-400">{Math.round(options.scale * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          value={options.scale}
          onChange={handleScaleChange}
           className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
      </div>

       {/* Max Width */}
       <div className="space-y-3">
         <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Hash className="w-4 h-4" /> 最大宽度 (px)
          </label>
          <input 
            type="number"
            placeholder="可选 (例如 1920)"
            value={options.maxWidth === 0 ? '' : options.maxWidth}
            onChange={handleMaxWidthChange}
            className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm text-white placeholder-slate-600"
          />
          <p className="text-xs text-slate-500">留空则保持原始宽高比。</p>
       </div>
    </div>
  );
};
