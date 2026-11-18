import { z } from 'zod';
import { executeAgent } from '../ai';
import { runGatekeeperAgent } from './gatekeeper';
import { runRoadAgent } from './road';
import { runWasteAgent } from './waste';
import { runWaterAgent } from './water';
import { getZoneById, MIN_ZONE_DENSITY, MAX_ZONE_DENSITY } from '../zones';
import { IssueType, PriorityBreakdown, SpecialistFinding, GatekeeperResult } from '../types';

export const DecisionOutputSchema = z.object({
  issue_type: z.enum(['road', 'waste', 'water', 'other', 'invalid']),
  severity: z.number().int().min(1).max(5),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  recommended_actions: z.array(z.string()).min(1),
  needs_human_review: z.boolean(),
});

export type DecisionOutput = z.infer<typeof DecisionOutputSchema>;

export function calculatePriorityScore(params: {
  severity: number;
  confidence: number;
  zoneDensity: number;
  openIssueCount: number;
}): { score: number; breakdown: PriorityBreakdown } {
  const { severity, confidence, zoneDensity, openIssueCount } = params;

  // severity_norm: 1 to 5 mapped to 0.0 to 1.0
  const severity_norm = Math.max(0, Math.min(1, (severity - 1) / 4));

  // confidence: clamped 0 to 1
  const conf = Math.max(0, Math.min(1, confidence));

  // zone_density_norm: normalized between Chennai minimum and maximum
  const densityRange = MAX_ZONE_DENSITY - MIN_ZONE_DENSITY;
  const zone_density_norm = densityRange > 0
    ? Math.max(0, Math.min(1, (zoneDensity - MIN_ZONE_DENSITY) / densityRange))
    : 0.5;

  // open_issue_count_norm: normalized against a threshold of 10 open issues
  const open_issue_count_norm = Math.max(0, Math.min(1, openIssueCount / 10));

  // Priority formula: 0.5*severity_norm + 0.2*confidence + 0.2*zone_density_norm + 0.1*open_issue_count_norm
  const weightedSum =
    0.5 * severity_norm +
    0.2 * conf +
    0.2 * zone_density_norm +
    0.1 * open_issue_count_norm;

  const score = Number((weightedSum * 100).toFixed(1));

  const formula = `0.5*(${severity_norm.toFixed(2)}) + 0.2*(${conf.toFixed(2)}) + 0.2*(${zone_density_norm.toFixed(2)}) + 0.1*(${open_issue_count_norm.toFixed(2)}) = ${(weightedSum * 100).toFixed(1)}/100`;

  return {
    score,
    breakdown: {
      severity_norm: Number(severity_norm.toFixed(3)),
      confidence: Number(conf.toFixed(3)),
      zone_density_norm: Number(zone_density_norm.toFixed(3)),
      open_issue_count_norm: Number(open_issue_count_norm.toFixed(3)),
      raw_score: score,
      formula,
    },
  };
}

export interface CompleteAnalysisResult {
  valid: boolean;
  issue_type: IssueType;
  severity: number;
  confidence: number;
  priority_score: number;
  priority_breakdown: PriorityBreakdown;
  reasoning: string;
  recommended_actions: string[];
  needs_human_review: boolean;
  isDemo: boolean;
  specialist_findings: {
    gatekeeper: GatekeeperResult;
    road: SpecialistFinding;
    waste: SpecialistFinding;
    water: SpecialistFinding;
  };
}

export async function orchestrateUrbanIssueAnalysis(params: {
  imageBase64: string;
  zoneId: string;
  note?: string;
  openIssueCountInZone?: number;
}): Promise<CompleteAnalysisResult> {
  const { imageBase64, zoneId, note = '', openIssueCountInZone = 3 } = params;
  const zone = getZoneById(zoneId);
  const zoneName = zone ? zone.name : 'Chennai Central';
  const zoneDensity = zone ? zone.population_density : 18000;

  // Step 1: Gatekeeper Agent screening
  const gatekeeperRes = await runGatekeeperAgent({ imageBase64, note });
  if (!gatekeeperRes.data.valid) {
    const invalidBreakdown: PriorityBreakdown = {
      severity_norm: 0,
      confidence: 1,
      zone_density_norm: 0,
      open_issue_count_norm: 0,
      raw_score: 0,
      formula: 'Rejected by Gatekeeper: Image does not depict urban municipal infrastructure',
    };

    return {
      valid: false,
      issue_type: 'invalid',
      severity: 1,
      confidence: 0.95,
      priority_score: 0,
      priority_breakdown: invalidBreakdown,
      reasoning: gatekeeperRes.data.reason,
      recommended_actions: ['Reject submission: Photo must depict public infrastructure, roadway, sanitation, or drainage issues'],
      needs_human_review: true,
      isDemo: gatekeeperRes.isDemo,
      specialist_findings: {
        gatekeeper: gatekeeperRes.data,
        road: { severity: 1, confidence: 0, evidence: 'Skipped - Invalid submission', findings: 'Not inspected' },
        waste: { severity: 1, confidence: 0, evidence: 'Skipped - Invalid submission', findings: 'Not inspected' },
        water: { severity: 1, confidence: 0, evidence: 'Skipped - Invalid submission', findings: 'Not inspected' },
      },
    };
  }

  // Step 2: Run 3 Specialist Agents in parallel
  const [roadRes, wasteRes, waterRes] = await Promise.all([
    runRoadAgent({ imageBase64, note }),
    runWasteAgent({ imageBase64, note }),
    runWaterAgent({ imageBase64, note }),
  ]);

  const road = roadRes.data;
  const waste = wasteRes.data;
  const water = waterRes.data;
  const isDemo = gatekeeperRes.isDemo || roadRes.isDemo || wasteRes.isDemo || waterRes.isDemo;

  // Step 3: Decision Agent synthesis
  const systemPrompt = `You are the Lead Decision Agent for Greater Chennai Corporation Urban Operations Center.
You synthesize findings from three specialist agents (Road, Waste, Water) and zone context (density, existing issue load) to make an executive determination.

Inputs:
Zone: ${zoneName} (Population Density: ${zoneDensity} people/km²)
Current Zone Open Issue Count: ${openIssueCountInZone}
Citizen Note: "${note}"
Specialist Findings:
- Road Specialist: Severity ${road.severity}/5 (Confidence ${road.confidence.toFixed(2)}) | Findings: ${road.findings} | Evidence: ${road.evidence}
- Waste Specialist: Severity ${waste.severity}/5 (Confidence ${waste.confidence.toFixed(2)}) | Findings: ${waste.findings} | Evidence: ${waste.evidence}
- Water Specialist: Severity ${water.severity}/5 (Confidence ${water.confidence.toFixed(2)}) | Findings: ${water.findings} | Evidence: ${water.evidence}

Rules:
1. Select the dominant issue_type from: "road", "waste", "water", "other". Pick the type with highest severity and confidence.
2. Determine overall severity (integer 1-5).
3. Determine confidence (float 0.0-1.0).
4. Formulate executive reasoning explaining the civic impact on Chennai citizens in ${zoneName}.
5. Provide 2 to 4 actionable, specific recommended_actions for municipal field teams (GCC, CMWSSB, or traffic police).
6. Set "needs_human_review": true if confidence < 0.60 OR severity >= 4; otherwise false.

Return JSON strictly matching:
{
  "issue_type": "road" | "waste" | "water" | "other",
  "severity": number,
  "confidence": number,
  "reasoning": string,
  "recommended_actions": string[],
  "needs_human_review": boolean
}`;

  const userPrompt = `Synthesize these specialist findings into a final municipal determination.`;

  const fallbackDecision = (): DecisionOutput => {
    // Intelligent fallback determination based on specialist scores
    const scores = [
      { type: 'road' as IssueType, score: road.severity * road.confidence, sev: road.severity, conf: road.confidence },
      { type: 'waste' as IssueType, score: waste.severity * waste.confidence, sev: waste.severity, conf: waste.confidence },
      { type: 'water' as IssueType, score: water.severity * water.confidence, sev: water.severity, conf: water.confidence },
    ];
    scores.sort((a, b) => b.score - a.score);
    const dominant = scores[0];

    const actionsMap: Record<IssueType, string[]> = {
      road: [
        `Deploy GCC emergency cold-mix patching squad to ${zoneName}`,
        'Barricade affected lane and alert traffic control',
        'Schedule subgrade geotechnical review',
      ],
      waste: [
        `Dispatch motorized compactor truck to ${zoneName} collection zone`,
        'Apply lime powder disinfectant across affected perimeter',
        'Issue notice to commercial establishments adjacent to dump',
      ],
      water: [
        `Alert Chennai Metro Water (CMWSSB) Area Operations Engineer for ${zoneName}`,
        'Deploy submersible dewatering pump unit to clear road pooling',
        'Inspect upstream feeder valve for pressure regulation',
      ],
      other: ['Deploy GCC ward inspector for field assessment'],
      invalid: ['Reject submission'],
    };

    const sev = dominant.sev > 1 ? dominant.sev : 3;
    const conf = dominant.conf > 0.4 ? dominant.conf : 0.88;

    return {
      issue_type: dominant.type,
      severity: sev,
      confidence: conf,
      reasoning: `Demo data: Multi-agent consensus identifies critical ${dominant.type} infrastructure distress in ${zoneName} with density of ${zoneDensity}/km². Immediate intervention required to prevent civic disruption.`,
      recommended_actions: actionsMap[dominant.type] || actionsMap.road,
      needs_human_review: conf < 0.6 || sev >= 4,
    };
  };

  const decisionRes = await executeAgent<DecisionOutput>({
    agentName: 'DecisionAgent',
    systemPrompt,
    userPrompt,
    schema: DecisionOutputSchema,
    fallbackGenerator: fallbackDecision,
  });

  const finalOutput = decisionRes.data;

  // Enforce rule: If confidence < 0.6 or severity >= 4 -> needs_human_review = true
  if (finalOutput.confidence < 0.6 || finalOutput.severity >= 4) {
    finalOutput.needs_human_review = true;
  }

  // Calculate official priority score using exact formula
  const { score, breakdown } = calculatePriorityScore({
    severity: finalOutput.severity,
    confidence: finalOutput.confidence,
    zoneDensity,
    openIssueCount: openIssueCountInZone,
  });

  return {
    valid: true,
    issue_type: finalOutput.issue_type,
    severity: finalOutput.severity,
    confidence: finalOutput.confidence,
    priority_score: score,
    priority_breakdown: breakdown,
    reasoning: finalOutput.reasoning,
    recommended_actions: finalOutput.recommended_actions,
    needs_human_review: finalOutput.needs_human_review,
    isDemo: isDemo || decisionRes.isDemo,
    specialist_findings: {
      gatekeeper: gatekeeperRes.data,
      road,
      waste,
      water,
    },
  };
}
