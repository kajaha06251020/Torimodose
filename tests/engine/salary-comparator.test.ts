import { describe, it, expect } from "vitest";
import { compareSalary, type SalaryStatRow } from "@/lib/engine/salary-comparator";

const sampleStats: SalaryStatRow[] = [
  {
    occupation: "software_engineer",
    region: "tokyo",
    ageGroup: "25-29",
    median: 4_500_000,
    p25: 3_800_000,
    p75: 5_200_000,
  },
  {
    occupation: "software_engineer",
    region: "osaka",
    ageGroup: "25-29",
    median: 3_800_000,
    p25: 3_200_000,
    p75: 4_400_000,
  },
];

describe("compareSalary", () => {
  it("returns negative gap when salary is below median", () => {
    const result = compareSalary({
      annualIncome: 3_500_000,
      occupation: "software_engineer",
      region: "tokyo",
      age: 27,
      stats: sampleStats,
    });
    expect(result.medianGap).toBe(-1_000_000);
    expect(result.percentile).toBe("below_p25");
  });

  it("returns positive gap when salary is above median", () => {
    const result = compareSalary({
      annualIncome: 5_000_000,
      occupation: "software_engineer",
      region: "tokyo",
      age: 27,
      stats: sampleStats,
    });
    expect(result.medianGap).toBe(500_000);
    expect(result.percentile).toBe("p50_to_p75");
  });

  it("returns null when no matching stat found", () => {
    const result = compareSalary({
      annualIncome: 3_500_000,
      occupation: "unknown_job",
      region: "tokyo",
      age: 27,
      stats: sampleStats,
    });
    expect(result).toBeNull();
  });

  it("maps age to correct age group", () => {
    const result = compareSalary({
      annualIncome: 4_000_000,
      occupation: "software_engineer",
      region: "osaka",
      age: 25,
      stats: sampleStats,
    });
    expect(result).not.toBeNull();
    expect(result!.median).toBe(3_800_000);
  });
});
