// Vercel serverless function: transform photo via Gemini
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image } = req.body; // base64 data URL
  if (!image) {
    return res.status(400).json({ error: 'No image provided' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Extract base64 data
    const base64Data = image.split(',')[1];
    const mimeType = image.split(';')[0].split(':')[1];

    const prompt = `Transform this photo into a professional LinkedIn profile picture:
- Convert to black and white
- Enhance lighting and contrast
- Clean/neutral background
- Professional look
- Keep the person's face clear and centered

Return the transformed image.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      }
    ]);

    const response = await result.response;
    const generatedImage = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;

    if (!generatedImage) {
      return res.status(500).json({ error: 'No image returned from API' });
    }

    // Return as base64 data URL
    const outputDataUrl = `data:${generatedImage.mimeType};base64,${generatedImage.data}`;
    return res.status(200).json({ image: outputDataUrl });

  } catch (error) {
    console.error('Gemini API error:', error);
    return res.status(500).json({ error: error.message || 'Transformation failed' });
  }
}
