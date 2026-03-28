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
      annualIncome: Number(params.income) * 10_000,
      occupation: params.occupation,
      region: params.region,
      age: Number(params.age),
    },
    statRows
  );

  if (!result.found) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <p className="text-muted-foreground">{result.message}</p>
        <Link href="/" className="mt-4 text-sm underline">
          もう一度試す
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <LossDisplay
            annualLoss={result.annualLoss}
            median={result.median}
            percentile={result.percentile}
          />
        </CardContent>
      </Card>

      {result.annualLoss > 0 && (
        <div className="w-full max-w-md rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          さらに、使っていない控除・給付金で取り戻せるお金があるかもしれません。
        </div>
      )}

      <div className="flex w-full max-w-md flex-col items-center gap-3">
        <Button asChild className="w-full">
          <Link href={`/diagnosis?income=${params.income}&age=${params.age}`}>
            正確な取り戻し額を診断する
          </Link>
        </Button>
        <Link href="/" className="text-sm text-muted-foreground underline">
          もう一度試す
        </Link>
      </div>
    </main>
  );
}
