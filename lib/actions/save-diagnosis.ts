"use server";

import { auth } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";
import { db } from "@/lib/db";
import { diagnoses, diagnosisInputs } from "@/lib/db/schema";

export async function saveDiagnosis(params: {
  type: "quick" | "full";
  input: Record<string, unknown>;
  result: Record<string, unknown>;
  totalPotentialSaving?: number;
  answers?: Record<string, unknown>;
  diagnosisInputData?: {
    income: number;
    age: number;
    occupation: string;
    region: string;
  };
}) {
  const session = await auth();
  const userId = session?.user?.id || null;

  const encryptionKey = process.env.ENCRYPTION_KEY;
  let inputData: string;
  if (encryptionKey) {
    inputData = encrypt(JSON.stringify(params.input), encryptionKey);
  } else {
    inputData = JSON.stringify(params.input);
  }

  try {
    const [inserted] = await db
      .insert(diagnoses)
      .values({
        userId,
        type: params.type,
        input: inputData,
        result: params.result,
        totalPotentialSaving: params.totalPotentialSaving || 0,
        answers: params.answers || null,
      })
      .returning({ id: diagnoses.id });

    if (inserted.id && params.diagnosisInputData) {
      await db.insert(diagnosisInputs).values({
        diagnosisId: inserted.id,
        income: params.diagnosisInputData.income,
        age: params.diagnosisInputData.age,
        occupation: params.diagnosisInputData.occupation,
        region: params.diagnosisInputData.region,
      });
    }

    return { success: true, diagnosisId: inserted.id };
  } catch (error: unknown) {
    // postgres.js のエラーは code, detail, hint 等のプロパティを持つ
    const e = error as Record<string, unknown>;
    const info = [
      `msg:${e.message || "?"}`.slice(0, 60),
      `code:${e.code || "?"}`,
      `detail:${e.detail || "?"}`.slice(0, 60),
      `severity:${e.severity || "?"}`,
    ].join(" | ");
    return { error: info };
  }
}
