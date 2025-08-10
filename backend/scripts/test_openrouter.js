import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load only one .env in priority order (first match wins) to avoid unintended overrides
const candidateEnvPaths = [
  process.env.ENV_PATH ? path.resolve(process.env.ENV_PATH) : null,
  path.resolve(__dirname, '..', '.env'), // backend/.env (preferred for backend scripts)
  path.resolve(process.cwd(), '.env'), // current working dir
  path.resolve(__dirname, '..', '..', '.env'), // repo root .env (lowest priority)
].filter(Boolean);

let loadedEnvFiles = [];
for (const p of candidateEnvPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p, override: true });
    loadedEnvFiles.push(p);
    break; // stop after first existing .env
  }
}
import fetch from 'node-fetch';

async function main() {
  console.log('Checked .env files:', loadedEnvFiles);
  if (loadedEnvFiles[0]) {
    try {
      const preview = fs.readFileSync(loadedEnvFiles[0], 'utf8');
      console.log('Loaded .env preview (first 200 chars):');
      console.log(preview.slice(0, 200).replace(/\r/g, '\\r').replace(/\n/g, '\\n'));
    } catch {}
  }
  console.log('Env present flags:', {
    OPENROUTER_API_KEY: Boolean(process.env.OPENROUTER_API_KEY),
    OPENROUTER_BASE_URL: Boolean(process.env.OPENROUTER_BASE_URL),
    AI_MODEL: process.env.AI_MODEL || '(not set)'
  });
  const apiKey = process.env.OPENROUTER_API_KEY;
  const modelName = process.env.AI_MODEL || 'qwen/qwen3-coder:free';
  if (!apiKey) {
    console.error('Missing OPENROUTER_API_KEY in environment');
    process.exit(1);
  }

  // Basic sanity checks on the key formatting to help catch whitespace/quote issues on Windows
  const trimmed = apiKey.trim();
  if (apiKey !== trimmed) console.warn('Note: OPENROUTER_API_KEY had surrounding whitespace; trimming.');
  if (!trimmed.startsWith('sk-or-')) console.warn('Note: OPENROUTER_API_KEY does not start with "sk-or-". Is this an OpenRouter key?');
  const containsInnerWhitespace = /\s/.test(trimmed.replace(/^\s+|\s+$/g, ''));
  if (containsInnerWhitespace) {
    console.warn('Warning: OPENROUTER_API_KEY appears to contain internal whitespace. This will break Authorization header.');
    const codes = Array.from(trimmed).map((c) => c.charCodeAt(0));
    console.log('Key length:', trimmed.length, 'char codes (first 10):', codes.slice(0,10).join(','));
  }

  const baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  console.log('Using baseURL:', baseURL);

  // Local echo check: ensure Authorization header actually leaves this process
  try {
    const echo = await fetch('https://postman-echo.com/headers', {
      headers: { Authorization: `Bearer ${trimmed}` }
    });
    const echoJson = await echo.json();
    const echoedAuth = echoJson?.headers?.authorization || echoJson?.headers?.Authorization;
    console.log('Echo check Authorization header present:', Boolean(echoedAuth));
    if (!echoedAuth) {
      console.warn('Echo server did not receive Authorization header. Something is stripping it locally.');
    }
  } catch (e) {
    console.warn('Echo header check failed:', e?.message || e);
  }

  // Quick auth probe
  const probe = await fetch(`${baseURL}/models`, {
    headers: {
      Authorization: `Bearer ${trimmed}`,
      'Content-Type': 'application/json',
    },
  });
  console.log('Auth probe /models status:', probe.status);
  if (probe.status === 401) {
    const body = await probe.text();
    console.error('Auth probe failed (401). Response body:', body.slice(0, 500));
    console.error('Please double-check OPENROUTER_API_KEY value.');
    process.exit(1);
  }

  const chat = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    // Force manual redirect handling so sensitive headers aren't stripped on cross-origin redirects (for debugging)
    redirect: 'manual',
    headers: {
      Authorization: `Bearer ${trimmed}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'HTTP-Referer': process.env.APP_URL || 'http://localhost:5173',
      'Referer': process.env.APP_URL || 'http://localhost:5173',
      'X-Title': process.env.APP_NAME || 'AI Todo',
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: 'system', content: 'You are a concise assistant.' },
        { role: 'user', content: 'Say: pong' },
      ],
    }),
  });
  console.log('POST /chat status:', chat.status, 'redirected:', chat.redirected, 'url:', chat.url);
  const location = chat.headers.get('location');
  if (location) console.log('Redirect location:', location);
  const rawText = await chat.text();
  const completion = (() => { try { return JSON.parse(rawText); } catch { return { rawText }; } })();
  console.log('Response headers:', Object.fromEntries(chat.headers.entries()));
  const content = completion?.choices?.[0]?.message?.content ?? completion?.choices?.[0]?.text ?? '';
  console.log('Model:', modelName);
  if (content) {
    console.log('Output:', content);
  } else {
    console.log('Output (raw JSON snippet):', JSON.stringify(completion).slice(0, 600));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


