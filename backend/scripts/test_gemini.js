import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenerativeAI } from '@google/generative-ai';

async function main() {
  const key = process.env.GOOGLE_API_KEY;
  const modelName = process.env.AI_MODEL || 'gemini-1.5-flash';
  if (!key) {
    console.error('Missing GOOGLE_API_KEY in environment');
    process.exit(1);
  }
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: modelName });
  const res = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: 'Say: pong' }] }] });
  const text = res?.response?.text?.() ?? '';
  console.log('Model:', modelName);
  console.log('Response:', text);
}

main().catch((e) => {
  console.error('Gemini test failed:', e?.response?.error || e);
  process.exit(1);
});


