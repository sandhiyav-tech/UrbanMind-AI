import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

let genAI: GoogleGenerativeAI | null = null;
if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

export interface AIServiceRequest<T> {
  systemPrompt: string;
  userPrompt: string;
  imageBase64?: string; // base64 string without data URL header or with
  mimeType?: string;
  schema: z.ZodType<T>;
  agentName: string;
  fallbackGenerator?: () => T;
}

/**
 * Strips data:image/...;base64, prefix if present
 */
function cleanBase64(base64: string): { data: string; mimeType: string } {
  const match = base64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], data: match[2] };
  }
  return { mimeType: 'image/jpeg', data: base64 };
}

/**
 * Clean markdown JSON fences like ```json ... ``` from model output
 */
function extractJSON(text: string): string {
  const jsonRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = text.match(jsonRegex);
  if (match && match[1]) {
    return match[1].trim();
  }
  return text.trim();
}

/**
 * Core AI wrapper for all agents
 * Implements strict Zod validation with 1 automatic retry on JSON / schema parse errors
 */
export async function executeAgent<T>(params: AIServiceRequest<T>): Promise<{ data: T; isDemo: boolean }> {
  const { systemPrompt, userPrompt, imageBase64, schema, agentName, fallbackGenerator } = params;

  if (!GEMINI_API_KEY || !genAI) {
    // Demo fallback mode when API key is not configured
    if (fallbackGenerator) {
      return { data: fallbackGenerator(), isDemo: true };
    }
    throw new Error(`Gemini API key is missing and no fallback generator was defined for ${agentName}`);
  }

  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: `${systemPrompt}\nYou must output pure valid JSON matching the schema. Do not add markdown commentary outside the JSON.`,
  });

  const parts: any[] = [{ text: userPrompt }];

  if (imageBase64) {
    const { data, mimeType } = cleanBase64(imageBase64);
    parts.push({
      inlineData: {
        data,
        mimeType: params.mimeType || mimeType,
      },
    });
  }

  // First Attempt
  try {
    const result = await model.generateContent(parts);
    const rawText = result.response.text();
    const cleanedJson = extractJSON(rawText);
    const parsed = JSON.parse(cleanedJson);
    const validated = schema.parse(parsed);
    return { data: validated, isDemo: false };
  } catch (firstErr) {
    console.warn(`[${agentName}] First attempt failed validation:`, firstErr, '. Retrying once...');

    // Retry once with error correction prompt
    try {
      const retryParts = [
        ...parts,
        {
          text: `Your previous response was invalid. Please return ONLY a valid JSON object matching the required structure without any markdown formatting or explanations.`,
        },
      ];
      const retryResult = await model.generateContent(retryParts);
      const retryRawText = retryResult.response.text();
      const retryCleaned = extractJSON(retryRawText);
      const retryParsed = JSON.parse(retryCleaned);
      const retryValidated = schema.parse(retryParsed);
      return { data: retryValidated, isDemo: false };
    } catch (retryErr) {
      console.error(`[${agentName}] Retry failed:`, retryErr);
      if (fallbackGenerator) {
        console.info(`[${agentName}] Using verified fallback demo response.`);
        return { data: fallbackGenerator(), isDemo: true };
      }
      throw new Error(`[${agentName}] Failed to generate valid output after retry: ${retryErr}`);
    }
  }
}
