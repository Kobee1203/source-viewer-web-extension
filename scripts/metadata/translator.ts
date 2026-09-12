import fs from 'node:fs';
import path from 'node:path';
import {
  LOCALE_NAMES,
  MAX_SUMMARY_LENGTH,
  REFERENCE_LOCALE,
  SRC_LOCALES_DIR,
  STORE_METADATA_DIR,
  TARGET_SUMMARY_LENGTH,
} from './config';
import type { MetadataContent, TranslationOptions } from './types';
import { countBulletPoints } from './validator';

export function extractGlossary(locale: string): Record<string, string> {
  const ymlPath = path.join(SRC_LOCALES_DIR, `${locale}.yml`);
  if (!fs.existsSync(ymlPath)) {
    return {};
  }

  const content = fs.readFileSync(ymlPath, 'utf-8');
  const glossary: Record<string, string> = {};

  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^([a-zA-Z0-9_-]+):\s*['"]?(.*?)['"]?$/);
    if (match) {
      const [, key, val] = match;
      if (val && !val.includes('$1') && !val.startsWith('{')) {
        glossary[key] = val.replace(/^['"]|['"]$/g, '');
      }
    }
  }

  return glossary;
}

export function readReferenceMetadata(): MetadataContent {
  const refDir = path.join(STORE_METADATA_DIR, REFERENCE_LOCALE);
  const summaryPath = path.join(refDir, 'summary.txt');
  const descriptionPath = path.join(refDir, 'description.md');

  if (!fs.existsSync(summaryPath) || !fs.existsSync(descriptionPath)) {
    throw new Error(`Reference metadata files not found in ${refDir}`);
  }

  return {
    summary: fs.readFileSync(summaryPath, 'utf-8').trim(),
    description: fs.readFileSync(descriptionPath, 'utf-8').trim(),
  };
}

async function callGemini(apiKey: string, model: string, prompt: string): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  interface GeminiResponse {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  }

  const data = (await response.json()) as GeminiResponse;
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Gemini API returned an empty response');
  }
  return rawText;
}

async function callOpenAi(apiKey: string, model: string, prompt: string): Promise<string> {
  const endpoint = 'https://api.openai.com/v1/chat/completions';
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
  }

  interface OpenAiResponse {
    choices?: Array<{
      message?: { content?: string };
    }>;
  }

  const data = (await response.json()) as OpenAiResponse;
  const rawText = data.choices?.[0]?.message?.content;
  if (!rawText) {
    throw new Error('OpenAI API returned an empty response');
  }
  return rawText;
}

export async function translateMetadata(
  targetLocale: string,
  reference: MetadataContent,
  options: TranslationOptions,
): Promise<MetadataContent> {
  if (!options.apiKey) {
    throw new Error('Missing required "apiKey" in TranslationOptions');
  }

  const provider = options.provider || 'gemini';
  const defaultModel = provider === 'gemini' ? 'gemini-3.6-flash' : 'gpt-4o-mini';
  const model = options.model || defaultModel;

  const langName = LOCALE_NAMES[targetLocale] || targetLocale;
  const glossary = extractGlossary(targetLocale);
  const glossaryTerms = Object.entries(glossary)
    .slice(0, 25)
    .map(([k, v]) => `  - ${k}: "${v}"`)
    .join('\n');

  const refBullets = countBulletPoints(reference.description);

  const prompt = `You are an expert translator specializing in developer tools and browser extensions.
Translate the following Chrome Web Store & Firefox Add-ons store metadata from English to ${langName} (locale code: "${targetLocale}").

CRITICAL CONSTRAINTS:
1. "summary":
   - STRICT maximum length of ${MAX_SUMMARY_LENGTH} characters (aim for around ${TARGET_SUMMARY_LENGTH} characters or less).
   - Must NOT exceed ${MAX_SUMMARY_LENGTH} characters under any circumstance.
   - Punchy, engaging, highlighting key features.
2. "description":
   - Keep the exact Markdown formatting, structure, emojis (✨, •), and line breaks.
   - Must contain EXACTLY ${refBullets} bullet points (starting with "•").
   - Maintain the enthusiastic, professional tone.
3. Glossary & Terminology (use these terms where appropriate):
${glossaryTerms}

Input English metadata:
--- SUMMARY ---
${reference.summary}

--- DESCRIPTION ---
${reference.description}

Respond ONLY with a JSON object in this exact schema:
{
  "summary": "Translated summary under ${MAX_SUMMARY_LENGTH} characters",
  "description": "Translated full markdown description"
}`;

  const rawJson =
    provider === 'gemini'
      ? await callGemini(options.apiKey, model, prompt)
      : await callOpenAi(options.apiKey, model, prompt);

  const parsed = JSON.parse(rawJson) as MetadataContent;

  if (typeof parsed.summary !== 'string' || typeof parsed.description !== 'string') {
    throw new Error('Invalid translation response format: missing summary or description fields');
  }

  let summary = parsed.summary.trim();
  if (summary.length > MAX_SUMMARY_LENGTH) {
    console.warn(
      `⚠️ Translated summary for [${targetLocale}] was ${summary.length} characters (exceeds ${MAX_SUMMARY_LENGTH}). Truncating to fit limit.`,
    );
    summary = summary.slice(0, MAX_SUMMARY_LENGTH - 1).replace(/[,.\s]+$/, '') + '.';
  }

  return {
    summary,
    description: parsed.description.trim(),
  };
}

export function saveMetadata(locale: string, metadata: MetadataContent): void {
  const dir = path.join(STORE_METADATA_DIR, locale);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'summary.txt'), `${metadata.summary}\n`, 'utf-8');
  fs.writeFileSync(path.join(dir, 'description.md'), `${metadata.description}\n`, 'utf-8');
}
