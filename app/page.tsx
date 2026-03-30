import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuickInputForm } from "@/components/forms/QuickInputForm";
import { Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-lg space-y-6">
        {/* プライバシーバッジ */}
        <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
          <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
          <p className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300">
            ✓ ログイン不要 | データ保存なし（匿名で診断できます）
          </p>
        </div>

        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
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

        <p className="text-center text-xs text-muted-foreground">
          <a href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">
            プライバシーポリシーを確認する →
          </a>
        </p>
      </div>
    </div>
  );
}
