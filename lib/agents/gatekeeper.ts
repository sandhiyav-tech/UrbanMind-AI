import { z } from 'zod';
import { executeAgent } from '../ai';
import { GatekeeperResult } from '../types';

export const GatekeeperSchema = z.object({
  valid: z.boolean(),
  reason: z.string(),
});

export async function runGatekeeperAgent(params: {
  imageBase64?: string;
  note?: string;
}): Promise<{ data: GatekeeperResult; isDemo: boolean }> {
  const systemPrompt = `You are the UrbanMind Gatekeeper AI Agent for Greater Chennai Corporation.
Your job is to screen citizen image submissions and determine whether an uploaded photo represents a genuine urban municipal infrastructure, public works, sanitation, or civic issue in Chennai (such as potholes, road cracks, garbage dumps, overflowing dustbins, water leaks, pipe bursts, street waterlogging, or damaged public sidewalks).

If the image is a selfie, animal, indoor living room, cartoon, screenshot of unrelated text, food dish, or private personal item, set "valid": false with a clear reason.
If the image shows urban infrastructure, roadways, stormwater drains, waste piles, or public utilities, set "valid": true.

Return JSON strictly matching:
{
  "valid": boolean,
  "reason": "Detailed explanation of why this is or is not a valid urban municipal issue"
}`;

  const userPrompt = `Evaluate this citizen submission.${params.note ? ` Citizen Note: "${params.note}"` : ''}`;

  return executeAgent<GatekeeperResult>({
    agentName: 'GatekeeperAgent',
    systemPrompt,
    userPrompt,
    imageBase64: params.imageBase64,
    schema: GatekeeperSchema,
    fallbackGenerator: () => {
      // Smart fallback based on note if key is missing
      const noteLower = (params.note || '').toLowerCase();
      if (noteLower.includes('cat') || noteLower.includes('selfie') || noteLower.includes('food')) {
        return {
          valid: false,
          reason: 'Demo evaluation: Submission does not appear to show municipal infrastructure or urban utility hazards.',
        };
      }
      return {
        valid: true,
        reason: 'Demo evaluation: Valid Chennai urban infrastructure issue detected (roads, sanitation, or municipal water utility).',
      };
    },
  });
}
