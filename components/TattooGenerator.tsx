import React, { useState, KeyboardEvent } from 'react';
import { Sparkles, Loader2, Search, Palette, Zap, Check, AlertCircle } from 'lucide-react';
import { generateTattooDesign } from '../services/geminiService';
import { TattooDesign, TattooStyle } from '../types';

interface TattooGeneratorProps {
  onSelectDesign: (design: TattooDesign) => void;
}

const STYLES: TattooStyle[] = [
  'Fine Line',
  'Traditional',
  'Geometric',
  'Watercolor',
  'Dotwork',
  'Realistic',
  'Japanese',
  'Cyberpunk'
];

const PRESETS = [
  { name: 'Butterfly', prompt: 'Detailed monarch butterfly stencil', icon: '🦋' },
  { name: 'Rose', prompt: 'Stunning black and grey rose lineart', icon: '🌹' },
  { name: 'Snake', prompt: 'Coiling snake around a dagger stencil', icon: '🐍' },
  { name: 'Skull', prompt: 'Anatomical skull stencil with smoke', icon: '💀' },
  { name: 'Dragon', prompt: 'Oriental dragon lineart', icon: '🐉' },
  { name: 'Heart', prompt: 'Sacred heart with thorns stencil', icon: '❤️' },
  { name: 'Moon', prompt: 'Ornate crescent moon with stars', icon: '🌙' },
];

const TattooGenerator: React.FC<TattooGeneratorProps> = ({ onSelectDesign }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<TattooStyle>('Fine Line');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDesignId, setActiveDesignId] = useState<string | null>(null);
  
  const [history, setHistory] = useState<TattooDesign[]>([
    {
      id: 'default-1',
      url: 'https://images.unsplash.com/photo-1590246870023-521644547b4e?q=80&w=400&h=400&auto=format&fit=crop',
      prompt: 'Minimalist mountain range',
      style: 'Fine Line'
    },
    {
      id: 'default-2',
      url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=400&h=400&auto=format&fit=crop',
      prompt: 'Geometric wolf',
      style: 'Geometric'
    },
    {
      id: 'default-3',
      url: 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?q=80&w=400&h=400&auto=format&fit=crop',
      prompt: 'Traditional swallow',
      style: 'Traditional'
    }
  ]);

  const handleGenerate = async (overridePrompt?: string) => {
    const finalPrompt = overridePrompt || prompt;
    if (!finalPrompt.trim() || isGenerating) return;
    
    setIsGenerating(true);
    setError(null);
    try {
      const url = await generateTattooDesign(finalPrompt, selectedStyle);
      
      if (url) {
        const newDesign: TattooDesign = {
          id: Date.now().toString(),
          url,
          prompt: finalPrompt,
          style: selectedStyle
        };
        setHistory(prev => [newDesign, ...prev]);
        handleSelect(newDesign);
      } else {
        setError("Generation failed. Try being more descriptive.");
      }
    } catch (err) {
      console.error(err);
      setError("Connection error. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelect = (design: TattooDesign) => {
    setActiveDesignId(design.id);
    onSelectDesign(design);
  };

  const handlePresetClick = (presetPrompt: string) => {
    setPrompt(presetPrompt);
    handleGenerate(presetPrompt);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-[2rem] p-6 md:p-8 shadow-2xl space-y-8 h-full flex flex-col">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-xl">
            <Sparkles className="text-blue-500 w-5 h-5" />
          </div>
          <h2 className="text-lg md:text-xl font-black uppercase tracking-tight italic">Design Studio</h2>
        </div>
        {isGenerating && (
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-600/20 rounded-full border border-blue-500/30">
            <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
            <span className="text-[10px] font-black uppercase text-blue-500">Generating</span>
          </div>
        )}
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar pr-1">
        {/* Style Palette */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">
            <Palette className="w-3.5 h-3.5" /> Style Selection
          </div>
          <div className="horizontal-scroll no-scrollbar pb-1">
            <div className="flex gap-2.5">
              {STYLES.map((style) => (
                <button
                  key={style}
                  onClick={() => setSelectedStyle(style)}
                  className={`flex-shrink-0 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                    selectedStyle === style 
                      ? 'bg-blue-600 border-blue-400 text-white shadow-xl shadow-blue-600/20' 
                      : 'bg-zinc-800 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Flash Presets */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">
            <Zap className="w-3.5 h-3.5 text-yellow-500" /> Instant Flash
          </div>
          <div className="horizontal-scroll no-scrollbar pb-1">
            <div className="flex gap-2.5">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handlePresetClick(preset.prompt)}
                  disabled={isGenerating}
                  className="flex-shrink-0 flex items-center gap-2.5 bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-800 hover:border-blue-500/30 transition-all px-4 py-2.5 rounded-2xl disabled:opacity-50"
                >
                  <span className="text-base">{preset.icon}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">Concept Description</label>
            <span className="text-[8px] text-zinc-700 font-bold uppercase tracking-widest hidden lg:inline">⌘ + Enter to bake</span>
          </div>
          <div className="relative group">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`e.g. A neo-traditional owl perched on a branch...`}
              disabled={isGenerating}
              className="w-full bg-black border-2 border-zinc-800 rounded-3xl p-5 md:p-6 focus:outline-none focus:border-blue-500/50 transition-all min-h-[140px] text-sm text-zinc-200 resize-none leading-relaxed placeholder:text-zinc-700 disabled:opacity-50"
            />
            <button
              onClick={() => handleGenerate()}
              disabled={isGenerating || !prompt.trim()}
              className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white p-3.5 rounded-2xl transition-all shadow-2xl active:scale-95 flex items-center gap-2"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </button>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-3.5 rounded-2xl border border-red-400/20">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-[9px] font-black uppercase tracking-widest">{error}</p>
            </div>
          )}
        </div>

        {/* History Grid */}
        <div className="space-y-4 pt-4 border-t border-zinc-800/50">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">Latest Designs</h3>
            <span className="text-[8px] text-zinc-700 font-bold uppercase tracking-widest">{history.length} Saved</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {history.map((design) => (
              <button
                key={design.id}
                onClick={() => handleSelect(design)}
                className={`group relative aspect-square rounded-2xl border-2 transition-all shadow-lg overflow-hidden ${
                  activeDesignId === design.id 
                    ? 'border-blue-500 ring-2 ring-blue-500/10' 
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="absolute inset-0 bg-white" />
                <img 
                  src={design.url} 
                  alt={design.prompt} 
                  crossOrigin="anonymous"
                  className={`w-full h-full object-contain transition-all duration-300 ${
                    activeDesignId === design.id ? 'scale-110' : 'group-hover:scale-105'
                  }`} 
                />
                
                {activeDesignId === design.id && (
                  <div className="absolute top-1.5 right-1.5 bg-blue-600 rounded-full p-1 z-10">
                    <Check className="w-2 h-2 text-white stroke-[4px]" />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-2">
                  <p className="text-[8px] text-white truncate font-bold uppercase tracking-tight">{design.prompt}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TattooGenerator;