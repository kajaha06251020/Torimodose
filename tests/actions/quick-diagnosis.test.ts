import { describe, it, expect } from "vitest";
import { runQuickDiagnosis, type QuickInput, type QuickResult } from "@/lib/actions/quick-diagnosis";

describe("runQuickDiagnosis", () => {
  it("returns loss amount when salary is below median", () => {
    const input: QuickInput = {
      annualIncome: 3_000_000,
      occupation: "software_engineer",
      region: "tokyo",
      age: 23,
    };

    const result = runQuickDiagnosis(input, [
      {
        occupation: "software_engineer",
        region: "tokyo",
        ageGroup: "20-24",
        median: 3_500_000,
        p25: 3_000_000,
        p75: 4_000_000,
      },
    ]);

    expect(result.annualLoss).toBe(500_000);
    expect(result.median).toBe(3_500_000);
    expect(result.percentile).toBe("p25_to_p50");
  });

  it("returns zero loss when salary is above median", () => {
    const input: QuickInput = {
      annualIncome: 5_000_000,
      occupation: "software_engineer",
      region: "tokyo",
      age: 27,
    };

    const result = runQuickDiagnosis(input, [
      {
        occupation: "software_engineer",
        region: "tokyo",
        ageGroup: "25-29",
        median: 4_500_000,
        p25: 3_800_000,
        p75: 5_200_000,
      },
    ]);

    expect(result.annualLoss).toBe(0);
    expect(result.medianGap).toBe(500_000);
  });
});
