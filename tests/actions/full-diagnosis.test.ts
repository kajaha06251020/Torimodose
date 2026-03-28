import { describe, it, expect } from "vitest";
import { runFullDiagnosis, type FullInput } from "@/lib/actions/full-diagnosis";
import type { DeductionRule } from "@/lib/engine/deduction-engine";

const testRules: DeductionRule[] = [
  {
    id: 1,
    name: "iDeCo（小規模企業共済等掛金控除）",
    category: "income",
    questionKey: "ideco",
    condition: "not_using",
    formula: { type: "fixed", monthlyMax: 23000 },
    legalBasis: "所得税法第75条",
    maxAmount: 276000,
    description: "iDeCoの掛金は全額が所得控除対象。",
    howTo: "証券会社でiDeCo口座を開設する。",
  },
  {
    id: 2,
    name: "ふるさと納税（寄附金控除）",
    category: "income",
    questionKey: "furusato_nozei",
    condition: "not_using",
    formula: { type: "furusato", selfBurden: 2000 },
    legalBasis: "所得税法第78条",
    maxAmount: null,
    description: "寄附金のうち2,000円を超える部分が控除される。",
    howTo: "ふるさと納税サイトで寄附を行う。",
  },
];

describe("runFullDiagnosis", () => {
  it("returns missed deductions and total potential saving", () => {
    const input: FullInput = {
      annualIncome: 4_000_000,
      answers: {
        ideco: { using: false },
        furusato_nozei: { using: false },
      },
    };

    const result = runFullDiagnosis(input, testRules);

    expect(result.deductions).toHaveLength(2);
    expect(result.totalPotentialSaving).toBeGreaterThan(0);
    expect(result.deductions[0].legalBasis).toBeTruthy();
  });

  it("returns empty when user uses all deductions", () => {
    const input: FullInput = {
      annualIncome: 4_000_000,
      answers: {
        ideco: { using: true },
        furusato_nozei: { using: true },
      },
    };

    const result = runFullDiagnosis(input, testRules);

    expect(result.deductions).toHaveLength(0);
    expect(result.totalPotentialSaving).toBe(0);
  });
});
