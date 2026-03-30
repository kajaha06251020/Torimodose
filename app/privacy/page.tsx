import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-green-600" />
            <h1 className="text-3xl sm:text-4xl font-bold">プライバシーポリシー</h1>
          </div>
          <p className="text-muted-foreground">
            Torimodoseは個人情報の保護を最優先とします。本ポリシーは、どのデータが収集・保存されるかを透明に説明しています。診断結果はすべて匿名で保存され、個人を特定できるような情報は含まれません。
          </p>
        </div>

        {/* データ保護の基本方針 */}
        <Card>
          <CardHeader>
            <CardTitle>基本方針：ログイン不要で匿名診断</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Torimodoseでは、ログインなしで診断を完全に利用できます。メールアドレスや個人情報を提供する必要はありません。
            </p>
            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <p className="font-semibold text-green-900 dark:text-green-100">匿名で診断して、結果を保存</p>
              <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                診断結果はすべて匿名で保存されます。個人を特定できる情報は記録されません。メールアドレスや名前などの個人情報の入力は不要です。
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 保存されるデータ・されないデータ */}
        <Card>
          <CardHeader>
            <CardTitle>保存されるデータ / されないデータ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 保存されない */}
            <div>
              <h3 className="font-semibold text-lg mb-3">保存されないデータ</h3>
              <ul className="space-y-3 ml-4">
                <li>
                  <strong>IPアドレス・利用端末情報</strong>
                  <br />
                  <span className="text-sm text-muted-foreground">
                    個別にトラッキングされません。
                  </span>
                </li>
                <li>
                  <strong>メールアドレス</strong>
                  <br />
                  <span className="text-sm text-muted-foreground">
                    診断に必要ないため、一切記録されません。
                  </span>
                </li>
              </ul>
            </div>

            {/* 保存される */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-3">保存される診断データ（匿名）</h3>
              <p className="text-sm text-muted-foreground mb-3">
                すべてのユーザーの診断結果は、匿名で保存されます。個人を特定できる情報は含まれません：
              </p>
              <ul className="space-y-3 ml-4">
                <li>
                  <strong>診断入力データ</strong>（年収、年齢、職種、地域）
                  <br />
                  <span className="text-sm text-muted-foreground">
                    診断結果を再度確認するために保存されます。入力データは暗号化されて保存されます。
                  </span>
                </li>
                <li>
                  <strong>診断回答</strong>（各カテゴリの選択）
                  <br />
                  <span className="text-sm text-muted-foreground">
                    どの控除・給付金が該当するかを記録します。
                  </span>
                </li>
                <li>
                  <strong>診断結果</strong>（該当する控除・給付、取り戻せる金額）
                  <br />
                  <span className="text-sm text-muted-foreground">
                    計算結果が保存されます。
                  </span>
                </li>
              </ul>
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mt-4">
                <p className="font-semibold text-blue-900 dark:text-blue-100">
                  完全な匿名性を保証
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">
                  診断データは ID（UUID）でのみ識別され、個人を特定できるメールアドレス、名前、電話番号などは一切保存されません。
                </p>
              </div>
            </div>

            {/* 給与統計データ */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-3">参照データ</h3>
              <p>
                <strong>給与統計データ：</strong>
                <br />
                <span className="text-sm text-muted-foreground">
                  厚生労働省「賃金構造基本統計調査」と国税庁「民間給与実態統計調査」の公的統計データを参照します。これらのデータは匿名の集計統計であり、個人情報を含みません。
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cookie・セッション */}
        <Card>
          <CardHeader>
            <CardTitle>Cookie・セッション</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              ログイン中は、セッション認証用のCookieを使用します（NextAuth.js）。
              これはセッションの継続に必要な技術的な情報のみを含みます。
            </p>
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                • トラッキングやマーケティング目的のCookieは使用していません
              </p>
              <p className="text-sm text-blue-900 dark:text-blue-100 mt-2">
                • ブラウザの設定でCookieを無効にすることで、ログイン機能のみ影響を受けます
              </p>
            </div>
          </CardContent>
        </Card>

        {/* データ削除方法 */}
        <Card>
          <CardHeader>
            <CardTitle>データ削除方法</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">保存した診断結果を削除したい場合：</h4>
              <ol className="space-y-2 ml-4 list-decimal">
                <li>マイページ（ダッシュボード）にログインします</li>
                <li>削除したい診断の横に表示される「削除」ボタンをクリックします</li>
                <li>確認後、即座に削除されます</li>
              </ol>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">アカウント全体を削除したい場合：</h4>
              <p className="text-sm">
                お手数ですが、下記の「お問い合わせ」からご連絡ください。アカウント削除とともに、すべての診断データを完全に削除します。
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 第三者提供 */}
        <Card>
          <CardHeader>
            <CardTitle>第三者提供について</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Torimodoseは個人診断データを第三者に提供・共有することはありません。
              統計分析目的で匿名化・集計された情報（例：「20代エンジニアの平均利用率」など）を内部分析に使用する可能性がありますが、
              個人を特定できる情報は一切含みません。
            </p>
          </CardContent>
        </Card>

        {/* セキュリティ */}
        <Card>
          <CardHeader>
            <CardTitle>セキュリティ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 ml-4 list-disc">
              <li>
                <strong>通信暗号化：</strong>すべての通信はHTTPSで暗号化されます。
              </li>
              <li>
                <strong>データベース：</strong>
                Supabase PostgreSQLで安全に保存されます。診断入力データなど機密情報は暗号化されます。
              </li>
              <li>
                <strong>アクセス制御：</strong>
                ユーザーは自分の診断データのみアクセス可能です。
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* お問い合わせ */}
        <Card>
          <CardHeader>
            <CardTitle>お問い合わせ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              プライバシーに関するご質問やご懸念がある場合は、
              <a href="https://twitter.com" className="text-blue-600 hover:underline">
                Xでお問い合わせ
              </a>
              ください。可能な限り迅速にお応えします。
            </p>
          </CardContent>
        </Card>

        {/* 最終更新 */}
        <p className="text-center text-sm text-muted-foreground">
          最終更新：2026年3月30日
        </p>
      </div>
    </div>
  );
}
