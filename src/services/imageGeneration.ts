// Image Generation Service - ใช้ Backend Proxy (ฟรี 100%)

export const IMAGE_MODELS = {
  'flux': {
    name: 'Flux',
    model: 'flux',
    description: 'ฟรี 100%, คุณภาพดีมาก, เร็ว (แนะนำ)',
    free: true,
  },
  'flux-realism': {
    name: 'Flux Realism',
    model: 'flux-realism',
    description: 'ฟรี 100%, สไตล์สมจริง, photorealistic',
    free: true,
  },
  'flux-anime': {
    name: 'Flux Anime',
    model: 'flux-anime',
    description: 'ฟรี 100%, สไตล์อนิเมะ',
    free: true,
  },
  'flux-3d': {
    name: 'Flux 3D',
    model: 'flux-3d',
    description: 'ฟรี 100%, สไตล์ 3D render',
    free: true,
  },
} as const;

export type ImageModelType = keyof typeof IMAGE_MODELS;

// Image Generation Function - เรียกผ่าน Backend Proxy
export const generateImage = async (
  prompt: string, 
  modelType: ImageModelType = 'flux'
): Promise<string> => {
  try {
    const selectedModel = IMAGE_MODELS[modelType];
    
    // เรียก backend proxy API
    const apiUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:5173/api/generate-image'
      : '/api/generate-image';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        model: selectedModel.model,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'ไม่สามารถสร้างรูปภาพได้');
    }

    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error('Image generation error:', error);
    throw error;
  }
};
