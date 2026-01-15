import React, { useState, useRef } from 'react';
import { Upload, Trash2, Download, Sparkles, Image as ImageIcon, Plus } from 'lucide-react';
import TattooGenerator from './components/TattooGenerator';
import TattooCanvas, { TattooCanvasHandle } from './components/TattooCanvas';
import { TattooDesign, OverlayConfig } from './types';

const App: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [selectedDesign, setSelectedDesign] = useState<TattooDesign | null>(null);
  const canvasHandleRef = useRef<TattooCanvasHandle>(null);

  const [config, setConfig] = useState<OverlayConfig>({
    scale: 1,
    rotation: 0,
    opacity: 0.8,
    offsetX: 0,
    offsetY: 0,
    blendMode: 'multiply',
    hue: 0,
    saturation: 100,
    brightness: 100
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImageSrc(ev.target?.result as string);
        // Reset offsets when new image uploaded
        setConfig(prev => ({ ...prev, offsetX: 0, offsetY: 0 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = () => {
    const dataUrl = canvasHandleRef.current?.exportImage();
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = `inkvision-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert("Failed to export. Please try again or use a different photo.");
    }
  };

  return (
    <div className="min-h-full max-w-7xl mx-auto px-4 pt-6 pb-24 md:py-12 flex flex-col no-select">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-2xl shadow-[0_0_25px_rgba(37,99,235,0.4)] transition-transform active:scale-95">
            <Sparkles className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase italic leading-none text-white">InkVision</h1>
            <p className="text-[8px] md:text-[10px] text-zinc-500 font-black uppercase tracking-[0.4em] mt-1.5">Neural Studio</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <label className="cursor-pointer bg-white text-black p-4 rounded-2xl transition-all active:scale-90 shadow-2xl flex items-center justify-center">
            <Plus className="w-5 h-5" />
            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
          </label>
          {imageSrc && (
            <button 
              onClick={() => { if(confirm("Clear current photo?")) setImageSrc(null); }}
              className="p-4 bg-zinc-900 text-zinc-400 rounded-2xl border border-zinc-800 transition-colors active:scale-90 active:bg-red-500/10 active:text-red-500"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-start">
        <div className="space-y-6 order-1 lg:order-2">
          <div className="flex items-center gap-3 mb-2 px-1">
            <div className="w-8 h-8 rounded-full bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
               <span className="text-blue-500 font-black italic text-sm">01</span>
            </div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Virtual Fit</h2>
          </div>
          
          <div className="relative">
            {!imageSrc ? (
              <div className="aspect-square w-full bg-zinc-900/20 rounded-[3rem] border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center p-8 text-center gap-10 group hover:border-blue-500/40 transition-all shadow-inner">
                <div className="w-28 h-28 rounded-[3rem] bg-zinc-900 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600/10 transition-all shadow-2xl border border-white/5">
                  <ImageIcon className="w-12 h-12 text-zinc-700 group-hover:text-blue-500" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-black uppercase tracking-tight italic text-white text-center w-full">Canvas Ready</h3>
                  <p className="text-[11px] text-zinc-500 font-black uppercase tracking-[0.2em] max-w-[260px] leading-relaxed mx-auto">
                    Upload a clear photo of your body to start visualizing your ink
                  </p>
                </div>
                <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white px-20 py-7 rounded-[2rem] text-[12px] font-black uppercase tracking-[0.3em] transition-all transform active:scale-95 shadow-2xl shadow-blue-600/40 border border-blue-400/20 flex items-center gap-3">
                  <Upload className="w-6 h-6" /> 
                  <span>Select Photo</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                </label>
              </div>
            ) : (
              <TattooCanvas 
                ref={canvasHandleRef}
                imageSrc={imageSrc} 
                tattooSrc={selectedDesign?.url || null} 
                config={config}
                onUpdateConfig={(c) => setConfig(prev => ({ ...prev, ...c }))}
              />
            )}
          </div>
        </div>

        <div className="space-y-6 order-2 lg:order-1">
          <div className="flex items-center gap-3 mb-2 px-1">
            <div className="w-8 h-8 rounded-full bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
               <span className="text-blue-500 font-black italic text-sm">02</span>
            </div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Design Studio</h2>
          </div>
          <TattooGenerator onSelectDesign={setSelectedDesign} />
        </div>
      </main>

      {imageSrc && selectedDesign && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/90 to-transparent lg:static lg:bg-transparent lg:p-0 lg:mt-8 z-50 pb-safe">
          <button 
            onClick={handleDownload}
            className="w-full py-5 bg-white text-black rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] shadow-[0_25px_50px_rgba(0,0,0,0.5)] transition-all transform active:scale-95 hover:bg-zinc-100 flex items-center justify-center gap-3 border border-zinc-200"
          >
            <Download className="w-5 h-5" /> Export Preview
          </button>
        </div>
      )}
      
      <footer className="mt-12 py-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4 opacity-40 text-[9px] font-black uppercase tracking-widest text-center">
        <p>© 2024 InkVision • Neural Prototyping</p>
        <div className="flex gap-8">
          <span>v2.5 Pro Mobile</span>
          <span className="text-blue-500">GPU Acceleration Active</span>
        </div>
      </footer>
    </div>
  );
};

export default App;