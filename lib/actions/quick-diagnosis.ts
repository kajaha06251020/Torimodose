import { compareSalary, type SalaryStatRow } from "@/lib/engine/salary-comparator";

export type QuickInput = {
  annualIncome: number;
  occupation: string;
  region: string;
  age: number;
};

export type QuickResult = {
  annualLoss: number;
  medianGap: number;
  median: number;
  p25: number;
  p75: number;
  percentile: string;
  found: true;
} | {
  found: false;
  message: string;
};

export function runQuickDiagnosis(
  input: QuickInput,
  stats: SalaryStatRow[]
): QuickResult {
  const comparison = compareSalary({
    annualIncome: input.annualIncome,
    occupation: input.occupation,
    region: input.region,
    age: input.age,
    stats,
  });

  if (!comparison) {
    return {
      found: false,
      message: "該当する統計データが見つかりませんでした。",
    };
  }

  return {
    found: true,
    annualLoss: comparison.annualLoss,
    medianGap: comparison.medianGap,
    median: comparison.median,
    p25: comparison.p25,
    p75: comparison.p75,
    percentile: comparison.percentile,
  };
}
