import { ImageFormat, ProcessingOptions } from '../types';

export const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

export const processImage = async (
  img: HTMLImageElement,
  options: ProcessingOptions
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number; size: number }> => {
  const canvas = document.createElement('canvas');
  let width = img.width * options.scale;
  let height = img.height * options.scale;

  // Apply Max Width constraint if scale didn't already reduce it enough
  if (options.maxWidth > 0 && width > options.maxWidth) {
    const ratio = options.maxWidth / width;
    width = options.maxWidth;
    height = height * ratio;
  }

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Fill white background for JPEGs to avoid black transparency
  if (options.format === ImageFormat.JPEG) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.drawImage(img, 0, 0, width, height);

  const dataUrl = canvas.toDataURL(options.format, options.quality);
  
  // Convert DataURL to Blob for size calculation and download
  const res = await fetch(dataUrl);
  const blob = await res.blob();

  return {
    blob,
    dataUrl,
    width,
    height,
    size: blob.size
  };
};

export const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};
