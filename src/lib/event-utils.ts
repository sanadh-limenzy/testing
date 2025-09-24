export interface DefendabilityScoreParams {
  description: string;
  peopleCount: number;
  duration: boolean;
  digitalValuation: boolean;
  moneyPaidToPersonnel: boolean;
  evidenceSupporting: boolean;
}

export interface DefendabilityScoreResult {
  writtenNotes: boolean;
  morePeople: boolean;
  moreDuration: boolean;
  digitalValuation: boolean;
  moneyPaidToPersonnel: boolean;
  evidenceSupporting: boolean;
}

const defendabilityScore = (
  params: DefendabilityScoreParams
): DefendabilityScoreResult => {
  const {
    description,
    peopleCount,
    duration,
    digitalValuation,
    moneyPaidToPersonnel,
    evidenceSupporting,
  } = params;

  return {
    writtenNotes: description.length > 3,
    morePeople: peopleCount >= 3,
    moreDuration: duration,
    digitalValuation: digitalValuation,
    moneyPaidToPersonnel: moneyPaidToPersonnel,
    evidenceSupporting: evidenceSupporting,
  };
};

const totalDefendabilityScore = (params: DefendabilityScoreParams): number => {
  return Object.values(defendabilityScore(params)).filter(Boolean).length;
};

const eventUtils = {
  defendabilityScore,
  totalDefendabilityScore,
};

export default eventUtils;
