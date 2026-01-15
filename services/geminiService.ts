import { GoogleGenAI } from "@google/genai";
import { TattooStyle } from "../types";

const STYLE_PROMPTS: Record<TattooStyle, string> = {
  'Traditional': 'bold black outlines, classic American traditional aesthetic, primary color palette, iconic tattoo flash look, vintage sailor style.',
  'Geometric': 'ultra-clean vector-like geometric patterns, sacred geometry, perfect symmetry, thin but consistent black lines, mathematical motifs.',
  'Watercolor': 'ethereal watercolor splashes, soft gradients, painterly ink bleeds, artistic vibrant hues, delicate organic shapes, no heavy outlines.',
  'Fine Line': 'minimalist elegant fine line art, single needle style, sophisticated subtle outlines, delicate botanical or celestial elements.',
  'Dotwork': 'intricate pointillism, stippled shading, complex dotwork patterns, high-contrast black ink, meticulous detail.',
  'Realistic': 'masterful photorealistic detail, smooth transition shading, 3D depth, professional charcoal-like realism in ink form.',
  'Japanese': 'traditional Irezumi flow, classic oriental motifs, stylized waves and clouds, bold composition, rich cultural symbolic elements.',
  'Cyberpunk': 'techno-organic circuitry, neon glow accents, glitch art aesthetic, futuristic cybernetic augmentations, industrial sharp edges.'
};

export const generateTattooDesign = async (prompt: string, style: TattooStyle = 'Fine Line'): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const styleDescription = STYLE_PROMPTS[style];
  const finalPrompt = `Professional high-contrast tattoo stencil: ${prompt}. 
    Style: ${styleDescription}.
    Execution: Perfectly isolated on a solid #FFFFFF pure white background. Center composition. 
    Crucial: Zero skin texture, zero shadows, no backgrounds, no clothing, no human models, no frames.
    Format: Sharp high-resolution line art suitable for professional tattoo transfer paper.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: finalPrompt,
          },
        ],
      },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
  } catch (error) {
    console.error("Neural generation failed:", error);
  }
  return null;
};