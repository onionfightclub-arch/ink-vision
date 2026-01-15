import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { OverlayConfig, BlendMode } from '../types';
import { Maximize, RotateCw, Layers, Move, ZoomIn, ZoomOut } from 'lucide-react';

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
  
  const images = useRef<{ main: HTMLImageElement | null; tattoo: HTMLImageElement | null }>({
    main: null,
    tattoo: null
  });

  useImperativeHandle(ref, () => ({
    exportImage: () => canvasRef.current?.toDataURL('image/png') || null
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
      const width = (canvas.width * 0.3) * config.scale;
      const height = (tattoo.height / tattoo.width) * width;

      ctx.save();
      ctx.globalAlpha = config.opacity;
      ctx.globalCompositeOperation = config.blendMode;
      
      ctx.translate(canvas.width / 2 + config.offsetX, canvas.height / 2 + config.offsetY);
      ctx.rotate((config.rotation * Math.PI) / 180);
      ctx.drawImage(tattoo, -width / 2, -height / 2, width, height);
      ctx.restore();
    }
  }, [tattooSrc, config]);

  useEffect(() => {
    const load = async () => {
      if (imageSrc) {
        const img = new Image();
        img.src = imageSrc;
        await img.decode();
        images.current.main = img;
      }
      if (tattooSrc) {
        const img = new Image();
        img.src = tattooSrc;
        await img.decode();
        images.current.tattoo = img;
      } else {
        images.current.tattoo = null;
      }
      draw();
    };
    load();
  }, [imageSrc, tattooSrc, draw]);

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

  const handleMouseDown = (e: React.MouseEvent) => handleStart(e.clientX, e.clientY);
  const handleMouseMove = (e: React.MouseEvent) => handleMove(e.clientX, e.clientY);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  const adjustScale = (delta: number) => {
    const newScale = Math.min(3, Math.max(0.1, config.scale + delta));
    onUpdateConfig({ scale: newScale });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Viewport */}
      <div 
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => setIsDragging(false)}
        style={{ touchAction: 'none' }}
        className={`relative aspect-square w-full bg-zinc-950 rounded-[2rem] overflow-hidden border border-zinc-800 transition-all ${
          isDragging ? 'scale-[0.98] ring-4 ring-blue-500/20' : 'shadow-2xl'
        } flex items-center justify-center`}
      >
        <canvas ref={canvasRef} className="w-full h-full object-contain pointer-events-none" />
        
        {tattooSrc && !isDragging && (
          <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 pointer-events-none border border-white/10">
            <Move className="w-3 h-3 text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Drag to place</span>
          </div>
        )}
      </div>

      {/* Touch-Friendly Controls */}
      {tattooSrc && (
        <div className="grid grid-cols-1 gap-5 bg-zinc-900/40 backdrop-blur-xl p-6 rounded-[2rem] border border-zinc-800 shadow-xl">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase text-zinc-500 flex items-center gap-2 tracking-[0.2em]">
                <Maximize className="w-4 h-4 text-blue-500" /> Size / Zoom
              </label>
              <span className="text-[10px] font-mono text-zinc-400">{(config.scale * 100).toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => adjustScale(-0.1)}
                className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-all active:scale-90"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4 text-zinc-400" />
              </button>
              <input 
                type="range" min="0.1" max="3" step="0.01" value={config.scale}
                onChange={(e) => onUpdateConfig({ scale: parseFloat(e.target.value) })}
                className="flex-1 h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-blue-600"
              />
              <button 
                onClick={() => adjustScale(0.1)}
                className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-all active:scale-90"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase text-zinc-500 flex items-center gap-2 tracking-[0.2em]">
                <RotateCw className="w-4 h-4 text-purple-500" /> Rotation
              </label>
              <span className="text-[10px] font-mono text-zinc-400">{config.rotation}°</span>
            </div>
            <input 
              type="range" min="-180" max="180" value={config.rotation}
              onChange={(e) => onUpdateConfig({ rotation: parseInt(e.target.value) })}
              className="w-full h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-purple-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-emerald-500" /> Style
              </label>
              <select 
                value={config.blendMode}
                onChange={(e) => onUpdateConfig({ blendMode: e.target.value as BlendMode })}
                className="w-full bg-black/40 border border-zinc-800 rounded-2xl p-3.5 text-[10px] font-black uppercase tracking-wider focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer text-zinc-300"
              >
                <option value="multiply">Inked</option>
                <option value="normal">Normal</option>
                <option value="overlay">Soft</option>
                <option value="darken">Stencil</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">Depth</label>
              <div className="flex items-center bg-black/40 border border-zinc-800 rounded-2xl p-1">
                <input 
                  type="range" min="0.1" max="1" step="0.01" value={config.opacity}
                  onChange={(e) => onUpdateConfig({ opacity: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-transparent appearance-none cursor-pointer accent-zinc-400 px-2"
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