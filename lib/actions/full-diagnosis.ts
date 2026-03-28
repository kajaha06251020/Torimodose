import {
  evaluateDeductions,
  type DeductionRule,
  type DeductionResult,
} from "@/lib/engine/deduction-engine";

export type FullInput = {
  annualIncome: number;
  answers: Record<string, { using: boolean; amount?: number }>;
};

export type FullResult = {
  deductions: DeductionResult[];
  totalPotentialSaving: number;
};

export function runFullDiagnosis(
  input: FullInput,
  rules: DeductionRule[]
): FullResult {
  const userAnswers = {
    annualIncome: input.annualIncome,
    ...input.answers,
  };

  const deductions = evaluateDeductions(userAnswers, rules);
  const totalPotentialSaving = deductions.reduce(
    (sum, d) => sum + d.potentialSaving,
    0
  );

  return {
    deductions,
    totalPotentialSaving,
  };
}
