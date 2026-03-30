"use server";

import { auth } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";

export async function saveDiagnosis(params: {
  type: "quick" | "full";
  input: Record<string, unknown>;
  result: Record<string, unknown>;
  totalPotentialSaving?: number;
  answers?: Record<string, unknown>;
}) {
  const session = await auth();
  // ユーザーIDは optional（匿名でも保存可能）
  const userId = session?.user?.id || null;

  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    return { error: "Encryption key not configured" };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    return { error: "Supabase URL not configured" };
  }

  const encryptedInput = encrypt(JSON.stringify(params.input), encryptionKey);

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    return { error: "Supabase anon key not configured" };
  }

  try {
    // Supabase Edge Function を呼び出し
    const response = await fetch(
      `${supabaseUrl}/functions/v1/save-diagnosis`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          userId: userId,
          type: params.type,
          input: encryptedInput,
          result: params.result,
          totalPotentialSaving: params.totalPotentialSaving || 0,
          answers: params.answers,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || "Failed to save diagnosis" };
    }

    const data = await response.json();
    // Extract diagnosis ID from the saved data
    const diagnosisId = data.data?.[0]?.id;
    return { success: true, data, diagnosisId };
  } catch (error) {
    console.error("Error calling save-diagnosis function:", error);
    return { error: "Failed to save diagnosis" };
  }
}
