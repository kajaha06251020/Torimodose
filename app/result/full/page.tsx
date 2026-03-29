import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DeductionCard } from "@/components/results/DeductionCard";
import { runFullDiagnosis } from "@/lib/actions/full-diagnosis";
import { db } from "@/lib/db";
import { deductionRules } from "@/lib/db/schema";
import type { DeductionRule } from "@/lib/engine/deduction-engine";

type Props = {
  searchParams: Promise<{ data?: string }>;
};

export default async function FullResultPage({ searchParams }: Props) {
  const params = await searchParams;

  if (!params.data) {
    redirect("/");
  }

  const parsedData = JSON.parse(decodeURIComponent(params.data));

  const rulesFromDb = await db.select().from(deductionRules);

  const rules: DeductionRule[] = rulesFromDb.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category as "income" | "credit",
    questionKey: r.questionKey,
    condition: r.condition as DeductionRule["condition"],
    formula: r.formula as DeductionRule["formula"],
    legalBasis: r.legalBasis,
    maxAmount: r.maxAmount,
    description: r.description,
    howTo: r.howTo,
  }));

  const result = runFullDiagnosis(parsedData, rules);
  const { deductions, totalPotentialSaving } = result;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8 text-center">
        <p className="text-sm text-muted-foreground">取り戻せる税金</p>
        <p className="text-5xl font-extrabold text-red-600">
          ¥{totalPotentialSaving.toLocaleString()}/年
        </p>
      </div>

      {deductions.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">
            あなたが使っていない控除 ({deductions.length}件)
          </h2>
          {deductions.map((d) => (
            <DeductionCard
              key={d.name}
              name={d.name}
              potentialSaving={d.potentialSaving}
              legalBasis={d.legalBasis}
              description={d.description}
              howTo={d.howTo}
            />
          ))}
        </section>
      ) : (
        <div className="rounded-lg bg-green-50 p-6 text-center text-green-800">
          素晴らしい。主要な控除はすべて活用できています。
        </div>
      )}

      <div className="mt-10 flex flex-col items-center gap-4">
        <Button render={<Link href="/auth/signup" />} size="lg">結果を保存する（無料アカウント作成）</Button>
        <Link href="/" className="text-sm text-muted-foreground underline">
          もう一度診断する
        </Link>
      </div>
    </main>
  );
}
