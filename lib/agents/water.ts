import { z } from 'zod';
import { executeAgent } from '../ai';
import { SpecialistFinding } from '../types';

export const WaterAgentSchema = z.object({
  severity: z.number().int().min(1).max(5),
  confidence: z.number().min(0).max(1),
  evidence: z.string(),
  findings: z.string(),
});

export async function runWaterAgent(params: {
  imageBase64?: string;
  note?: string;
}): Promise<{ data: SpecialistFinding; isDemo: boolean }> {
  const systemPrompt = `You are the Water Resources & Drainage Specialist AI Agent for Greater Chennai Corporation and CMWSSB.
Analyze the provided image for water utilities and drainage issues: water pipe bursts, pressurized distribution leaks, stormwater drain blockages, street inundation, stagnant puddle pooling, sewage backflow, or canal chokepoints.

Assess:
- severity: integer 1 to 5 (1 = minor shallow runoff puddle, 3 = steady potable waterline leak or drain overflow covering curb, 5 = major main burst or deep arterial flooding exceeding 20cm causing transit shutdown)
- confidence: float 0.0 to 1.0 (confidence in water/drainage assessment)
- evidence: visual physical indicators (water depth, surface ripples, flow velocity, drain siltation, road coverage width)
- findings: brief technical summary

If NO water or drainage issues are observed, return severity: 1, confidence: 0.1, evidence: "No water pooling, pipe leaks, or drain blockages visible", findings: "Hydraulic infrastructure functioning or dry".

Return JSON strictly matching:
{
  "severity": number,
  "confidence": number,
  "evidence": string,
  "findings": string
}`;

  const userPrompt = `Analyze this image for water supply leaks, drainage failures, or street flooding.${params.note ? ` Citizen context: "${params.note}"` : ''}`;

  return executeAgent<SpecialistFinding>({
    agentName: 'WaterSpecialistAgent',
    systemPrompt,
    userPrompt,
    imageBase64: params.imageBase64,
    schema: WaterAgentSchema,
    fallbackGenerator: () => {
      const noteLower = (params.note || '').toLowerCase();
      if (noteLower.includes('water') || noteLower.includes('flood') || noteLower.includes('leak') || noteLower.includes('drain') || noteLower.includes('pipe')) {
        return {
          severity: 4,
          confidence: 0.91,
          evidence: 'Demo data: Visible standing water layer and pressurized seepage from municipal distribution joint.',
          findings: 'Demo data: Active water accumulation and utility breach causing local transit hazard.',
        };
      }
      return {
        severity: 1,
        confidence: 0.1,
        evidence: 'Demo data: Dry road surface; no standing pools or pipe fracture indicators visible.',
        findings: 'Demo data: Normal hydraulic status.',
      };
    },
  });
}
