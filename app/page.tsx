import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuickInputForm } from "@/components/forms/QuickInputForm";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
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

        <p className="mt-6 text-center text-xs text-muted-foreground">
          入力データはサーバーに保存されません
        </p>
      </div>
    </div>
  );
}
