import { GoogleGenAI, Type } from "@google/genai";

// Use 'gemini-flash-latest' for fast multimodal analysis as per guide
const MODEL_NAME = 'gemini-flash-latest';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
}

export const analyzeImageWithGemini = async (
  base64Image: string, 
  mimeType: string
) => {
  try {
    const ai = getAiClient();

    // Clean base64 string if it contains metadata prefix
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|webp);base64,/, "");

    const prompt = `
      Analyze this image in detail.
      Return a JSON object with the following structure:
      {
        "description": "A concise but descriptive caption of the image (max 2 sentences).",
        "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
        "mainColors": ["#HexCode1", "#HexCode2", "#HexCode3"]
      }
      Ensure the output is valid JSON.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            tags: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            mainColors: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No response text from Gemini");

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const generateImage = async (
  prompt: string, 
  modelType: 'V1' | 'V2' = 'V1',
  aspectRatio: string = '1:1'
) => {
  try {
    const ai = getAiClient();
    
    // Map UI models to Gemini models
    const model = modelType === 'V2' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

    // Map requested aspect ratio to closest supported ratio
    const ratioMap: Record<string, string> = {
      '1:1': '1:1',
      '4:3': '4:3',
      '3:4': '3:4',
      '16:9': '16:9',
      '9:16': '9:16',
      // Fallbacks
      '21:9': '16:9', 
      '3:2': '4:3',   
      '2:3': '3:4',   
      '9:21': '9:16'  
    };
    
    const validRatio = ratioMap[aspectRatio] || '1:1';

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: validRatio,
        }
      },
    });

    for (const candidate of response.candidates || []) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          const base64String = part.inlineData.data;
          return `data:image/png;base64,${base64String}`;
        }
      }
    }
    
    throw new Error("No image generated in response");

  } catch (error) {
    console.error("Gemini Image Generation Error:", error);
    throw error;
  }
};

export const generateOutfitChange = async (
  modelImageBase64: string,
  clothingImageBase64: string,
  prompt: string,
  modelType: 'V1' | 'V2' = 'V1'
) => {
  try {
    const ai = getAiClient();
    const model = modelType === 'V2' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

    // Prepare inputs
    const cleanModelImage = modelImageBase64.replace(/^data:image\/(png|jpeg|webp);base64,/, "");
    const cleanClothingImage = clothingImageBase64.replace(/^data:image\/(png|jpeg|webp);base64,/, "");

    // Construct a comprehensive prompt for the model
    const fullPrompt = `
      Task: Virtual Try-On / Outfit Change.
      Image 1 is the model/person.
      Image 2 is the clothing/garment.
      Instruction: ${prompt || "Put the clothing from Image 2 onto the person in Image 1. Maintain the pose, lighting, and identity of the person in Image 1 as much as possible."}
      Generate a high-quality realistic image of the person wearing the new clothes.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png', 
              data: cleanModelImage
            }
          },
          {
             inlineData: {
              mimeType: 'image/png', 
              data: cleanClothingImage
            }
          },
          { text: fullPrompt }
        ],
      },
      config: {
         // Default to 1:1 or attempt to infer? 3:4 is common for portraits
        imageConfig: {
          aspectRatio: '3:4', 
        }
      },
    });

    for (const candidate of response.candidates || []) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          const base64String = part.inlineData.data;
          return `data:image/png;base64,${base64String}`;
        }
      }
    }
    
    throw new Error("No result generated");

  } catch (error) {
    console.error("Gemini Outfit Change Error:", error);
    throw error;
  }
};
