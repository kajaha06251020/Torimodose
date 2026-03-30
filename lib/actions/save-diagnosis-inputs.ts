"use server";

import { db } from "@/lib/db";
import { diagnosisInputs } from "@/lib/db/schema";

export async function saveDiagnosisInputs(params: {
  diagnosisId: string;
  income: number;
  age: number;
  occupation: string;
  region: string;
}) {
  try {
    const result = await db.insert(diagnosisInputs).values({
      diagnosisId: params.diagnosisId,
      income: params.income,
      age: params.age,
      occupation: params.occupation,
      region: params.region,
    });

    return { success: true };
  } catch (error) {
    console.error("Error saving diagnosis inputs:", error);
    return { error: "Failed to save diagnosis inputs" };
  }
}
