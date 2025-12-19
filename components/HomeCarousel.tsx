
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Upload, Wand2, Shirt, Sparkles, LayoutTemplate, Palette, Edit3, Crop, Scissors, ArrowRight } from 'lucide-react';
import { CarouselSlide } from '../types';

interface HomeCarouselProps {
  slides: CarouselSlide[];
  onNavigate: (item: string) => void;
  onImageSelected: (file: File) => void;
}

// Map string icon names to components
const IconMap: Record<string, any> = {
  Upload, Wand2, Shirt, Sparkles, LayoutTemplate, Palette, Edit3, Crop, Scissors, ArrowRight
};

export const HomeCarousel: React.FC<HomeCarouselProps> = ({ slides, onNavigate, onImageSelected }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-advance
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  const handleAction = (slide: CarouselSlide) => {
    if (slide.linkTarget === 'upload') {
      fileInputRef.current?.click();
    } else {
      onNavigate(slide.linkTarget);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageSelected(e.target.files[0]);
    }
  };

  if (!slides || slides.length === 0) return null;

  return (
    <div className="relative w-full h-[320px] rounded-2xl overflow-hidden shadow-2xl group border border-white/5">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Slides Container */}
      <div 
        className="absolute inset-0 flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide) => {
           const Icon = IconMap[slide.buttonIcon] || ArrowRight;
           // Fallback gradient if not provided
           const bgClass = slide.gradient || "from-blue-600 to-indigo-700";

           return (
            <div 
              key={slide.id} 
              className={`min-w-full h-full relative flex items-center px-12 ${!slide.bgImage ? `bg-gradient-to-br ${bgClass}` : ''}`}
            >
              {slide.bgImage && (
                <div className="absolute inset-0 z-0">
                  <img src={slide.bgImage} className="w-full h-full object-cover" alt="slide bg" />
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"></div>
                </div>
              )}

              {/* Abstract Background Shapes (only if no image) */}
              {!slide.bgImage && (
                <>
                  <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
                </>
              )}

              <div className="relative z-10 max-w-2xl">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 text-xs font-semibold text-white mb-6 animate-in slide-in-from-bottom-4 fade-in duration-700`}>
                  <Sparkles className="w-3 h-3 text-yellow-300" />
                  Featured
                </div>
                <h2 className="text-4xl font-bold text-white mb-4 leading-tight tracking-tight shadow-sm animate-in slide-in-from-bottom-6 fade-in duration-700 delay-100">
                  {slide.title}
                </h2>
                <p className="text-lg text-white/80 mb-8 max-w-lg leading-relaxed animate-in slide-in-from-bottom-8 fade-in duration-700 delay-200">
                  {slide.desc}
                </p>
                <button
                  onClick={() => handleAction(slide)}
                  className="group/btn bg-white text-slate-900 hover:bg-slate-100 px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 animate-in zoom-in-95 duration-500 delay-300"
                >
                  <Icon className={`w-5 h-5 ${!slide.bgImage && bgClass.split(' ')[0].replace('from-', 'text-')}`} />
                  {slide.buttonText}
                </button>
              </div>
            </div>
           );
        })}
      </div>

      {/* Navigation Arrows (only if > 1 slide) */}
      {slides.length > 1 && (
        <>
          <button 
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/20 hover:bg-black/40 backdrop-blur-sm text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-20"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button 
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/20 hover:bg-black/40 backdrop-blur-sm text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-20"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  currentSlide === index ? 'w-8 bg-white' : 'bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
