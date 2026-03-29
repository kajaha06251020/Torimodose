"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"

type Question = {
  key: string
  text: string
  followUp?: string
}

const QUESTIONS: Question[] = [
  // --- 控除（所得控除・税額控除） ---
  { key: "medical_expenses", text: "年間の医療費が10万円を超えていますが、医療費控除を申告していない？", followUp: "医療費の合計額（万円）" },
  { key: "self_medication", text: "OTC医薬品（市販薬）を年間12,000円以上買っていますか？" },
  { key: "furusato_nozei", text: "ふるさと納税に興味はあるが、まだやっていないですか？" },
  { key: "ideco", text: "iDeCo（個人型確定拠出年金）にまだ加入していないですか？" },
  { key: "small_biz_mutual_aid", text: "個人事業主で、小規模企業共済にまだ加入していないですか？" },
  { key: "life_insurance", text: "生命保険に加入しているが、年末調整で控除申告を忘れていませんか？" },
  { key: "earthquake_insurance", text: "地震保険に加入しているが、控除申告を忘れていませんか？" },
  { key: "housing_loan", text: "住宅ローンがあるが、住宅ローン控除を申請していないですか？" },
  { key: "spouse", text: "年収201.6万円未満の配偶者がいますか？" },
  { key: "dependents", text: "16歳以上の扶養家族（子・親など）がいますか？" },
  { key: "single_parent", text: "ひとり親（シングルマザー・シングルファザー）ですか？" },
  { key: "disability", text: "ご本人または扶養家族に障害者手帳をお持ちの方がいますか？" },
  { key: "working_student", text: "働きながら学校に通っていますか？" },
  { key: "special_expenditure", text: "仕事の資格取得費・研修費・書籍代が年間数十万円以上ありますか？" },
  { key: "dividend_income", text: "株式の配当金を受け取っていますか？（配当控除で節税可能）" },
  { key: "foreign_tax_credit", text: "米国株など外国株式の配当金を受け取っていますか？" },
  { key: "blue_return", text: "個人事業主で、まだ青色申告をしていないですか？（最大65万円控除）" },
  { key: "nisa", text: "NISA口座を使わずに株式・投資信託の運用をしていますか？" },
  { key: "corporate_dc_matching", text: "勤務先に企業型DCのマッチング拠出があるが、利用していないですか？" },
  { key: "casualty_loss", text: "災害・盗難の被害を受けましたか？" },
  { key: "disaster_tax_relief", text: "災害で住宅・家財の時価の半分以上の損害を受けましたか？" },
  // --- 給付金・手当（医療・健康） ---
  { key: "high_cost_medical", text: "1か月の医療費の自己負担が8万円を超えたことがありますか？" },
  { key: "sickness_allowance", text: "病気やケガで4日以上連続して仕事を休んでいますか？" },
  { key: "workers_comp", text: "仕事中・通勤中にケガや病気をしましたか？" },
  { key: "infertility_treatment", text: "不妊治療を受けている、または検討していますか？" },
  { key: "mental_health_support", text: "うつ病等の精神疾患で継続的に通院していますか？（医療費1割に）" },
  { key: "intractable_disease", text: "潰瘍性大腸炎・パーキンソン病等の難病と診断されていますか？" },
  { key: "rehabilitation_medical", text: "身体障害者手帳をお持ちで、障害を軽減する手術を検討していますか？" },
  { key: "overseas_medical", text: "海外で医療機関を受診し、費用を自費で支払いましたか？" },
  { key: "sickness_supplement", text: "大企業の健保組合に加入していますか？（傷病手当金の上乗せ確認）" },
  // --- 給付金・手当（雇用・就職） ---
  { key: "unemployment", text: "離職・退職を予定していますか、または最近退職しましたか？" },
  { key: "reemployment_allowance", text: "失業給付の受給中に早期に再就職が決まりましたか？" },
  { key: "employment_retention", text: "再就職後の給与が前職より下がりましたか？" },
  { key: "wide_area_job_search", text: "遠方（200km以上）の企業に面接に行く予定がありますか？" },
  { key: "relocation_expenses", text: "就職のために引っ越しが必要になりましたか？" },
  { key: "education_training", text: "資格取得やスキルアップの講座受講を検討していますか？" },
  { key: "job_seeker_support", text: "雇用保険未加入だが、職業訓練を受けたいですか？（月10万円支給）" },
  // --- 給付金・手当（子育て・教育） ---
  { key: "child_allowance", text: "18歳以下のお子さんがいますか？（児童手当）" },
  { key: "childbirth_lump_sum", text: "出産の予定がある、または最近出産しましたか？（一時金50万円）" },
  { key: "childbirth_support_grant", text: "妊娠中または最近出産しましたか？（応援給付金10万円）" },
  { key: "maternity_allowance", text: "出産のため産休を取得する予定がありますか？" },
  { key: "childcare_leave", text: "育児休業を取得する予定がありますか？" },
  { key: "free_childcare", text: "3〜5歳のお子さんが保育園・幼稚園に通っていますか？（無償化）" },
  { key: "child_medical_subsidy", text: "お子さんの医療費助成（マル乳・マル子）を申請していますか？" },
  { key: "free_highschool", text: "高校生のお子さんがいますか？（授業料最大39.6万円支援）" },
  { key: "higher_education_support", text: "大学・専門学校進学を控えた子がいて、世帯収入が低めですか？" },
  { key: "school_assistance", text: "小中学生がいて、学用品費や給食費の負担が大きいですか？" },
  { key: "special_child_rearing", text: "障害のある20歳未満のお子さんを養育していますか？（月5.5万円）" },
  { key: "disabled_child_allowance", text: "重度の障害がある20歳未満のお子さんがいますか？（月1.6万円）" },
  // --- 給付金・手当（障害・介護） ---
  { key: "special_disability_allowance", text: "重度の障害があり常時介護が必要な方がいますか？（月2.9万円）" },
  { key: "disability_pension", text: "病気やケガで日常生活や仕事に長期的な支障がありますか？（障害年金）" },
  { key: "nursing_care_leave", text: "家族の介護のため休業する予定がありますか？" },
  { key: "nursing_home_renovation", text: "要介護の方がいて、バリアフリー改修を検討していますか？（最大18万円補助）" },
  { key: "nursing_equipment", text: "要介護の方がいて、福祉用具の購入を検討していますか？（最大9万円補助）" },
  { key: "family_care_reward", text: "要介護4-5の方を介護サービスなしで在宅介護していますか？" },
  // --- 給付金・手当（住宅・生活・その他） ---
  { key: "housing_benefit", text: "離職・収入減少で家賃の支払いが厳しくなっていますか？" },
  { key: "home_renovation_subsidy", text: "窓の断熱・給湯器交換など省エネリフォームを検討していますか？" },
  { key: "marriage_support", text: "最近結婚し、新生活を始めましたか？（最大60万円補助）" },
  { key: "migration_support", text: "東京23区から地方への移住を検討していますか？（最大100万円+子1人100万円）" },
  // --- 給付金・手当（遺族・年金） ---
  { key: "survivor_pension", text: "ご家族が亡くなり、遺族年金をまだ請求していないですか？" },
  { key: "unpaid_pension", text: "年金受給中のご家族が亡くなりましたか？（未支給年金を請求可能）" },
  { key: "funeral_expenses", text: "ご家族が亡くなり、埋葬料・葬祭費を申請していないですか？" },
  { key: "pension_support", text: "年金を受給しており、所得が低めですか？（年金生活者支援給付金）" },
  // --- 給付金・手当（災害） ---
  { key: "disaster_reconstruction", text: "自然災害で住宅が全壊・大規模半壊の被害を受けましたか？" },
  { key: "disaster_condolence", text: "自然災害でご家族が亡くなりましたか？（災害弔慰金）" },
  // --- 給付金・手当（生活困窮） ---
  { key: "emergency_small_loan", text: "一時的に生活費が足りない緊急事態ですか？（無利子10万円）" },
  { key: "comprehensive_support_loan", text: "失業等で生活全般に困窮していますか？（月15-20万円貸付）" },
  { key: "single_parent_loan", text: "ひとり親家庭で、生活費・教育費等の資金が必要ですか？" },
  // --- 追加：控除（節税） ---
  { key: "npo_donation", text: "認定NPO法人や公益社団法人に寄附をしていますか？（税額控除40%）" },
  { key: "small_asset_deduction", text: "個人事業主で、30万円未満の事業用資産（PC等）を購入しましたか？" },
  { key: "medical_expenses_extended", text: "レーシック・歯科矯正・補聴器・通院交通費等を支払いましたか？" },
  { key: "home_office_deduction", text: "フリーランスで自宅を仕事場として使っていますか？（家賃等を経費化）" },
  // --- 追加：社会保険料の減免 ---
  { key: "nhk_unemployment_reduction", text: "会社都合で退職し、国保に加入しましたか？（保険料7割減の可能性）" },
  { key: "pension_exemption", text: "失業・収入減少で国民年金の納付が厳しいですか？（免除制度あり）" },
  { key: "pension_maternity_exemption", text: "自営業・フリーランスで出産予定がありますか？（年金4か月免除）" },
  { key: "student_pension_deferral", text: "20歳以上の学生で国民年金保険料の納付を猶予したいですか？" },
  { key: "resident_tax_reduction", text: "失業・災害等で住民税の納付が困難ですか？（減免制度あり）" },
  // --- 追加：物価高騰対策 ---
  { key: "price_hike_benefit", text: "住民税非課税世帯ですか？（物価高騰支援3万円+子1人2万円）" },
  { key: "energy_subsidy", text: "電気・ガス料金の補助が自動適用されているか確認しましたか？" },
  { key: "child_support_allowance_2025", text: "0〜18歳の子どもがいますか？（子育て応援手当2万円/人）" },
  { key: "free_highschool_2025", text: "2025年度に高校生のお子さんがいますか？（所得制限撤廃で全世帯無償）" },
]

type AnswerEntry = { using: boolean; amount?: number }

type Props = {
  annualIncome: number
  age: number
}

export function DiagnosisWizard({ annualIncome, age }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, AnswerEntry>>({})
  const [followUpValue, setFollowUpValue] = useState("")
  const [pendingYes, setPendingYes] = useState(false)

  const currentQuestion = QUESTIONS[step]
  const progress = Math.round((step / QUESTIONS.length) * 100)

  function recordAndAdvance(entry: AnswerEntry) {
    const updatedAnswers = { ...answers, [currentQuestion.key]: entry }
    setAnswers(updatedAnswers)
    setPendingYes(false)
    setFollowUpValue("")

    const nextStep = step + 1
    if (nextStep >= QUESTIONS.length) {
      const payload = { annualIncome, answers: updatedAnswers }
      const encoded = encodeURIComponent(JSON.stringify(payload))
      router.push(`/result/full?data=${encoded}`)
    } else {
      setStep(nextStep)
    }
  }

  function handleNo() {
    recordAndAdvance({ using: false })
  }

  function handleYes() {
    if (currentQuestion.followUp) {
      setPendingYes(true)
    } else {
      recordAndAdvance({ using: true })
    }
  }

  function handleFollowUpSubmit() {
    const amount = followUpValue ? parseFloat(followUpValue) : undefined
    recordAndAdvance({ using: true, ...(amount !== undefined ? { amount } : {}) })
  }

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            {step + 1} / {QUESTIONS.length}
          </span>
        </div>
        <Progress value={progress} />
        <CardTitle className="mt-4 text-base leading-relaxed">
          {currentQuestion.text}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!pendingYes ? (
          <div className="flex gap-3">
            <Button
              size="lg"
              className="flex-1"
              onClick={handleYes}
            >
              はい
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex-1"
              onClick={handleNo}
            >
              いいえ
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Input
              type="number"
              placeholder={currentQuestion.followUp}
              value={followUpValue}
              onChange={(e) => setFollowUpValue(e.target.value)}
              className="h-10"
            />
            <Button size="lg" onClick={handleFollowUpSubmit}>
              次へ
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
