import { describe, it, expect } from "vitest";
import {
  evaluateDeductions,
  type DeductionRule,
  type UserAnswers,
  type DeductionResult,
} from "@/lib/engine/deduction-engine";

const sampleRules: DeductionRule[] = [
  {
    id: 1,
    name: "医療費控除",
    category: "income",
    questionKey: "medical_expenses",
    condition: "not_using",
    formula: { type: "excess", threshold: 100_000 },
    legalBasis: "所得税法第73条",
    maxAmount: null,
    description: "年間医療費が10万円を超える場合、超過分が所得控除される",
    howTo: "確定申告で医療費控除を申請。領収書を保管しておく。",
  },
  {
    id: 2,
    name: "iDeCo（小規模企業共済等掛金控除）",
    category: "income",
    questionKey: "ideco",
    condition: "not_using",
    formula: { type: "fixed", monthlyMax: 23_000 },
    legalBasis: "所得税法第75条",
    maxAmount: 276_000,
    description: "iDeCoの掛金全額が所得控除される",
    howTo: "証券会社でiDeCo口座を開設し、掛金を設定する。",
  },
  {
    id: 3,
    name: "ふるさと納税（寄附金控除）",
    category: "income",
    questionKey: "furusato_nozei",
    condition: "not_using",
    formula: { type: "furusato", selfBurden: 2_000 },
    legalBasis: "所得税法第78条",
    maxAmount: null,
    description: "寄附金のうち2,000円を超える部分が控除される",
    howTo: "ふるさと納税サイトで寄附を行い、ワンストップ特例または確定申告で申請。",
  },
];

describe("evaluateDeductions", () => {
  it("returns missed deductions when user is not using them", () => {
    const answers: UserAnswers = {
      annualIncome: 4_000_000,
      medical_expenses: { using: false },
      ideco: { using: false },
      furusato_nozei: { using: false },
    };

    const results = evaluateDeductions(answers, sampleRules);

    expect(results).toHaveLength(3);
    expect(results[0].name).toBe("医療費控除");
    expect(results[1].name).toBe("iDeCo（小規模企業共済等掛金控除）");
    expect(results[1].potentialSaving).toBeGreaterThan(0);
  });

  it("excludes deductions the user is already using", () => {
    const answers: UserAnswers = {
      annualIncome: 4_000_000,
      medical_expenses: { using: true, amount: 200_000 },
      ideco: { using: true },
      furusato_nozei: { using: false },
    };

    const results = evaluateDeductions(answers, sampleRules);

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("ふるさと納税（寄附金控除）");
  });

  it("calculates iDeCo potential saving correctly", () => {
    const answers: UserAnswers = {
      annualIncome: 4_000_000,
      medical_expenses: { using: true, amount: 0 },
      ideco: { using: false },
      furusato_nozei: { using: true },
    };

    const results = evaluateDeductions(answers, sampleRules);

    expect(results).toHaveLength(1);
    const ideco = results[0];
    expect(ideco.name).toBe("iDeCo（小規模企業共済等掛金控除）");
    // 276,000 * (10% income tax + 10% resident tax) = 55,200
    expect(ideco.potentialSaving).toBe(55_200);
  });

  it("returns empty array when all deductions are used", () => {
    const answers: UserAnswers = {
      annualIncome: 4_000_000,
      medical_expenses: { using: true, amount: 200_000 },
      ideco: { using: true },
      furusato_nozei: { using: true },
    };

    const results = evaluateDeductions(answers, sampleRules);
    expect(results).toHaveLength(0);
  });
});
