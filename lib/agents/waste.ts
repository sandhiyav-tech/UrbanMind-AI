import { z } from 'zod';
import { executeAgent } from '../ai';
import { SpecialistFinding } from '../types';

export const WasteAgentSchema = z.object({
  severity: z.number().int().min(1).max(5),
  confidence: z.number().min(0).max(1),
  evidence: z.string(),
  findings: z.string(),
});

export async function runWasteAgent(params: {
  imageBase64?: string;
  note?: string;
}): Promise<{ data: SpecialistFinding; isDemo: boolean }> {
  const systemPrompt = `You are the Solid Waste & Sanitation Specialist AI Agent for Greater Chennai Corporation.
Analyze the provided image for municipal sanitation issues: garbage accumulation, overflowing Urbaser/GCC dustbins, illegal dumping of commercial or construction debris, plastic choke points, or scattered street litter.

Assess:
- severity: integer 1 to 5 (1 = minor roadside litter, 3 = overflowing municipal bin spilling onto curb, 5 = massive illegal dump or decaying organic waste obstructing public transit/drainage)
- confidence: float 0.0 to 1.0 (confidence in waste assessment)
- evidence: visual physical indicators (estimated volume, bin overflow state, plastic debris, organic matter, pedestrian path blockage)
- findings: brief technical summary

If NO municipal waste issues are observed, return severity: 1, confidence: 0.1, evidence: "No waste accumulation or overflowing receptacles visible", findings: "Sanitation level acceptable".

Return JSON strictly matching:
{
  "severity": number,
  "confidence": number,
  "evidence": string,
  "findings": string
}`;

  const userPrompt = `Analyze this image for solid waste and sanitation mismanagement.${params.note ? ` Citizen context: "${params.note}"` : ''}`;

  return executeAgent<SpecialistFinding>({
    agentName: 'WasteSpecialistAgent',
    systemPrompt,
    userPrompt,
    imageBase64: params.imageBase64,
    schema: WasteAgentSchema,
    fallbackGenerator: () => {
      const noteLower = (params.note || '').toLowerCase();
      if (noteLower.includes('garbage') || noteLower.includes('waste') || noteLower.includes('trash') || noteLower.includes('dump') || noteLower.includes('bin')) {
        return {
          severity: 4,
          confidence: 0.94,
          evidence: 'Demo data: Substantial accumulation of unsegregated municipal refuse overflowing public collection perimeter.',
          findings: 'Demo data: Waste overflow presenting sanitation hazard and pedestrian obstruction.',
        };
      }
      return {
        severity: 1,
        confidence: 0.15,
        evidence: 'Demo data: Minimal or baseline street litter; no major uncollected dump detected.',
        findings: 'Demo data: Standard urban cleanliness level maintained.',
      };
    },
  });
}
