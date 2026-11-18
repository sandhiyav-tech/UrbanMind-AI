import { z } from 'zod';
import { executeAgent } from '../ai';
import { SpecialistFinding } from '../types';

export const RoadAgentSchema = z.object({
  severity: z.number().int().min(1).max(5),
  confidence: z.number().min(0).max(1),
  evidence: z.string(),
  findings: z.string(),
});

export async function runRoadAgent(params: {
  imageBase64?: string;
  note?: string;
}): Promise<{ data: SpecialistFinding; isDemo: boolean }> {
  const systemPrompt = `You are the Road & Pavement Specialist AI Agent for Greater Chennai Corporation.
Analyze the provided image for roadway defects: potholes, pavement craters, structural asphalt fissures, curb displacement, edge deterioration, or damage caused by traffic subsidence.

Assess:
- severity: integer 1 to 5 (1 = hairline surface distress, 3 = moderate pothole/cracking slowing traffic, 5 = severe structural crater or cave-in posing imminent hazard to vehicles/two-wheelers)
- confidence: float 0.0 to 1.0 (confidence in road defect assessment)
- evidence: visual physical indicators (approximate dimensions, depth indicators, aggregate exposure, vehicle track patterns)
- findings: brief technical summary

If NO road damage is observed, return severity: 1, confidence: 0.1, evidence: "No roadway structural defects visible", findings: "Road surface intact or absent from view".

Return JSON strictly matching:
{
  "severity": number,
  "confidence": number,
  "evidence": string,
  "findings": string
}`;

  const userPrompt = `Analyze this image for road and pavement damage.${params.note ? ` Citizen context: "${params.note}"` : ''}`;

  return executeAgent<SpecialistFinding>({
    agentName: 'RoadSpecialistAgent',
    systemPrompt,
    userPrompt,
    imageBase64: params.imageBase64,
    schema: RoadAgentSchema,
    fallbackGenerator: () => {
      const noteLower = (params.note || '').toLowerCase();
      if (noteLower.includes('pothole') || noteLower.includes('crack') || noteLower.includes('road')) {
        return {
          severity: 4,
          confidence: 0.92,
          evidence: 'Demo data: Visible cavity in asphalt layer with aggregate wear and vehicle wheel path disruption.',
          findings: 'Demo data: Significant pothole and pavement surface deterioration requiring prompt cold-mix repair.',
        };
      }
      return {
        severity: 1,
        confidence: 0.2,
        evidence: 'Demo data: No major pavement distress detected in current view.',
        findings: 'Demo data: Road pavement appears passable with baseline surface wear.',
      };
    },
  });
}
