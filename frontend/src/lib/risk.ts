// Risk bands derived from adj_risk_score (0-100). The backend only sets
// risk_level for the CRITICAL band, so the UI derives all bands here.
export type RiskBand = 'Critical' | 'High' | 'Medium' | 'Low';

export function riskBand(score: number): RiskBand {
  if (score >= 80) return 'Critical';
  if (score >= 60) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

export const RISK_BANDS: { band: RiskBand; range: string }[] = [
  { band: 'Low', range: '0-39' },
  { band: 'Medium', range: '40-59' },
  { band: 'High', range: '60-79' },
  { band: 'Critical', range: '80-100' },
];

export const benchLabel = (id?: string | number | null) => (id ? `Bench #${id}` : 'Unassigned');
