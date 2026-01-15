import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { OverlayConfig, BlendMode } from '../types';
import { Maximize, RotateCw, Layers, Move, ZoomIn, ZoomOut, Sliders } from 'lucide-react';

interface TattooCanvasProps {
  imageSrc: string;
  tattooSrc: string | null;
  config: OverlayConfig;
  onUpdateConfig: (newConfig: Partial<OverlayConfig>) => void;
}

export interface TattooCanvasHandle {
  exportImage: () => string | null;
}

const TattooCanvas = forwardRef<TattooCanvasHandle, TattooCanvasProps>(({ 
  imageSrc, 
  tattooSrc, 
  config,
  onUpdateConfig
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [imagesLoaded, setImagesLoaded] = useState(0); 
  
  const images = useRef<{ main: HTMLImageElement | null; tattoo: HTMLImageElement | null }>({
    main: null,
    tattoo: null
  });

  useImperativeHandle(ref, () => ({
    exportImage: () => {
      try {
        return canvasRef.current?.toDataURL('image/png') || null;
      } catch (err) {
        console.error("Canvas export failed. This is usually due to CORS issues with external images.", err);
        return null;
      }
    }
  }));

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !images.current.main) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = images.current.main.width;
    canvas.height = images.current.main.height;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(images.current.main, 0, 0);

    if (tattooSrc && images.current.tattoo) {
      const tattoo = images.current.tattoo;
      const baseWidth = canvas.width * 0.3;
      const width = baseWidth * config.scale;
      const height = (tattoo.height / tattoo.width) * width;

      ctx.save();
      ctx.globalAlpha = config.opacity;
      ctx.globalCompositeOperation = config.blendMode;
      
      // Apply Hue, Saturation, Brightness filters
      // Note: ctx.filter is supported in all modern browsers.
      ctx.filter = `hue-rotate(${config.hue}deg) saturate(${config.saturation}%) brightness(${config.brightness}%)`;
      
      ctx.translate(canvas.width / 2 + config.offsetX, canvas.height / 2 + config.offsetY);
      ctx.rotate((config.rotation * Math.PI) / 180);
      ctx.drawImage(tattoo, -width / 2, -height / 2, width, height);
      ctx.restore();
    }
  }, [tattooSrc, config, imagesLoaded]);

  useEffect(() => {
    let isMounted = true;
    const loadMain = async () => {
      if (!imageSrc) return;
      const img = new Image();
      img.crossOrigin = "anonymous"; 
      img.src = imageSrc;
      try {
        await img.decode();
        if (isMounted) {
          images.current.main = img;
          setImagesLoaded(prev => prev + 1);
        }
      } catch (e) {
        console.error("Failed to load main image", e);
      }
    };
    loadMain();
    return () => { isMounted = false; };
  }, [imageSrc]);

  useEffect(() => {
    let isMounted = true;
    const loadTattoo = async () => {
      if (!tattooSrc) {
        images.current.tattoo = null;
        setImagesLoaded(prev => prev + 1);
        return;
      }
      const img = new Image();
      img.crossOrigin = "anonymous"; 
      img.src = tattooSrc;
      try {
        await img.decode();
        if (isMounted) {
          images.current.tattoo = img;
          setImagesLoaded(prev => prev + 1);
        }
      } catch (e) {
        console.error("Failed to load tattoo image", e);
      }
    };
    loadTattoo();
    return () => { isMounted = false; };
  }, [tattooSrc]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleStart = (clientX: number, clientY: number) => {
    if (!tattooSrc) return;
    setIsDragging(true);
    setLastMousePos({ x: clientX, y: clientY });
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const dx = clientX - lastMousePos.x;
    const dy = clientY - lastMousePos.y;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const scaleX = canvasRef.current!.width / rect.width;
      const scaleY = canvasRef.current!.height / rect.height;
      onUpdateConfig({
        offsetX: config.offsetX + dx * scaleX,
        offsetY: config.offsetY + dy * scaleY
      });
    }
    setLastMousePos({ x: clientX, y: clientY });
  };

  const adjustScale = (delta: number) => {
    const newScale = Math.min(5, Math.max(0.05, config.scale + delta));
    onUpdateConfig({ scale: newScale });
  };

  return (
    <div className="flex flex-col gap-4">
      <div 
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={() => setIsDragging(false)}
        style={{ touchAction: 'none' }}
        className={`relative aspect-square w-full bg-zinc-950 rounded-[2rem] overflow-hidden border border-zinc-800 transition-all ${
          isDragging ? 'scale-[0.99] ring-2 ring-blue-500/50' : 'shadow-2xl'
        } flex items-center justify-center`}
      >
        <canvas ref={canvasRef} className="w-full h-full object-contain pointer-events-none" />
        
        {tattooSrc && !isDragging && (
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 pointer-events-none border border-white/10 shadow-lg">
            <Move className="w-3 h-3 text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white">Drag to position</span>
          </div>
        )}
      </div>

      {tattooSrc && (
        <div className="flex flex-col gap-6 bg-zinc-900/40 backdrop-blur-xl p-6 rounded-[2rem] border border-zinc-800 shadow-xl overflow-hidden">
          {/* Transform Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase text-zinc-500 flex items-center gap-2 tracking-[0.2em]">
                  <Maximize className="w-4 h-4 text-blue-500" /> Scale
                </label>
                <span className="text-[10px] font-mono text-zinc-400">{(config.scale * 100).toFixed(0)}%</span>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => adjustScale(-0.1)}
                  className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-all active:scale-90"
                >
                  <ZoomOut className="w-4 h-4 text-zinc-400" />
                </button>
                <input 
                  type="range" min="0.1" max="5" step="0.01" value={config.scale}
                  onChange={(e) => onUpdateConfig({ scale: parseFloat(e.target.value) })}
                  className="flex-1 h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-blue-600"
                />
                <button 
                  onClick={() => adjustScale(0.1)}
                  className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-all active:scale-90"
                >
                  <ZoomIn className="w-4 h-4 text-zinc-400" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase text-zinc-500 flex items-center gap-2 tracking-[0.2em]">
                  <RotateCw className="w-4 h-4 text-purple-500" /> Rotate
                </label>
                <span className="text-[10px] font-mono text-zinc-400">{config.rotation}°</span>
              </div>
              <input 
                type="range" min="-180" max="180" value={config.rotation}
                onChange={(e) => onUpdateConfig({ rotation: parseInt(e.target.value) })}
                className="w-full h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-purple-600"
              />
            </div>
          </div>

          {/* Color & Filter Section */}
          <div className="space-y-6 pt-4 border-t border-zinc-800/50">
            <div className="flex items-center gap-2 mb-2">
              <Sliders className="w-4 h-4 text-emerald-500" />
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Color & Filters</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">Hue</label>
                  <span className="text-[9px] font-mono text-zinc-500">{config.hue}°</span>
                </div>
                <input 
                  type="range" min="0" max="360" value={config.hue}
                  onChange={(e) => onUpdateConfig({ hue: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">Saturation</label>
                  <span className="text-[9px] font-mono text-zinc-500">{config.saturation}%</span>
                </div>
                <input 
                  type="range" min="0" max="200" value={config.saturation}
                  onChange={(e) => onUpdateConfig({ saturation: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">Brightness</label>
                  <span className="text-[9px] font-mono text-zinc-500">{config.brightness}%</span>
                </div>
                <input 
                  type="range" min="0" max="200" value={config.brightness}
                  onChange={(e) => onUpdateConfig({ brightness: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-yellow-500"
                />
              </div>
            </div>
          </div>

          {/* Layer Controls */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800/50">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-zinc-400" /> Blend
              </label>
              <select 
                value={config.blendMode}
                onChange={(e) => onUpdateConfig({ blendMode: e.target.value as BlendMode })}
                className="w-full bg-black/40 border border-zinc-800 rounded-2xl p-3.5 text-[10px] font-black uppercase tracking-wider focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer text-zinc-300"
              >
                <option value="multiply">Multiply (Stencil)</option>
                <option value="normal">Normal</option>
                <option value="overlay">Overlay</option>
                <option value="darken">Darken</option>
                <option value="screen">Screen</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">Opacity</label>
              <div className="flex items-center bg-black/40 border border-zinc-800 rounded-2xl h-[46px] px-3">
                <input 
                  type="range" min="0.1" max="1" step="0.01" value={config.opacity}
                  onChange={(e) => onUpdateConfig({ opacity: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-transparent appearance-none cursor-pointer accent-zinc-400"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

TattooCanvas.displayName = 'TattooCanvas';
export default TattooCanvas;