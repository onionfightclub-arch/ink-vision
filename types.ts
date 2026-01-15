export type TattooStyle = 'Traditional' | 'Geometric' | 'Watercolor' | 'Fine Line' | 'Dotwork' | 'Realistic' | 'Japanese' | 'Cyberpunk';

export interface TattooDesign {
  id: string;
  url: string;
  prompt: string;
  style: TattooStyle;
}

export type BlendMode = 'multiply' | 'screen' | 'overlay' | 'darken' | 'normal';

export interface OverlayConfig {
  scale: number;
  rotation: number;
  opacity: number;
  offsetX: number;
  offsetY: number;
  blendMode: BlendMode;
}