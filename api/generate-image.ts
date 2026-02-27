import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, model = 'flux' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // สร้าง URL สำหรับ Pollinations.ai
    const seed = Math.floor(Math.random() * 1000000);
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=${model}&width=1024&height=1024&seed=${seed}&nologo=true&enhance=true`;

    // Fetch รูปภาพจาก Pollinations.ai
    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      throw new Error('Failed to generate image');
    }

    // ส่งรูปภาพกลับไปเป็น base64
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64Image}`;

    return res.status(200).json({ imageUrl: dataUrl });
  } catch (error: any) {
    console.error('Image generation error:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate image' });
  }
}
