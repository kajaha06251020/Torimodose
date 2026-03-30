import { redirect } from "next/navigation";
import Link from "next/link";
import { DeductionCard } from "@/components/results/DeductionCard";
import { SaveResultButton } from "@/components/results/SaveResultButton";
import { runFullDiagnosis } from "@/lib/actions/full-diagnosis";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deductionRules } from "@/lib/db/schema";
import type { DeductionRule } from "@/lib/engine/deduction-engine";

type Props = {
  searchParams: Promise<{ data?: string }>;
};

export default async function FullResultPage({ searchParams }: Props) {
  const params = await searchParams;
  const session = await auth();

  if (!params.data) {
    redirect("/");
  }

  const parsedData = JSON.parse(decodeURIComponent(params.data));

  const rulesFromDb = await db.select().from(deductionRules);

  const rules: DeductionRule[] = rulesFromDb.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category as "income" | "credit" | "benefit",
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

  const taxDeductions = deductions.filter((d) => d.category !== "benefit");
  const benefits = deductions.filter((d) => d.category === "benefit");
  const taxSaving = taxDeductions.reduce((sum, d) => sum + d.potentialSaving, 0);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8 text-center">
        <p className="text-sm text-muted-foreground">取り戻せるお金の総額</p>
        <p className="text-4xl sm:text-5xl font-extrabold text-red-600 break-all">
          ¥{totalPotentialSaving.toLocaleString()}/年
        </p>
        {taxDeductions.length > 0 && benefits.length > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            (控除で¥{taxSaving.toLocaleString()} + 給付金で¥{(totalPotentialSaving - taxSaving).toLocaleString()})
          </p>
        )}
      </div>

      {taxDeductions.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">
            使っていない控除 ({taxDeductions.length}件)
          </h2>
          {taxDeductions.map((d) => (
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
      )}

      {benefits.length > 0 && (
        <section className="mt-8 space-y-4">
          <h2 className="text-lg font-semibold">
            申請すればもらえる給付金・手当 ({benefits.length}件)
          </h2>
          {benefits.map((d) => (
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
      )}

      {deductions.length === 0 && (
        <div className="rounded-lg bg-green-50 p-6 text-center text-green-800">
          素晴らしい。主要な控除・給付金はすべて活用できています。
        </div>
      )}

      <div className="mt-10 space-y-4">
        <SaveResultButton
          type="full"
          input={parsedData}
          result={{
            deductions,
            totalPotentialSaving,
            answers: parsedData.answers,
          }}
          isLoggedIn={!!session?.user?.id}
          totalPotentialSaving={totalPotentialSaving}
          answers={parsedData.answers}
        />
        <div className="text-center">
          <Link href="/" className="text-sm text-muted-foreground underline hover:no-underline">
            もう一度診断する
          </Link>
        </div>
      </div>
    </main>
  );
}
