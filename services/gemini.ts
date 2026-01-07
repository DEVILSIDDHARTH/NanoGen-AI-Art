
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ArtStyle, PoseStyle, CameraStyle, LensStyle, AspectRatio, ImageResolution } from "../types";

/**
 * API CONFIGURATION:
 * Standard models use the platform-provided process.env.API_KEY.
 * Pro models (Gemini 3 Pro) utilize the user-selected key from the aistudio dialog.
 */
const FLASH_MODEL = 'gemini-2.5-flash-image';
const PRO_MODEL = 'gemini-3-pro-image-preview';

export const generateImageFromPrompt = async (
  prompt: string, 
  style: ArtStyle,
  pose: PoseStyle,
  camera: CameraStyle,
  lens: LensStyle,
  referenceImages: string[] = [],
  aspectRatio: AspectRatio = "16:9",
  resolution: ImageResolution = "1K"
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const parts: any[] = [];

    // Switch to Pro model for high quality requests
    const isPro = resolution !== "1K";
    const modelToUse = isPro ? PRO_MODEL : FLASH_MODEL;

    for (const imgBase64 of referenceImages) {
      if (!imgBase64) continue;
      const match = imgBase64.match(/^data:(.+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: { mimeType: match[1], data: match[2] }
        });
      }
    }

    const addCompositionDetails = () => {
      let details = [];
      if (style !== ArtStyle.NONE) {
        if (style === ArtStyle.PAL) {
          details.push(`in a gritty urban comic book illustration style with bold black outlines, vibrant neon colors (purple, pink, blue), and edgy stylized character art`);
        } else {
          details.push(`in the style of ${style}`);
        }
      }
      if (pose !== PoseStyle.NONE) {
        details.push(`showing the subject in a ${pose} pose`);
      }
      if (camera !== CameraStyle.NONE) {
        details.push(`captured from a ${camera}`);
      }
      if (lens !== LensStyle.NONE) {
        details.push(`shot through a ${lens}`);
      }
      
      return details.length > 0 ? `. The scene should be ${details.join(", ")}.` : "";
    };

    let finalPrompt = "";
    if (referenceImages.length > 0) {
      if (style === ArtStyle.FRENCH_KISS && referenceImages.length >= 2) {
        finalPrompt = `Combine the subjects from these two reference images into a highly realistic depiction of them sharing a romantic french kiss. Maintain the physical likeness of both people. ${prompt}`;
        if (pose !== PoseStyle.NONE) finalPrompt += ` The subjects should be in a ${pose} position.`;
        if (camera !== CameraStyle.NONE) finalPrompt += ` This scene is viewed from a ${camera}.`;
        if (lens !== LensStyle.NONE) finalPrompt += ` Use a ${lens} effect.`;
      } else if (style === ArtStyle.SWIMWEAR) {
        finalPrompt = `Modify the subject(s) in the provided image(s) to appear in swimwear or bikini attire while perfectly preserving their facial features and likeness. ${prompt}`;
        if (pose !== PoseStyle.NONE) finalPrompt += ` Change the subject's pose to ${pose}.`;
        if (camera !== CameraStyle.NONE) finalPrompt += ` Adjust the view to a ${camera}.`;
        if (lens !== LensStyle.NONE) finalPrompt += ` Use a ${lens} optic.`;
      } else {
        finalPrompt = `Edit and integrate the provided image(s) to create a new scene of ${prompt}`;
        finalPrompt += addCompositionDetails();
      }
    } else {
      finalPrompt = `Create a high quality image of ${prompt}`;
      finalPrompt += addCompositionDetails();
    }

    // Add resolution hints to prompt for 8K since API supports up to 4K imageSize config
    if (resolution === "8K") {
      finalPrompt += ". Masterpiece, ultra-high resolution, 8k detail, sharp focus, incredible textures.";
    }

    parts.push({ text: finalPrompt });

    const config: any = {
      imageConfig: {
        aspectRatio: aspectRatio
      }
    };

    // imageSize is only supported for Pro model
    if (isPro) {
      config.imageConfig.imageSize = resolution === "8K" ? "4K" : resolution;
    }

    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: { parts: parts },
      config: config
    });

    return extractImageFromResponse(response);

  } catch (error: any) {
    console.error("Error generating image:", error);
    throw error;
  }
};

export const upscaleImage = async (base64Image: string, originalPrompt: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const parts: any[] = [];

    const match = base64Image.match(/^data:(.+);base64,(.+)$/);
    if (match) {
      parts.push({
        inlineData: { mimeType: match[1], data: match[2] }
      });
    }

    parts.push({ text: `Generate a high-resolution, highly detailed 4K version of this image. Improve sharpness and texture details while maintaining exact composition. ${originalPrompt}` });

    const response = await ai.models.generateContent({
      model: PRO_MODEL,
      contents: { parts: parts },
      config: {
        imageConfig: {
          imageSize: "4K"
        }
      }
    });

    return extractImageFromResponse(response);
  } catch (error: any) {
    console.error("Error upscaling image:", error);
    throw error;
  }
};

export const removeBackground = async (base64Image: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const parts: any[] = [];

    const match = base64Image.match(/^data:(.+);base64,(.+)$/);
    if (match) {
      parts.push({
        inlineData: { mimeType: match[1], data: match[2] }
      });
    }

    parts.push({ text: "Process this image to isolate the subject by removing the entire background. Place the subject on a solid, pure white background with clean, sharp edges." });

    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: { parts: parts },
    });

    return extractImageFromResponse(response);
  } catch (error) {
    console.error("Error removing background:", error);
    throw error;
  }
};

const extractImageFromResponse = (response: GenerateContentResponse): string => {
  if (!response.candidates || response.candidates.length === 0) {
    throw new Error("No candidates returned from API");
  }

  const content = response.candidates[0].content;
  if (!content || !content.parts) {
    throw new Error("No content parts returned from API");
  }

  for (const part of content.parts) {
    if (part.inlineData && part.inlineData.data) {
      const mimeType = part.inlineData.mimeType || 'image/png';
      return `data:${mimeType};base64,${part.inlineData.data}`;
    }
  }

  const textResponse = response.text;
  if (textResponse) {
    throw new Error(`Model Response: ${textResponse}`);
  }

  throw new Error("No image data found in response");
};
