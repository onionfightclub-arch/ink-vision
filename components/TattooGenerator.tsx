import React, { useState } from 'react';
import { Sparkles, Loader2, Search, Palette } from 'lucide-react';
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

const TattooGenerator: React.FC<TattooGeneratorProps> = ({ onSelectDesign }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<TattooStyle>('Fine Line');
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<TattooDesign[]>([
    {
      id: 'default-1',
      url: 'https://picsum.photos/seed/tattoo1/400/400',
      prompt: 'Minimalist mountain range',
      style: 'Fine Line'
    },
    {
      id: 'default-2',
      url: 'https://picsum.photos/seed/tattoo2/400/400',
      prompt: 'Geometric wolf',
      style: 'Geometric'
    },
    {
      id: 'default-3',
      url: 'https://picsum.photos/seed/tattoo3/400/400',
      prompt: 'Traditional swallow',
      style: 'Traditional'
    }
  ]);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    
    setIsGenerating(true);
    const url = await generateTattooDesign(prompt, selectedStyle);
    
    if (url) {
      const newDesign: TattooDesign = {
        id: Date.now().toString(),
        url,
        prompt,
        style: selectedStyle
      };
      setHistory(prev => [newDesign, ...prev]);
      onSelectDesign(newDesign);
    }
    setIsGenerating(false);
  };

  return (
    <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-[2rem] p-6 md:p-8 shadow-2xl space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-xl">
            <Sparkles className="text-blue-500 w-5 h-5" />
          </div>
          <h2 className="text-lg md:text-xl font-black uppercase tracking-tight italic">Design Studio</h2>
        </div>
      </div>

      {/* Style Selector */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">
          <Palette className="w-3.5 h-3.5" /> Style Palette
        </div>
        <div className="flex overflow-x-auto gap-3 pb-3 no-scrollbar scroll-smooth snap-x">
          {STYLES.map((style) => (
            <button
              key={style}
              onClick={() => setSelectedStyle(style)}
              className={`snap-start whitespace-nowrap px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                selectedStyle === style 
                  ? 'bg-blue-600 border-blue-400 text-white shadow-xl shadow-blue-600/30' 
                  : 'bg-zinc-800 border-zinc-800 text-zinc-400 hover:border-zinc-700 active:scale-95'
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="space-y-4">
        <label className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">Describe your concept</label>
        <div className="relative group">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`e.g. A roaring lion with floral accents...`}
            className="w-full bg-black border-2 border-zinc-800 rounded-3xl p-5 md:p-6 focus:outline-none focus:border-blue-500/50 transition-all min-h-[120px] md:min-h-[140px] text-sm text-zinc-200 resize-none leading-relaxed placeholder:text-zinc-700"
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="absolute bottom-4 right-4 md:bottom-5 md:right-5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white p-4 rounded-2xl transition-all shadow-2xl active:scale-90"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* History Grid */}
      <div className="space-y-4">
        <h3 className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">Latest Stencils</h3>
        <div className="grid grid-cols-3 gap-3 md:gap-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar scroll-smooth">
          {history.map((design) => (
            <button
              key={design.id}
              onClick={() => onSelectDesign(design)}
              className="group relative aspect-square bg-black rounded-2xl border-2 border-zinc-800 overflow-hidden hover:border-blue-500/50 transition-all active:scale-95 shadow-lg"
            >
              <img src={design.url} alt={design.prompt} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-2 md:p-3">
                <p className="text-[7px] text-blue-400 font-black uppercase tracking-widest mb-1">{design.style}</p>
                <p className="text-[9px] text-white truncate font-bold uppercase tracking-tighter">{design.prompt}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TattooGenerator;