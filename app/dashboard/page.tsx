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

  if (!session || !session.user?.id) {
    redirect("/auth/login");
  }

  const userDiagnoses = await db
    .select()
    .from(diagnoses)
    .where(eq(diagnoses.userId, session.user.id))
    .orderBy(desc(diagnoses.createdAt));

  return (
    <div className="container mx-auto max-w-3xl py-10 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">マイページ</h1>
        <Button render={<Link href="/" />}>新しい診断を受ける</Button>
      </div>

      {/* Empty state */}
      {userDiagnoses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <p className="text-muted-foreground">まだ診断結果がありません。</p>
            <Button render={<Link href="/" />}>最初の診断を受ける</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {userDiagnoses.map((d) => {
            const result = d.result as {
              totalPotentialSaving?: number;
              annualLoss?: number;
              deductions?: { name: string }[];
            };

            const isFullType = d.type === "full";
            const typeLabelText = isFullType ? "精密診断" : "概算診断";
            const dateText = new Date(d.createdAt).toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });

            return (
              <Card key={d.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                      {typeLabelText}
                    </span>
                    <span className="text-sm text-muted-foreground">{dateText}</span>
                  </div>
                  <CardTitle className="sr-only">{typeLabelText}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {isFullType && result.totalPotentialSaving !== undefined && (
                    <p className="text-lg font-semibold text-red-600">
                      取り戻せる額: ¥{result.totalPotentialSaving.toLocaleString("ja-JP")}/年
                    </p>
                  )}
                  {!isFullType && result.annualLoss !== undefined && (
                    <p className="text-lg font-semibold text-red-600">
                      推定損失額: ¥{result.annualLoss.toLocaleString("ja-JP")}/年
                    </p>
                  )}
                  {isFullType && result.deductions && result.deductions.length > 0 && (
                    <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
                      {result.deductions.map((deduction, idx) => (
                        <li key={idx}>{deduction.name}</li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
