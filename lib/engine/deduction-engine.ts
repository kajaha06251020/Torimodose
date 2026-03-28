import {
  calcDeductionSaving,
  calcTaxableIncome,
  getIncomeTaxRate,
} from "./calculator";

export type FormulaType =
  | { type: "excess"; threshold: number }
  | { type: "fixed"; monthlyMax: number }
  | { type: "furusato"; selfBurden: number }
  | { type: "percentage"; rate: number; cap: number };

export type DeductionRule = {
  id: number;
  name: string;
  category: "income" | "credit";
  questionKey: string;
  condition: "not_using";
  formula: FormulaType;
  legalBasis: string;
  maxAmount: number | null;
  description: string;
  howTo: string;
};

export type UserAnswers = {
  annualIncome: number;
  [questionKey: string]: { using: boolean; amount?: number } | number;
};

export type DeductionResult = {
  name: string;
  category: "income" | "credit";
  potentialSaving: number;
  deductionAmount: number;
  legalBasis: string;
  description: string;
  howTo: string;
};

function calcFurusatoLimit(annualIncome: number): number {
  const taxableIncome = calcTaxableIncome(annualIncome);
  const rate = getIncomeTaxRate(taxableIncome);
  const limit = Math.floor(
    (taxableIncome * 0.1 * 0.2) / (1 - 0.1 - rate * 1.021) + 2_000
  );
  return Math.min(limit, annualIncome * 0.3);
}

function calcDeductionAmount(
  rule: DeductionRule,
  annualIncome: number,
  answer: { using: boolean; amount?: number }
): number {
  switch (rule.formula.type) {
    case "excess": {
      return 0;
    }
    case "fixed": {
      const annual = rule.formula.monthlyMax * 12;
      return rule.maxAmount ? Math.min(annual, rule.maxAmount) : annual;
    }
    case "furusato": {
      return calcFurusatoLimit(annualIncome) - rule.formula.selfBurden;
    }
    case "percentage": {
      const amount = annualIncome * rule.formula.rate;
      return Math.min(amount, rule.formula.cap);
    }
  }
}

export function evaluateDeductions(
  answers: UserAnswers,
  rules: DeductionRule[]
): DeductionResult[] {
  const results: DeductionResult[] = [];
  const annualIncome = answers.annualIncome as number;

  for (const rule of rules) {
    const answer = answers[rule.questionKey];
    if (!answer || typeof answer === "number") continue;
    if (answer.using) continue;

    const deductionAmount = calcDeductionAmount(rule, annualIncome, answer);

    const saving = calcDeductionSaving({
      annualIncome,
      deductionAmount,
      type: rule.category,
    });

    results.push({
      name: rule.name,
      category: rule.category,
      potentialSaving: saving.total,
      deductionAmount,
      legalBasis: rule.legalBasis,
      description: rule.description,
      howTo: rule.howTo,
    });
  }

  return results;
}
