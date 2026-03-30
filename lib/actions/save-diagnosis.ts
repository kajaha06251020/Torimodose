"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { diagnoses } from "@/lib/db/schema";
import { encrypt } from "@/lib/crypto";

export async function saveDiagnosis(params: {
  type: "quick" | "full";
  input: Record<string, unknown>;
  result: Record<string, unknown>;
  totalPotentialSaving?: number;
  answers?: Record<string, unknown>;
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
    totalPotentialSaving: params.totalPotentialSaving || 0,
    answers: params.answers,
  });

  return { success: true };
}
