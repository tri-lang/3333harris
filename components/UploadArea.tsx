import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface UploadAreaProps {
  onImageSelected: (file: File) => void;
}

export const UploadArea: React.FC<UploadAreaProps> = ({ onImageSelected }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndPass(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndPass(e.target.files[0]);
    }
  };

  const validateAndPass = (file: File) => {
    if (file.type.startsWith('image/')) {
      onImageSelected(file);
    } else {
      alert('Please upload a valid image file.');
    }
  };

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ease-in-out
        ${isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-[#1e1e2d] hover:border-indigo-500/50 hover:bg-[#252535]'}
        flex flex-col items-center justify-center p-12 text-center cursor-pointer min-h-[300px] shadow-lg
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      <div className={`p-4 rounded-full bg-indigo-500/10 mb-4 transition-transform duration-300 ${isDragging ? 'scale-110' : ''}`}>
        <Upload className="w-8 h-8 text-indigo-400" />
      </div>
      
      <h3 className="text-xl font-semibold text-white mb-2">
        {isDragging ? 'Drop it like it\'s hot!' : '点击或拖拽上传图片'}
      </h3>
      <p className="text-slate-400 max-w-xs mx-auto text-sm">
        支持 PNG, JPG, WEBP 和 GIF 格式 <br/>
        <span className="text-xs text-slate-500 mt-2 block">推荐文件大小不超过 10MB</span>
      </p>

      {/* Decorative Background Icons */}
      <ImageIcon className="absolute -left-4 -bottom-4 text-white/5 w-32 h-32 -rotate-12 pointer-events-none" />
      <ImageIcon className="absolute -right-4 -top-4 text-white/5 w-24 h-24 rotate-12 pointer-events-none" />
    </div>
  );
};
