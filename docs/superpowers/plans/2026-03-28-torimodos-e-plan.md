# Torimodose Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build "Torimodose" — a web app that shows young Japanese workers how much money they're losing by comparing their salary to public statistics and diagnosing unused tax deductions via a rule engine.

**Architecture:** Next.js App Router with Server Actions for form processing. Neon Postgres via Drizzle ORM for data. Rule engine evaluates deduction eligibility from DB-stored rules. No AI/LLM — pure computation. Authentication via NextAuth with email-only anonymous accounts.

**Tech Stack:** Next.js 16, React, TypeScript, Drizzle ORM, Neon Postgres (pgvector not needed — no AI), shadcn/ui, NextAuth, Vitest, Vercel

---

## File Structure

```
torimodose/
├── app/
│   ├── layout.tsx                          ← Root layout (Geist font, shadcn theme)
│   ├── page.tsx                            ← Landing: QuickInputForm
│   ├── result/
│   │   ├── quick/page.tsx                  ← Quick result: loss amount display
│   │   └── full/page.tsx                   ← Full result: deduction list + savings
│   ├── diagnosis/page.tsx                  ← Wizard: Yes/No questions
│   ├── dashboard/page.tsx                  ← Past diagnoses (authenticated)
│   ├── auth/
│   │   ├── login/page.tsx                  ← Login form
│   │   └── signup/page.tsx                 ← Signup form
│   └── api/
│       └── auth/[...nextauth]/route.ts     ← NextAuth handler
├── components/
│   ├── ui/                                 ← shadcn/ui components
│   ├── forms/
│   │   ├── QuickInputForm.tsx              ← 3-field form (salary, occupation, region)
│   │   └── DiagnosisWizard.tsx             ← Step-by-step Yes/No wizard
│   ├── results/
│   │   ├── LossDisplay.tsx                 ← Big red loss number
│   │   └── DeductionCard.tsx               ← Individual deduction detail card
│   └── layout/
│       ├── Header.tsx                      ← Site header
│       └── Footer.tsx                      ← Site footer
├── lib/
│   ├── engine/
│   │   ├── salary-comparator.ts            ← Compare user salary to statistics
│   │   ├── deduction-engine.ts             ← Rule engine: evaluate all deductions
│   │   └── calculator.ts                   ← Tax rate lookup + deduction math
│   ├── db/
│   │   ├── schema.ts                       ← Drizzle schema (all 4 tables)
│   │   ├── index.ts                        ← DB connection
│   │   └── seed.ts                         ← Seed salary stats + deduction rules
│   ├── actions/
│   │   ├── quick-diagnosis.ts              ← Server Action: quick diagnosis
│   │   └── full-diagnosis.ts               ← Server Action: full diagnosis
│   ├── auth.ts                             ← NextAuth config
│   └── crypto.ts                           ← AES-256-GCM encrypt/decrypt for diagnosis input
├── tests/
│   ├── engine/
│   │   ├── salary-comparator.test.ts       ← Salary comparison tests
│   │   ├── deduction-engine.test.ts        ← Rule engine tests
│   │   └── calculator.test.ts              ← Tax calculation tests
│   ├── actions/
│   │   ├── quick-diagnosis.test.ts         ← Quick diagnosis action tests
│   │   └── full-diagnosis.test.ts          ← Full diagnosis action tests
│   └── crypto.test.ts                      ← Encryption round-trip tests
├── drizzle.config.ts                       ← Drizzle Kit config
├── .env.local.example                      ← Environment variable template
└── seed-data/
    ├── salary-statistics.json              ← Preprocessed salary data from e-Stat
    └── deduction-rules.json                ← All deduction rules with formulas
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`, `tailwind.config.ts`, `.env.local.example`

- [ ] **Step 1: Create Next.js project**

```bash
cd D:/playground/Torimodose
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --turbopack
```

Expected: Next.js project scaffolded with App Router.

- [ ] **Step 2: Install core dependencies**

```bash
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit
npm install next-auth@beta
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 3: Initialize shadcn/ui**

```bash
npx shadcn@latest init
```

Select: New York style, Zinc color, CSS variables enabled.

Then add the components we'll need:

```bash
npx shadcn@latest add button card input label select progress
```

- [ ] **Step 4: Create environment variable template**

Create `.env.local.example`:

```env
# Database (Neon Postgres via Vercel Marketplace)
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# NextAuth
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000

# Encryption key for diagnosis data (32 bytes hex)
ENCRYPTION_KEY=generate-with-openssl-rand-hex-32
```

- [ ] **Step 5: Configure Vitest**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

Create `tests/setup.ts`:

```typescript
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 6: Add test script to package.json**

Add to `package.json` scripts:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 7: Verify setup**

```bash
npm run dev
```

Expected: Next.js dev server starts on localhost:3000.

```bash
npm run test
```

Expected: Vitest runs with 0 tests (no failures).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with shadcn/ui, Drizzle, Vitest"
```

---

## Task 2: Tax Calculator

The calculator is the foundation — other modules depend on it. It provides tax rate lookups and deduction math.

**Files:**
- Create: `lib/engine/calculator.ts`
- Test: `tests/engine/calculator.test.ts`

- [ ] **Step 1: Write failing tests for tax rate lookup**

Create `tests/engine/calculator.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  getIncomeTaxRate,
  calcIncomeTax,
  calcResidentTax,
  calcDeductionSaving,
} from "@/lib/engine/calculator";

describe("getIncomeTaxRate", () => {
  it("returns 5% for taxable income under 1,950,000", () => {
    expect(getIncomeTaxRate(1_500_000)).toBe(0.05);
  });

  it("returns 10% for taxable income 1,950,001 - 3,300,000", () => {
    expect(getIncomeTaxRate(2_500_000)).toBe(0.1);
  });

  it("returns 20% for taxable income 3,300,001 - 6,950,000", () => {
    expect(getIncomeTaxRate(4_000_000)).toBe(0.2);
  });

  it("returns 23% for taxable income 6,950,001 - 9,000,000", () => {
    expect(getIncomeTaxRate(8_000_000)).toBe(0.23);
  });

  it("returns 33% for taxable income 9,000,001 - 18,000,000", () => {
    expect(getIncomeTaxRate(12_000_000)).toBe(0.33);
  });
});

describe("calcDeductionSaving", () => {
  it("calculates saving from income deduction (income tax + resident tax)", () => {
    // 年収400万 → 課税所得約266万 → 所得税率10%
    // 控除額10万 → 所得税10,000 + 住民税10,000 = 20,000円の節税
    const saving = calcDeductionSaving({
      annualIncome: 4_000_000,
      deductionAmount: 100_000,
      type: "income",
    });
    expect(saving.incomeTax).toBe(10_000);
    expect(saving.residentTax).toBe(10_000);
    expect(saving.total).toBe(20_000);
  });

  it("calculates saving from tax credit deduction", () => {
    // 税額控除は税額から直接引く
    const saving = calcDeductionSaving({
      annualIncome: 4_000_000,
      deductionAmount: 100_000,
      type: "credit",
    });
    expect(saving.total).toBe(100_000);
  });
});

describe("calcIncomeTax", () => {
  it("calculates income tax for annual income 3,000,000", () => {
    // 給与所得控除後: 3,000,000 - 980,000 = 2,020,000
    // 基礎控除: 480,000
    // 課税所得: 2,020,000 - 480,000 = 1,540,000
    // 所得税: 1,540,000 * 5% = 77,000
    const tax = calcIncomeTax(3_000_000);
    expect(tax).toBe(77_000);
  });

  it("calculates income tax for annual income 5,000,000", () => {
    // 給与所得控除後: 5,000,000 - 1,440,000 = 3,560,000
    // 基礎控除: 480,000
    // 課税所得: 3,560,000 - 480,000 = 3,080,000
    // 所得税: 1,950,000 * 5% + 1,130,000 * 10% = 97,500 + 113,000 = 210,500
    const tax = calcIncomeTax(5_000_000);
    expect(tax).toBe(210_500);
  });
});

describe("calcResidentTax", () => {
  it("calculates resident tax at flat 10%", () => {
    // 住民税は課税所得の一律10%
    const tax = calcResidentTax(3_000_000);
    // 課税所得 1,540,000 * 10% = 154,000
    expect(tax).toBe(154_000);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/engine/calculator.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement calculator**

Create `lib/engine/calculator.ts`:

```typescript
/**
 * 所得税の税率テーブル（2026年度）
 * 参照: 所得税法第89条
 */
const TAX_BRACKETS = [
  { upper: 1_950_000, rate: 0.05, deduction: 0 },
  { upper: 3_300_000, rate: 0.1, deduction: 97_500 },
  { upper: 6_950_000, rate: 0.2, deduction: 427_500 },
  { upper: 9_000_000, rate: 0.23, deduction: 636_000 },
  { upper: 18_000_000, rate: 0.33, deduction: 1_536_000 },
  { upper: 40_000_000, rate: 0.4, deduction: 2_796_000 },
  { upper: Infinity, rate: 0.45, deduction: 4_796_000 },
] as const;

const RESIDENT_TAX_RATE = 0.1;

/**
 * 給与所得控除額を計算（所得税法第28条）
 */
export function calcEmploymentIncomeDeduction(annualIncome: number): number {
  if (annualIncome <= 1_625_000) return 550_000;
  if (annualIncome <= 1_800_000) return annualIncome * 0.4 - 100_000;
  if (annualIncome <= 3_600_000) return annualIncome * 0.3 + 80_000;
  if (annualIncome <= 6_600_000) return annualIncome * 0.2 + 440_000;
  if (annualIncome <= 8_500_000) return annualIncome * 0.1 + 1_100_000;
  return 1_950_000;
}

/**
 * 課税所得を計算
 * 給与収入 → 給与所得控除 → 基礎控除(48万) → 課税所得
 */
export function calcTaxableIncome(annualIncome: number): number {
  const employmentDeduction = calcEmploymentIncomeDeduction(annualIncome);
  const basicDeduction = 480_000;
  const taxable = annualIncome - employmentDeduction - basicDeduction;
  return Math.max(0, taxable);
}

/**
 * 課税所得から所得税率を返す
 */
export function getIncomeTaxRate(taxableIncome: number): number {
  for (const bracket of TAX_BRACKETS) {
    if (taxableIncome <= bracket.upper) {
      return bracket.rate;
    }
  }
  return 0.45;
}

/**
 * 所得税額を計算（累進課税）
 */
export function calcIncomeTax(annualIncome: number): number {
  const taxableIncome = calcTaxableIncome(annualIncome);
  for (const bracket of TAX_BRACKETS) {
    if (taxableIncome <= bracket.upper) {
      return Math.floor(taxableIncome * bracket.rate - bracket.deduction);
    }
  }
  return 0;
}

/**
 * 住民税額を計算（一律10%）
 */
export function calcResidentTax(annualIncome: number): number {
  const taxableIncome = calcTaxableIncome(annualIncome);
  return Math.floor(taxableIncome * RESIDENT_TAX_RATE);
}

/**
 * 控除による節税額を計算
 */
export function calcDeductionSaving(params: {
  annualIncome: number;
  deductionAmount: number;
  type: "income" | "credit";
}): { incomeTax: number; residentTax: number; total: number } {
  if (params.type === "credit") {
    return {
      incomeTax: params.deductionAmount,
      residentTax: 0,
      total: params.deductionAmount,
    };
  }

  const taxableIncome = calcTaxableIncome(params.annualIncome);
  const rate = getIncomeTaxRate(taxableIncome);
  const incomeTax = Math.floor(params.deductionAmount * rate);
  const residentTax = Math.floor(params.deductionAmount * RESIDENT_TAX_RATE);

  return {
    incomeTax,
    residentTax,
    total: incomeTax + residentTax,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/engine/calculator.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/engine/calculator.ts tests/engine/calculator.test.ts
git commit -m "feat: add tax calculator with bracket lookup and deduction savings"
```

---

## Task 3: Salary Comparator

Compares user salary to statistical data. For now, uses hardcoded sample data. Task 7 (seed) will load real data.

**Files:**
- Create: `lib/engine/salary-comparator.ts`
- Test: `tests/engine/salary-comparator.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/engine/salary-comparator.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/engine/salary-comparator.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement salary comparator**

Create `lib/engine/salary-comparator.ts`:

```typescript
export type SalaryStatRow = {
  occupation: string;
  region: string;
  ageGroup: string;
  median: number;
  p25: number;
  p75: number;
};

export type ComparisonResult = {
  median: number;
  p25: number;
  p75: number;
  medianGap: number;
  percentile: "below_p25" | "p25_to_p50" | "p50_to_p75" | "above_p75";
  annualLoss: number;
};

function ageToGroup(age: number): string {
  if (age < 20) return "under_20";
  if (age <= 24) return "20-24";
  if (age <= 29) return "25-29";
  if (age <= 34) return "30-34";
  if (age <= 39) return "35-39";
  if (age <= 44) return "40-44";
  if (age <= 49) return "45-49";
  if (age <= 54) return "50-54";
  if (age <= 59) return "55-59";
  return "60_plus";
}

function getPercentile(
  income: number,
  stat: SalaryStatRow
): ComparisonResult["percentile"] {
  if (income < stat.p25) return "below_p25";
  if (income < stat.median) return "p25_to_p50";
  if (income < stat.p75) return "p50_to_p75";
  return "above_p75";
}

export function compareSalary(params: {
  annualIncome: number;
  occupation: string;
  region: string;
  age: number;
  stats: SalaryStatRow[];
}): ComparisonResult | null {
  const ageGroup = ageToGroup(params.age);

  const stat = params.stats.find(
    (s) =>
      s.occupation === params.occupation &&
      s.region === params.region &&
      s.ageGroup === ageGroup
  );

  if (!stat) return null;

  const medianGap = params.annualIncome - stat.median;
  const annualLoss = medianGap < 0 ? Math.abs(medianGap) : 0;

  return {
    median: stat.median,
    p25: stat.p25,
    p75: stat.p75,
    medianGap,
    percentile: getPercentile(params.annualIncome, stat),
    annualLoss,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/engine/salary-comparator.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/engine/salary-comparator.ts tests/engine/salary-comparator.test.ts
git commit -m "feat: add salary comparator with age group mapping and percentile"
```

---

## Task 4: Deduction Rule Engine

The core value: evaluates which tax deductions a user is missing.

**Files:**
- Create: `lib/engine/deduction-engine.ts`
- Test: `tests/engine/deduction-engine.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/engine/deduction-engine.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/engine/deduction-engine.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement deduction engine**

Create `lib/engine/deduction-engine.ts`:

```typescript
import { calcDeductionSaving, calcTaxableIncome, getIncomeTaxRate } from "./calculator";

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
  // 簡易計算: 住民税所得割額の20% + 所得税からの控除
  const residentTaxBase = taxableIncome * 0.1;
  const limit = Math.floor(residentTaxBase * 0.2 / (1 - 0.1 - rate * 1.021) + 2_000);
  return Math.min(limit, annualIncome * 0.3);
}

function calcDeductionAmount(
  rule: DeductionRule,
  annualIncome: number,
  answer: { using: boolean; amount?: number }
): number {
  switch (rule.formula.type) {
    case "excess": {
      // 医療費控除: 実費は不明なので、平均的な超過額で推定
      // ここでは「使っていない」ケースなので潜在的な控除機会を示す
      return 0; // 金額不明の場合は0（結果には「申請すれば取り戻せる可能性」として表示）
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/engine/deduction-engine.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/engine/deduction-engine.ts tests/engine/deduction-engine.test.ts
git commit -m "feat: add deduction rule engine with formula evaluation"
```

---

## Task 5: Database Schema and Seed Data

**Files:**
- Create: `lib/db/schema.ts`, `lib/db/index.ts`, `lib/db/seed.ts`, `drizzle.config.ts`, `seed-data/salary-statistics.json`, `seed-data/deduction-rules.json`

- [ ] **Step 1: Create Drizzle config**

Create `drizzle.config.ts`:

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

- [ ] **Step 2: Create DB schema**

Create `lib/db/schema.ts`:

```typescript
import {
  pgTable,
  uuid,
  text,
  timestamp,
  serial,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const diagnoses = pgTable("diagnoses", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  type: text("type", { enum: ["quick", "full"] }).notNull(),
  input: text("input").notNull(), // AES-256-GCM encrypted JSON string
  result: jsonb("result").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const salaryStatistics = pgTable("salary_statistics", {
  id: serial("id").primaryKey(),
  year: integer("year").notNull(),
  occupation: text("occupation").notNull(),
  region: text("region").notNull(),
  ageGroup: text("age_group").notNull(),
  median: integer("median").notNull(),
  p25: integer("p25").notNull(),
  p75: integer("p75").notNull(),
  source: text("source").notNull(),
});

export const deductionRules = pgTable("deduction_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category", { enum: ["income", "credit"] }).notNull(),
  questionKey: text("question_key").notNull(),
  condition: text("condition").notNull(),
  formula: jsonb("formula").notNull(),
  legalBasis: text("legal_basis").notNull(),
  maxAmount: integer("max_amount"),
  description: text("description").notNull(),
  howTo: text("how_to").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

- [ ] **Step 3: Create DB connection**

Create `lib/db/index.ts`:

```typescript
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

- [ ] **Step 4: Create salary statistics seed data**

Create `seed-data/salary-statistics.json`:

```json
[
  { "year": 2024, "occupation": "software_engineer", "region": "tokyo", "ageGroup": "20-24", "median": 3500000, "p25": 3000000, "p75": 4000000, "source": "厚労省賃金構造基本統計調査2024" },
  { "year": 2024, "occupation": "software_engineer", "region": "tokyo", "ageGroup": "25-29", "median": 4500000, "p25": 3800000, "p75": 5200000, "source": "厚労省賃金構造基本統計調査2024" },
  { "year": 2024, "occupation": "software_engineer", "region": "osaka", "ageGroup": "20-24", "median": 3200000, "p25": 2700000, "p75": 3700000, "source": "厚労省賃金構造基本統計調査2024" },
  { "year": 2024, "occupation": "software_engineer", "region": "osaka", "ageGroup": "25-29", "median": 3800000, "p25": 3200000, "p75": 4400000, "source": "厚労省賃金構造基本統計調査2024" },
  { "year": 2024, "occupation": "sales", "region": "tokyo", "ageGroup": "20-24", "median": 3200000, "p25": 2700000, "p75": 3800000, "source": "厚労省賃金構造基本統計調査2024" },
  { "year": 2024, "occupation": "sales", "region": "tokyo", "ageGroup": "25-29", "median": 4000000, "p25": 3300000, "p75": 4800000, "source": "厚労省賃金構造基本統計調査2024" },
  { "year": 2024, "occupation": "office_admin", "region": "tokyo", "ageGroup": "20-24", "median": 2900000, "p25": 2500000, "p75": 3400000, "source": "厚労省賃金構造基本統計調査2024" },
  { "year": 2024, "occupation": "office_admin", "region": "tokyo", "ageGroup": "25-29", "median": 3500000, "p25": 3000000, "p75": 4100000, "source": "厚労省賃金構造基本統計調査2024" },
  { "year": 2024, "occupation": "marketing", "region": "tokyo", "ageGroup": "20-24", "median": 3300000, "p25": 2800000, "p75": 3900000, "source": "厚労省賃金構造基本統計調査2024" },
  { "year": 2024, "occupation": "marketing", "region": "tokyo", "ageGroup": "25-29", "median": 4200000, "p25": 3500000, "p75": 5000000, "source": "厚労省賃金構造基本統計調査2024" }
]
```

- [ ] **Step 5: Create deduction rules seed data**

Create `seed-data/deduction-rules.json`:

```json
[
  {
    "name": "医療費控除",
    "category": "income",
    "questionKey": "medical_expenses",
    "condition": "not_using",
    "formula": { "type": "excess", "threshold": 100000 },
    "legalBasis": "所得税法第73条",
    "maxAmount": 2000000,
    "description": "年間の医療費が10万円を超える場合、超過分が所得控除される。家族の分も合算可能。",
    "howTo": "確定申告で医療費控除を申請する。領収書またはマイナポータルの医療費通知を用意する。"
  },
  {
    "name": "ふるさと納税（寄附金控除）",
    "category": "income",
    "questionKey": "furusato_nozei",
    "condition": "not_using",
    "formula": { "type": "furusato", "selfBurden": 2000 },
    "legalBasis": "所得税法第78条、地方税法第37条の2",
    "maxAmount": null,
    "description": "自治体への寄附金のうち2,000円を超える部分が所得税と住民税から控除される。返礼品も受け取れる。",
    "howTo": "ふるさと納税サイト（さとふる、ふるなび等）で寄附を行う。5自治体以内ならワンストップ特例で確定申告不要。"
  },
  {
    "name": "iDeCo（小規模企業共済等掛金控除）",
    "category": "income",
    "questionKey": "ideco",
    "condition": "not_using",
    "formula": { "type": "fixed", "monthlyMax": 23000 },
    "legalBasis": "所得税法第75条",
    "maxAmount": 276000,
    "description": "iDeCoの掛金は全額が所得控除対象。将来の年金を積み立てながら節税できる。",
    "howTo": "証券会社（SBI証券、楽天証券等）でiDeCo口座を開設する。会社員は月額上限23,000円。"
  },
  {
    "name": "生命保険料控除",
    "category": "income",
    "questionKey": "life_insurance",
    "condition": "not_using",
    "formula": { "type": "fixed", "monthlyMax": 10000 },
    "legalBasis": "所得税法第76条",
    "maxAmount": 120000,
    "description": "生命保険・介護医療保険・個人年金保険の保険料が所得控除される。各区分最大4万円、合計最大12万円。",
    "howTo": "年末調整時に保険会社から届く控除証明書を勤務先に提出する。"
  },
  {
    "name": "地震保険料控除",
    "category": "income",
    "questionKey": "earthquake_insurance",
    "condition": "not_using",
    "formula": { "type": "fixed", "monthlyMax": 4166 },
    "legalBasis": "所得税法第77条",
    "maxAmount": 50000,
    "description": "地震保険料が所得控除される。最大5万円。",
    "howTo": "年末調整時に保険会社から届く控除証明書を勤務先に提出する。"
  },
  {
    "name": "住宅ローン控除（住宅借入金等特別控除）",
    "category": "credit",
    "questionKey": "housing_loan",
    "condition": "not_using",
    "formula": { "type": "percentage", "rate": 0.007, "cap": 210000 },
    "legalBasis": "租税特別措置法第41条",
    "maxAmount": 210000,
    "description": "住宅ローン残高の0.7%が最大13年間、税額から直接控除される。",
    "howTo": "初年度は確定申告が必要。2年目以降は年末調整で適用可能。"
  },
  {
    "name": "扶養控除",
    "category": "income",
    "questionKey": "dependents",
    "condition": "not_using",
    "formula": { "type": "fixed", "monthlyMax": 31666 },
    "legalBasis": "所得税法第84条",
    "maxAmount": 380000,
    "description": "16歳以上の扶養親族がいる場合、38万円の所得控除（特定扶養は63万円）。",
    "howTo": "年末調整の扶養控除等申告書に扶養親族を記載する。"
  },
  {
    "name": "配偶者控除",
    "category": "income",
    "questionKey": "spouse",
    "condition": "not_using",
    "formula": { "type": "fixed", "monthlyMax": 31666 },
    "legalBasis": "所得税法第83条",
    "maxAmount": 380000,
    "description": "配偶者の年収が103万円以下の場合、38万円の所得控除。103万〜201万円は配偶者特別控除。",
    "howTo": "年末調整の配偶者控除等申告書に配偶者の情報を記載する。"
  },
  {
    "name": "勤労学生控除",
    "category": "income",
    "questionKey": "working_student",
    "condition": "not_using",
    "formula": { "type": "fixed", "monthlyMax": 2250 },
    "legalBasis": "所得税法第82条",
    "maxAmount": 270000,
    "description": "働きながら学校に通っている場合、27万円の所得控除。",
    "howTo": "年末調整の扶養控除等申告書に勤労学生の欄を記載する。在学証明書が必要。"
  },
  {
    "name": "雑損控除",
    "category": "income",
    "questionKey": "casualty_loss",
    "condition": "not_using",
    "formula": { "type": "excess", "threshold": 100000 },
    "legalBasis": "所得税法第72条",
    "maxAmount": null,
    "description": "災害・盗難・横領による損失がある場合、一定額が所得控除される。",
    "howTo": "確定申告で雑損控除を申請する。被害額を証明する書類（罹災証明書等）が必要。"
  }
]
```

- [ ] **Step 6: Create seed script**

Create `lib/db/seed.ts`:

```typescript
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import salaryData from "../../seed-data/salary-statistics.json";
import deductionData from "../../seed-data/deduction-rules.json";

async function seed() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  console.log("Seeding salary statistics...");
  for (const row of salaryData) {
    await db.insert(schema.salaryStatistics).values({
      year: row.year,
      occupation: row.occupation,
      region: row.region,
      ageGroup: row.ageGroup,
      median: row.median,
      p25: row.p25,
      p75: row.p75,
      source: row.source,
    });
  }
  console.log(`Inserted ${salaryData.length} salary statistics rows.`);

  console.log("Seeding deduction rules...");
  for (const rule of deductionData) {
    await db.insert(schema.deductionRules).values({
      name: rule.name,
      category: rule.category as "income" | "credit",
      questionKey: rule.questionKey,
      condition: rule.condition,
      formula: rule.formula,
      legalBasis: rule.legalBasis,
      maxAmount: rule.maxAmount,
      description: rule.description,
      howTo: rule.howTo,
    });
  }
  console.log(`Inserted ${deductionData.length} deduction rules.`);

  console.log("Seed complete.");
}

seed().catch(console.error);
```

- [ ] **Step 7: Add seed script to package.json**

Add to `package.json` scripts:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:seed": "npx tsx lib/db/seed.ts"
  }
}
```

- [ ] **Step 8: Commit**

```bash
git add lib/db/ drizzle.config.ts seed-data/ .env.local.example
git commit -m "feat: add database schema, seed data for salary stats and deduction rules"
```

---

## Task 6: Encryption Utility

Encrypt/decrypt diagnosis input data with AES-256-GCM.

**Files:**
- Create: `lib/crypto.ts`
- Test: `tests/crypto.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/crypto.test.ts`:

```typescript
import { describe, it, expect, beforeAll } from "vitest";
import { encrypt, decrypt } from "@/lib/crypto";

// Test with a fixed key (32 bytes hex = 64 chars)
const TEST_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

describe("crypto", () => {
  it("encrypts and decrypts a string round-trip", () => {
    const plaintext = JSON.stringify({ annualIncome: 4000000, occupation: "engineer" });
    const encrypted = encrypt(plaintext, TEST_KEY);
    const decrypted = decrypt(encrypted, TEST_KEY);
    expect(decrypted).toBe(plaintext);
  });

  it("produces different ciphertext for same plaintext (random IV)", () => {
    const plaintext = "same input";
    const a = encrypt(plaintext, TEST_KEY);
    const b = encrypt(plaintext, TEST_KEY);
    expect(a).not.toBe(b);
  });

  it("fails to decrypt with wrong key", () => {
    const plaintext = "secret";
    const encrypted = encrypt(plaintext, TEST_KEY);
    const wrongKey = "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";
    expect(() => decrypt(encrypted, wrongKey)).toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/crypto.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement crypto**

Create `lib/crypto.ts`:

```typescript
import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

export function encrypt(plaintext: string, keyHex: string): string {
  const key = Buffer.from(keyHex, "hex");
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  // Format: base64(iv + tag + ciphertext)
  const combined = Buffer.concat([iv, tag, encrypted]);
  return combined.toString("base64");
}

export function decrypt(ciphertext: string, keyHex: string): string {
  const key = Buffer.from(keyHex, "hex");
  const combined = Buffer.from(ciphertext, "base64");

  const iv = combined.subarray(0, IV_LENGTH);
  const tag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/crypto.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/crypto.ts tests/crypto.test.ts
git commit -m "feat: add AES-256-GCM encryption for diagnosis data"
```

---

## Task 7: Server Actions (Quick + Full Diagnosis)

**Files:**
- Create: `lib/actions/quick-diagnosis.ts`, `lib/actions/full-diagnosis.ts`
- Test: `tests/actions/quick-diagnosis.test.ts`, `tests/actions/full-diagnosis.test.ts`

- [ ] **Step 1: Write failing test for quick diagnosis**

Create `tests/actions/quick-diagnosis.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/actions/quick-diagnosis.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement quick diagnosis**

Create `lib/actions/quick-diagnosis.ts`:

```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/actions/quick-diagnosis.test.ts
```

Expected: PASS.

- [ ] **Step 5: Write failing test for full diagnosis**

Create `tests/actions/full-diagnosis.test.ts`:

```typescript
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
```

- [ ] **Step 6: Run test to verify it fails**

```bash
npx vitest run tests/actions/full-diagnosis.test.ts
```

Expected: FAIL.

- [ ] **Step 7: Implement full diagnosis**

Create `lib/actions/full-diagnosis.ts`:

```typescript
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
```

- [ ] **Step 8: Run all tests**

```bash
npx vitest run
```

Expected: All tests PASS.

- [ ] **Step 9: Commit**

```bash
git add lib/actions/ tests/actions/
git commit -m "feat: add quick and full diagnosis server actions"
```

---

## Task 8: Landing Page + Quick Input Form

**Files:**
- Create: `components/forms/QuickInputForm.tsx`, `components/layout/Header.tsx`, `components/layout/Footer.tsx`
- Modify: `app/layout.tsx`, `app/page.tsx`

- [ ] **Step 1: Create Header**

Create `components/layout/Header.tsx`:

```tsx
import Link from "next/link";

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto flex h-14 items-center px-4">
        <Link href="/" className="text-lg font-bold tracking-wider">
          TORIMODOSE
        </Link>
        <nav className="ml-auto flex gap-4 text-sm">
          <Link href="/auth/login" className="text-muted-foreground hover:text-foreground">
            ログイン
          </Link>
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Create Footer**

Create `components/layout/Footer.tsx`:

```tsx
export function Footer() {
  return (
    <footer className="border-t py-6 text-center text-sm text-muted-foreground">
      <div className="container mx-auto px-4">
        <p>統計データ出典: 厚生労働省 賃金構造基本統計調査、国税庁 民間給与実態統計調査</p>
        <p className="mt-1">本サービスは税務アドバイスを提供するものではありません。正確な判断は税理士にご相談ください。</p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Update root layout**

Update `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TORIMODOSE - あなたの損失額を可視化する",
  description: "給与相場との比較と未申請の控除・給付金を診断。若者のための経済的武装ツール。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Create QuickInputForm**

Create `components/forms/QuickInputForm.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const OCCUPATIONS = [
  { value: "software_engineer", label: "エンジニア・IT" },
  { value: "sales", label: "営業" },
  { value: "office_admin", label: "事務・管理" },
  { value: "marketing", label: "マーケティング・企画" },
] as const;

const REGIONS = [
  { value: "tokyo", label: "東京都" },
  { value: "osaka", label: "大阪府" },
  { value: "kanagawa", label: "神奈川県" },
  { value: "aichi", label: "愛知県" },
  { value: "fukuoka", label: "福岡県" },
] as const;

export function QuickInputForm() {
  const router = useRouter();
  const [annualIncome, setAnnualIncome] = useState("");
  const [occupation, setOccupation] = useState("");
  const [region, setRegion] = useState("");
  const [age, setAge] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({
      income: annualIncome,
      occupation,
      region,
      age,
    });
    router.push(`/result/quick?${params.toString()}`);
  }

  const isValid = annualIncome && occupation && region && age;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="annualIncome">年収（万円）</Label>
        <Input
          id="annualIncome"
          type="number"
          placeholder="例: 350"
          value={annualIncome}
          onChange={(e) => setAnnualIncome(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="age">年齢</Label>
        <Input
          id="age"
          type="number"
          placeholder="例: 24"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          min={18}
          max={65}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>職種</Label>
        <Select value={occupation} onValueChange={setOccupation}>
          <SelectTrigger>
            <SelectValue placeholder="選択してください" />
          </SelectTrigger>
          <SelectContent>
            {OCCUPATIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>勤務地</Label>
        <Select value={region} onValueChange={setRegion}>
          <SelectTrigger>
            <SelectValue placeholder="選択してください" />
          </SelectTrigger>
          <SelectContent>
            {REGIONS.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={!isValid}>
        損失額を診断する
      </Button>
    </form>
  );
}
```

- [ ] **Step 5: Create landing page**

Update `app/page.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuickInputForm } from "@/components/forms/QuickInputForm";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            あなたは年間いくら
            <span className="text-red-600">損している</span>か
          </h1>
          <p className="mt-4 text-muted-foreground">
            3つの情報を入力するだけで、同年代・同職種の給与相場との差額がわかる。
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">かんたん診断（10秒）</CardTitle>
          </CardHeader>
          <CardContent>
            <QuickInputForm />
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          入力データはサーバーに保存されません
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Verify in browser**

```bash
npm run dev
```

Open http://localhost:3000. Confirm:
- Header with TORIMODOSE logo
- Form with 4 fields (年収, 年齢, 職種, 勤務地)
- Submit button disabled until all fields filled
- Footer with data source attribution

- [ ] **Step 7: Commit**

```bash
git add app/ components/
git commit -m "feat: add landing page with quick input form"
```

---

## Task 9: Quick Result Page

**Files:**
- Create: `app/result/quick/page.tsx`, `components/results/LossDisplay.tsx`

- [ ] **Step 1: Create LossDisplay component**

Create `components/results/LossDisplay.tsx`:

```tsx
type LossDisplayProps = {
  annualLoss: number;
  median: number;
  percentile: string;
};

const PERCENTILE_LABELS: Record<string, string> = {
  below_p25: "下位25%未満",
  p25_to_p50: "下位25〜50%",
  p50_to_p75: "上位25〜50%",
  above_p75: "上位25%以上",
};

export function LossDisplay({ annualLoss, median, percentile }: LossDisplayProps) {
  const hasLoss = annualLoss > 0;

  return (
    <div className="text-center">
      <p className="text-sm text-muted-foreground">あなたの推定損失額</p>
      <p className={`mt-2 text-5xl font-black ${hasLoss ? "text-red-600" : "text-green-600"}`}>
        {hasLoss ? "-" : "+"}¥{annualLoss.toLocaleString()}
        <span className="text-base font-normal text-muted-foreground">/年</span>
      </p>
      <div className="mt-4 space-y-1 text-sm text-muted-foreground">
        <p>同年代・同職種の中央値: ¥{median.toLocaleString()}</p>
        <p>あなたの位置: {PERCENTILE_LABELS[percentile] ?? percentile}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create quick result page**

Create `app/result/quick/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LossDisplay } from "@/components/results/LossDisplay";
import { runQuickDiagnosis } from "@/lib/actions/quick-diagnosis";
import { db } from "@/lib/db";
import { salaryStatistics } from "@/lib/db/schema";

type Props = {
  searchParams: Promise<{
    income?: string;
    occupation?: string;
    region?: string;
    age?: string;
  }>;
};

export default async function QuickResultPage({ searchParams }: Props) {
  const params = await searchParams;

  if (!params.income || !params.occupation || !params.region || !params.age) {
    redirect("/");
  }

  const stats = await db.select().from(salaryStatistics);
  const statRows = stats.map((s) => ({
    occupation: s.occupation,
    region: s.region,
    ageGroup: s.ageGroup,
    median: s.median,
    p25: s.p25,
    p75: s.p75,
  }));

  const result = runQuickDiagnosis(
    {
      annualIncome: parseInt(params.income) * 10_000,
      occupation: params.occupation,
      region: params.region,
      age: parseInt(params.age),
    },
    statRows
  );

  if (!result.found) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">{result.message}</p>
        <Link href="/" className="mt-4 inline-block text-sm underline">
          もう一度試す
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-lg space-y-8">
        <Card>
          <CardContent className="pt-8 pb-8">
            <LossDisplay
              annualLoss={result.annualLoss}
              median={result.median}
              percentile={result.percentile}
            />
          </CardContent>
        </Card>

        {result.annualLoss > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">
              さらに、使っていない控除・給付金で取り戻せるお金があるかもしれません。
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Link href={`/diagnosis?income=${params.income}&age=${params.age}`} className="block">
            <Button className="w-full" size="lg">
              正確な取り戻し額を診断する
            </Button>
          </Link>
          <Link href="/" className="block text-center text-sm text-muted-foreground underline">
            もう一度試す
          </Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Fill in the form on the landing page and submit. Confirm:
- Redirects to `/result/quick?income=...&occupation=...&region=...&age=...`
- Shows loss amount in large red text (or green if above median)
- Shows median and percentile position
- "正確な取り戻し額を診断する" button links to /diagnosis

Note: This requires the database to be set up and seeded. If DB is not ready yet, the page will error. That's expected — DB setup (Task 5) provides the seed command.

- [ ] **Step 4: Commit**

```bash
git add app/result/ components/results/
git commit -m "feat: add quick result page with loss display"
```

---

## Task 10: Diagnosis Wizard (Yes/No Questions)

**Files:**
- Create: `components/forms/DiagnosisWizard.tsx`, `app/diagnosis/page.tsx`

- [ ] **Step 1: Create DiagnosisWizard**

Create `components/forms/DiagnosisWizard.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

type Question = {
  key: string;
  text: string;
  followUp?: string;
};

const QUESTIONS: Question[] = [
  { key: "medical_expenses", text: "年間の医療費が10万円を超えましたか？", followUp: "医療費の合計額（万円）" },
  { key: "furusato_nozei", text: "ふるさと納税をしていますか？" },
  { key: "ideco", text: "iDeCo（個人型確定拠出年金）に加入していますか？" },
  { key: "life_insurance", text: "生命保険に加入していますか？" },
  { key: "earthquake_insurance", text: "地震保険に加入していますか？" },
  { key: "housing_loan", text: "住宅ローンを組んでいますか？" },
  { key: "spouse", text: "配偶者はいますか？（年収103万円以下）" },
  { key: "dependents", text: "16歳以上の扶養家族はいますか？" },
  { key: "working_student", text: "働きながら学校に通っていますか？" },
  { key: "casualty_loss", text: "災害・盗難の被害を受けましたか？" },
];

type Props = {
  annualIncome: number;
  age: number;
};

export function DiagnosisWizard({ annualIncome, age }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { using: boolean; amount?: number }>>({});
  const [followUpValue, setFollowUpValue] = useState("");

  const currentQuestion = QUESTIONS[step];
  const progress = ((step) / QUESTIONS.length) * 100;

  function handleAnswer(using: boolean) {
    if (using && currentQuestion.followUp) {
      // Show follow-up input
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.key]: { using, amount: undefined },
      }));
      return;
    }

    const newAnswers = {
      ...answers,
      [currentQuestion.key]: { using },
    };
    setAnswers(newAnswers);
    advance(newAnswers);
  }

  function handleFollowUp() {
    const amount = parseInt(followUpValue) * 10_000;
    const newAnswers = {
      ...answers,
      [currentQuestion.key]: { using: true, amount },
    };
    setAnswers(newAnswers);
    setFollowUpValue("");
    advance(newAnswers);
  }

  function advance(currentAnswers: typeof answers) {
    if (step + 1 >= QUESTIONS.length) {
      // All questions answered, go to full result
      const encoded = encodeURIComponent(
        JSON.stringify({
          annualIncome,
          answers: currentAnswers,
        })
      );
      router.push(`/result/full?data=${encoded}`);
    } else {
      setStep(step + 1);
    }
  }

  const showFollowUp =
    answers[currentQuestion?.key]?.using === true && currentQuestion?.followUp;

  return (
    <div className="space-y-6">
      <Progress value={progress} className="h-2" />
      <p className="text-sm text-muted-foreground text-center">
        {step + 1} / {QUESTIONS.length}
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl leading-relaxed">
            {currentQuestion.text}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showFollowUp ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{currentQuestion.followUp}</p>
              <Input
                type="number"
                placeholder="例: 15"
                value={followUpValue}
                onChange={(e) => setFollowUpValue(e.target.value)}
                autoFocus
              />
              <Button onClick={handleFollowUp} className="w-full" disabled={!followUpValue}>
                次へ
              </Button>
            </div>
          ) : (
            <div className="flex gap-4">
              <Button
                onClick={() => handleAnswer(true)}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                はい
              </Button>
              <Button
                onClick={() => handleAnswer(false)}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                いいえ
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Create diagnosis page**

Create `app/diagnosis/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { DiagnosisWizard } from "@/components/forms/DiagnosisWizard";

type Props = {
  searchParams: Promise<{
    income?: string;
    age?: string;
  }>;
};

export default async function DiagnosisPage({ searchParams }: Props) {
  const params = await searchParams;

  if (!params.income || !params.age) {
    redirect("/");
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">控除・給付金の診断</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            10個の質問に答えるだけ。あなたが取り戻せるお金がわかります。
          </p>
        </div>

        <DiagnosisWizard
          annualIncome={parseInt(params.income) * 10_000}
          age={parseInt(params.age)}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify in browser**

Navigate to `/diagnosis?income=350&age=24`. Confirm:
- Progress bar advances with each answer
- Yes/No buttons for each question
- Follow-up input appears for medical expenses when "はい"
- After final question, redirects to `/result/full`

- [ ] **Step 4: Commit**

```bash
git add components/forms/DiagnosisWizard.tsx app/diagnosis/
git commit -m "feat: add diagnosis wizard with step-by-step Yes/No questions"
```

---

## Task 11: Full Result Page

**Files:**
- Create: `app/result/full/page.tsx`, `components/results/DeductionCard.tsx`

- [ ] **Step 1: Create DeductionCard**

Create `components/results/DeductionCard.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DeductionCardProps = {
  name: string;
  potentialSaving: number;
  legalBasis: string;
  description: string;
  howTo: string;
};

export function DeductionCard({
  name,
  potentialSaving,
  legalBasis,
  description,
  howTo,
}: DeductionCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{name}</CardTitle>
          <span className="text-lg font-bold text-red-600">
            ¥{potentialSaving.toLocaleString()}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{legalBasis}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm">{description}</p>
        <div className="rounded bg-muted p-3">
          <p className="text-xs font-medium text-muted-foreground">取り戻す方法</p>
          <p className="mt-1 text-sm">{howTo}</p>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Create full result page**

Create `app/result/full/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DeductionCard } from "@/components/results/DeductionCard";
import { runFullDiagnosis } from "@/lib/actions/full-diagnosis";
import { db } from "@/lib/db";
import { deductionRules } from "@/lib/db/schema";
import type { DeductionRule } from "@/lib/engine/deduction-engine";

type Props = {
  searchParams: Promise<{
    data?: string;
  }>;
};

export default async function FullResultPage({ searchParams }: Props) {
  const params = await searchParams;

  if (!params.data) {
    redirect("/");
  }

  let parsedData: { annualIncome: number; answers: Record<string, { using: boolean; amount?: number }> };
  try {
    parsedData = JSON.parse(decodeURIComponent(params.data));
  } catch {
    redirect("/");
  }

  const rulesFromDb = await db.select().from(deductionRules);
  const rules: DeductionRule[] = rulesFromDb.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category as "income" | "credit",
    questionKey: r.questionKey,
    condition: r.condition,
    formula: r.formula as DeductionRule["formula"],
    legalBasis: r.legalBasis,
    maxAmount: r.maxAmount,
    description: r.description,
    howTo: r.howTo,
  }));

  const result = runFullDiagnosis(parsedData, rules);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-lg space-y-8">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">取り戻せる可能性のある金額</p>
          <p className="mt-2 text-5xl font-black text-red-600">
            ¥{result.totalPotentialSaving.toLocaleString()}
            <span className="text-base font-normal text-muted-foreground">/年</span>
          </p>
        </div>

        {result.deductions.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">
              あなたが使っていない控除 ({result.deductions.length}件)
            </h2>
            {result.deductions.map((d) => (
              <DeductionCard
                key={d.name}
                name={d.name}
                potentialSaving={d.potentialSaving}
                legalBasis={d.legalBasis}
                description={d.description}
                howTo={d.howTo}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
            <p className="font-medium text-green-800">
              素晴らしい。主要な控除はすべて活用できています。
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Link href="/auth/signup" className="block">
            <Button variant="outline" className="w-full" size="lg">
              結果を保存する（無料アカウント作成）
            </Button>
          </Link>
          <Link href="/" className="block text-center text-sm text-muted-foreground underline">
            もう一度診断する
          </Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify in browser**

Complete the full flow: Landing → Quick Result → Diagnosis Wizard → Full Result. Confirm:
- Total potential saving displayed in large red text
- Each unused deduction shown as a card with name, saving amount, legal basis, description, and how-to
- "結果を保存する" button links to signup

- [ ] **Step 4: Commit**

```bash
git add app/result/full/ components/results/DeductionCard.tsx
git commit -m "feat: add full diagnosis result page with deduction cards"
```

---

## Task 12: Authentication (NextAuth)

**Files:**
- Create: `lib/auth.ts`, `app/api/auth/[...nextauth]/route.ts`, `app/auth/login/page.tsx`, `app/auth/signup/page.tsx`

- [ ] **Step 1: Create NextAuth config**

Create `lib/auth.ts`:

```typescript
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        if (!credentials?.email || typeof credentials.email !== "string") return null;

        const email = credentials.email;

        // Find or create user
        let user = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .then((rows) => rows[0]);

        if (!user) {
          const result = await db
            .insert(users)
            .values({ email })
            .returning();
          user = result[0];
        }

        return { id: user.id, email: user.email };
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
```

- [ ] **Step 2: Create auth route handler**

Create `app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

- [ ] **Step 3: Create login page**

Create `app/auth/login/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const result = await signIn("credentials", {
      email,
      redirect: false,
    });

    if (result?.error) {
      setError("ログインに失敗しました");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle>ログイン</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full">
                ログイン
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              アカウントがない場合は
              <Link href="/auth/signup" className="underline">
                新規登録
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create signup page**

Create `app/auth/signup/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // NextAuth credentials provider creates user if not exists
    const result = await signIn("credentials", {
      email,
      redirect: false,
    });

    if (result?.error) {
      setError("登録に失敗しました");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle>無料アカウント作成</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                名前の入力は不要です。メールアドレスだけで登録できます。
              </p>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full">
                登録して結果を保存する
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              既にアカウントがある場合は
              <Link href="/auth/login" className="underline">
                ログイン
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Install next-auth dependencies**

```bash
npm install next-auth@beta @auth/drizzle-adapter
```

- [ ] **Step 6: Commit**

```bash
git add lib/auth.ts app/api/auth/ app/auth/
git commit -m "feat: add NextAuth email-only anonymous authentication"
```

---

## Task 13: Dashboard (Past Diagnoses)

**Files:**
- Create: `app/dashboard/page.tsx`

- [ ] **Step 1: Create dashboard page**

Create `app/dashboard/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { diagnoses } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const userDiagnoses = await db
    .select()
    .from(diagnoses)
    .where(eq(diagnoses.userId, session.user.id))
    .orderBy(desc(diagnoses.createdAt));

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-lg space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">マイページ</h1>
          <Link href="/">
            <Button variant="outline" size="sm">
              新しい診断を受ける
            </Button>
          </Link>
        </div>

        {userDiagnoses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">まだ診断結果がありません。</p>
              <Link href="/" className="mt-4 inline-block">
                <Button>最初の診断を受ける</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {userDiagnoses.map((d) => {
              const result = d.result as {
                totalPotentialSaving?: number;
                annualLoss?: number;
                deductions?: { name: string }[];
              };

              return (
                <Card key={d.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {d.type === "quick" ? "概算診断" : "精密診断"}
                      </CardTitle>
                      <span className="text-sm text-muted-foreground">
                        {new Date(d.createdAt).toLocaleDateString("ja-JP")}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {d.type === "full" && result.totalPotentialSaving !== undefined && (
                      <p className="text-lg font-bold text-red-600">
                        取り戻せる額: ¥{result.totalPotentialSaving.toLocaleString()}/年
                      </p>
                    )}
                    {d.type === "quick" && result.annualLoss !== undefined && (
                      <p className="text-lg font-bold text-red-600">
                        推定損失額: ¥{result.annualLoss.toLocaleString()}/年
                      </p>
                    )}
                    {result.deductions && result.deductions.length > 0 && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        未使用の控除: {result.deductions.map((d) => d.name).join("、")}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/
git commit -m "feat: add dashboard page with past diagnosis history"
```

---

## Task 14: Save Diagnosis Results to DB

Wire up the result pages to save diagnosis data (encrypted) when user is logged in.

**Files:**
- Create: `lib/actions/save-diagnosis.ts`
- Modify: `app/result/quick/page.tsx`, `app/result/full/page.tsx`

- [ ] **Step 1: Create save diagnosis action**

Create `lib/actions/save-diagnosis.ts`:

```typescript
"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { diagnoses } from "@/lib/db/schema";
import { encrypt } from "@/lib/crypto";

export async function saveDiagnosis(params: {
  type: "quick" | "full";
  input: Record<string, unknown>;
  result: Record<string, unknown>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    return { error: "Encryption key not configured" };
  }

  const encryptedInput = encrypt(JSON.stringify(params.input), encryptionKey);

  await db.insert(diagnoses).values({
    userId: session.user.id,
    type: params.type,
    input: encryptedInput,
    result: params.result,
  });

  return { success: true };
}
```

- [ ] **Step 2: Add save button to full result page**

Add to the bottom of `app/result/full/page.tsx`, replace the existing signup link with a save action button. Add a client component wrapper:

Create `components/results/SaveResultButton.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { saveDiagnosis } from "@/lib/actions/save-diagnosis";

type Props = {
  type: "quick" | "full";
  input: Record<string, unknown>;
  result: Record<string, unknown>;
  isLoggedIn: boolean;
};

export function SaveResultButton({ type, input, result, isLoggedIn }: Props) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    const res = await saveDiagnosis({ type, input, result });
    if (res.error) {
      setError(res.error);
    } else {
      setSaved(true);
    }
  }

  if (!isLoggedIn) {
    return (
      <a href="/auth/signup">
        <Button variant="outline" className="w-full" size="lg">
          結果を保存する（無料アカウント作成）
        </Button>
      </a>
    );
  }

  if (saved) {
    return (
      <Button variant="outline" className="w-full" size="lg" disabled>
        保存済み
      </Button>
    );
  }

  return (
    <>
      <Button onClick={handleSave} variant="outline" className="w-full" size="lg">
        結果を保存する
      </Button>
      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/actions/save-diagnosis.ts components/results/SaveResultButton.tsx
git commit -m "feat: add diagnosis save with encryption and save button"
```

---

## Task 15: Integration Test and Final Polish

**Files:**
- Modify: `app/layout.tsx` (add SessionProvider if needed)
- Run full test suite

- [ ] **Step 1: Run all unit tests**

```bash
npx vitest run
```

Expected: All tests PASS (calculator, salary-comparator, deduction-engine, crypto, quick-diagnosis, full-diagnosis).

- [ ] **Step 2: Manual E2E test**

Start dev server with database:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Walk through the full flow:
1. Landing page → Fill form (年収350万, 23歳, エンジニア, 東京)
2. Quick result → See loss amount
3. Click "正確な取り戻し額を診断する"
4. Answer all 10 questions (mostly "いいえ")
5. Full result → See deduction cards with savings
6. Sign up → Create account
7. Dashboard → See saved result

- [ ] **Step 3: Add .gitignore entries**

Ensure `.gitignore` includes:

```
.env.local
.env*.local
node_modules/
.next/
drizzle/
.superpowers/
```

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: add gitignore and finalize project setup"
```

---

## Summary

| Task | Description | Tests |
|------|-------------|-------|
| 1 | Project scaffolding | - |
| 2 | Tax calculator | 5 test cases |
| 3 | Salary comparator | 4 test cases |
| 4 | Deduction rule engine | 4 test cases |
| 5 | Database schema + seed data | - |
| 6 | Encryption utility | 3 test cases |
| 7 | Server actions (quick + full) | 4 test cases |
| 8 | Landing page + quick input form | Visual |
| 9 | Quick result page | Visual |
| 10 | Diagnosis wizard | Visual |
| 11 | Full result page | Visual |
| 12 | Authentication (NextAuth) | Visual |
| 13 | Dashboard | Visual |
| 14 | Save diagnosis to DB | - |
| 15 | Integration test + polish | E2E |

Total: 15 tasks, 20+ automated test cases, 15 commits.
