"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"

type Question = {
  key: string
  text: string
  category: string
  followUp?: string
}

type Category = {
  id: string
  label: string
  description: string
  questionCount: number
}

const QUESTIONS: Question[] = [
  // --- 節税・控除 ---
  { key: "medical_expenses", category: "tax", text: "年間の医療費が10万円を超えていますが、医療費控除を申告していない？", followUp: "医療費の合計額（万円）" },
  { key: "self_medication", category: "tax", text: "OTC医薬品（市販薬）を年間12,000円以上買っていますか？" },
  { key: "furusato_nozei", category: "tax", text: "ふるさと納税に興味はあるが、まだやっていないですか？" },
  { key: "ideco", category: "tax", text: "iDeCo（個人型確定拠出年金）にまだ加入していないですか？" },
  { key: "small_biz_mutual_aid", category: "tax", text: "個人事業主で、小規模企業共済にまだ加入していないですか？" },
  { key: "life_insurance", category: "tax", text: "生命保険に加入しているが、年末調整で控除申告を忘れていませんか？" },
  { key: "earthquake_insurance", category: "tax", text: "地震保険に加入しているが、控除申告を忘れていませんか？" },
  { key: "housing_loan", category: "tax", text: "住宅ローンがあるが、住宅ローン控除を申請していないですか？" },
  { key: "spouse", category: "tax", text: "年収201.6万円未満の配偶者がいますか？" },
  { key: "dependents", category: "tax", text: "16歳以上の扶養家族（子・親など）がいますか？" },
  { key: "single_parent", category: "tax", text: "ひとり親（シングルマザー・シングルファザー）ですか？" },
  { key: "disability", category: "tax", text: "ご本人または扶養家族に障害者手帳をお持ちの方がいますか？" },
  { key: "working_student", category: "tax", text: "働きながら学校に通っていますか？" },
  { key: "special_expenditure", category: "tax", text: "仕事の資格取得費・研修費・書籍代が年間数十万円以上ありますか？" },
  { key: "dividend_income", category: "tax", text: "株式の配当金を受け取っていますか？（配当控除で節税可能）" },
  { key: "foreign_tax_credit", category: "tax", text: "米国株など外国株式の配当金を受け取っていますか？" },
  { key: "blue_return", category: "tax", text: "個人事業主で、まだ青色申告をしていないですか？（最大65万円控除）" },
  { key: "nisa", category: "tax", text: "NISA口座を使わずに株式・投資信託の運用をしていますか？" },
  { key: "corporate_dc_matching", category: "tax", text: "勤務先に企業型DCのマッチング拠出があるが、利用していないですか？" },
  { key: "casualty_loss", category: "tax", text: "災害・盗難の被害を受けましたか？" },
  { key: "disaster_tax_relief", category: "tax", text: "災害で住宅・家財の時価の半分以上の損害を受けましたか？" },
  { key: "npo_donation", category: "tax", text: "認定NPO法人や公益社団法人に寄附をしていますか？（税額控除40%）" },
  { key: "small_asset_deduction", category: "tax", text: "個人事業主で、30万円未満の事業用資産（PC等）を購入しましたか？" },
  { key: "medical_expenses_extended", category: "tax", text: "レーシック・歯科矯正・補聴器・通院交通費等を支払いましたか？" },
  { key: "home_office_deduction", category: "tax", text: "フリーランスで自宅を仕事場として使っていますか？（家賃等を経費化）" },
  { key: "ideco_withdrawal_optimization", category: "tax", text: "iDeCoの受給を検討中ですか？（一時金+年金の併用で退職所得控除と年金控除を二重活用）" },
  { key: "supplementary_pension", category: "tax", text: "自営業・フリーランスで、月400円の付加年金にまだ加入していないですか？（2年で元が取れる最強コスパ年金）" },
  { key: "national_pension_fund", category: "tax", text: "自営業・フリーランスで、国民年金基金に加入していないですか？（掛金全額が社会保険料控除）" },
  { key: "chutaikyo", category: "tax", text: "中小企業の事業主で、中退共（中小企業退職金共済）を導入していないですか？（掛金全額損金+国の助成）" },
  { key: "retirement_income_deduction", category: "tax", text: "退職金やiDeCo一時金の受取を予定していますか？（退職所得控除の最適な活用方法あり）" },
  { key: "loss_carryforward", category: "tax", text: "青色申告の個人事業主で、赤字が出た年がありますか？（翌年以降3年間、黒字と相殺可能）" },
  { key: "enterprise_tax_deduction", category: "tax", text: "個人事業主で事業所得が290万円以下ですか？（事業税がゼロになる可能性）" },
  { key: "zaikei_savings", category: "tax", text: "勤務先に財形貯蓄制度がありますか？（住宅・年金財形は550万円まで利子非課税）" },
  { key: "prepaid_tax_reduction", category: "tax", text: "予定納税が課されているが、今年は収入が減少する見込みですか？（減額申請で資金繰り改善）" },
  { key: "political_donation", category: "tax", text: "政党や政治資金団体に寄附をしていますか？（税額控除30%を選択可能）" },
  // --- 医療・健康 ---
  { key: "high_cost_medical", category: "medical", text: "1か月の医療費の自己負担が8万円を超えたことがありますか？" },
  { key: "sickness_allowance", category: "medical", text: "病気やケガで4日以上連続して仕事を休んでいますか？" },
  { key: "workers_comp", category: "medical", text: "仕事中・通勤中にケガや病気をしましたか？" },
  { key: "infertility_treatment", category: "medical", text: "不妊治療を受けている、または検討していますか？" },
  { key: "mental_health_support", category: "medical", text: "うつ病等の精神疾患で継続的に通院していますか？（医療費1割に）" },
  { key: "intractable_disease", category: "medical", text: "潰瘍性大腸炎・パーキンソン病等の難病と診断されていますか？" },
  { key: "rehabilitation_medical", category: "medical", text: "身体障害者手帳をお持ちで、障害を軽減する手術を検討していますか？" },
  { key: "overseas_medical", category: "medical", text: "海外で医療機関を受診し、費用を自費で支払いましたか？" },
  { key: "sickness_supplement", category: "medical", text: "大企業の健保組合に加入していますか？（傷病手当金の上乗せ確認）" },
  { key: "medical_deduction_hidden", category: "medical", text: "マッサージ・鍼灸・介護おむつ・補聴器・タクシー通院費等を支払っていますか？（意外な医療費控除対象）" },
  { key: "limit_certificate", category: "medical", text: "入院や高額な治療を予定していますか？（限度額適用認定証で窓口負担を軽減）" },
  { key: "combined_medical_care", category: "medical", text: "同一世帯で医療費と介護費の両方が高額になっていますか？（合算して還付）" },
  { key: "hospital_meal_reduction", category: "medical", text: "住民税非課税世帯で入院する予定がありますか？（食事代が1食210円に減額）" },
  { key: "medical_appliance", category: "medical", text: "医師の指示でコルセット・弾性ストッキング等の治療用装具を購入しましたか？（7割還付）" },
  { key: "transport_allowance_medical", category: "medical", text: "重傷で歩行困難な場合に、救急車以外の搬送費用を自費で支払いましたか？（移送費の請求）" },
  { key: "child_chronic_disease", category: "medical", text: "18歳未満のお子さんが慢性疾患（約800疾病）と診断されていますか？（医療費助成）" },
  { key: "premature_baby_medical", category: "medical", text: "出生時体重2,000g以下等の未熟児を出産しましたか？（養育医療で公費負担）" },
  { key: "free_health_checkup", category: "medical", text: "40歳以上で特定健診やがん検診を受けていますか？（無料〜数百円で受診可能）" },
  // --- 雇用・就職 ---
  { key: "unemployment", category: "employment", text: "離職・退職を予定していますか、または最近退職しましたか？" },
  { key: "reemployment_allowance", category: "employment", text: "失業給付の受給中に早期に再就職が決まりましたか？" },
  { key: "employment_retention", category: "employment", text: "再就職後の給与が前職より下がりましたか？" },
  { key: "wide_area_job_search", category: "employment", text: "遠方（200km以上）の企業に面接に行く予定がありますか？" },
  { key: "relocation_expenses", category: "employment", text: "就職のために引っ越しが必要になりましたか？" },
  { key: "education_training", category: "employment", text: "資格取得やスキルアップの講座受講を検討していますか？" },
  { key: "job_seeker_support", category: "employment", text: "雇用保険未加入だが、職業訓練を受けたいですか？（月10万円支給）" },
  { key: "career_up_subsidy", category: "employment", text: "事業主の方：非正規社員を正社員化しましたか？（キャリアアップ助成金で最大80万円）" },
  { key: "hr_development_subsidy", category: "employment", text: "事業主の方：従業員の研修・教育を実施しましたか？（人材開発支援助成金で経費75%助成）" },
  { key: "trial_employment", category: "employment", text: "事業主の方：就職困難者を試行的に雇用しましたか？（トライアル雇用助成金で月4万円）" },
  { key: "work_life_balance_subsidy", category: "employment", text: "事業主の方：男性の育休取得支援や介護離職防止に取り組んでいますか？（両立支援助成金で最大57万円）" },
  // --- 子育て・教育 ---
  { key: "child_allowance", category: "childcare", text: "18歳以下のお子さんがいますか？（児童手当）" },
  { key: "childbirth_lump_sum", category: "childcare", text: "出産の予定がある、または最近出産しましたか？（一時金50万円）" },
  { key: "childbirth_support_grant", category: "childcare", text: "妊娠中または最近出産しましたか？（応援給付金10万円）" },
  { key: "maternity_allowance", category: "childcare", text: "出産のため産休を取得する予定がありますか？" },
  { key: "childcare_leave", category: "childcare", text: "育児休業を取得する予定がありますか？" },
  { key: "free_childcare", category: "childcare", text: "3〜5歳のお子さんが保育園・幼稚園に通っていますか？（無償化）" },
  { key: "child_medical_subsidy", category: "childcare", text: "お子さんの医療費助成（マル乳・マル子）を申請していますか？" },
  { key: "free_highschool", category: "childcare", text: "高校生のお子さんがいますか？（授業料最大39.6万円支援）" },
  { key: "higher_education_support", category: "childcare", text: "大学・専門学校進学を控えた子がいて、世帯収入が低めですか？" },
  { key: "school_assistance", category: "childcare", text: "小中学生がいて、学用品費や給食費の負担が大きいですか？" },
  { key: "special_child_rearing", category: "childcare", text: "障害のある20歳未満のお子さんを養育していますか？（月5.5万円）" },
  { key: "disabled_child_allowance", category: "childcare", text: "重度の障害がある20歳未満のお子さんがいますか？（月1.6万円）" },
  { key: "child_support_allowance_2025", category: "childcare", text: "0〜18歳の子どもがいますか？（子育て応援手当2万円/人）" },
  { key: "free_highschool_2025", category: "childcare", text: "2025年度に高校生のお子さんがいますか？（所得制限撤廃で全世帯無償）" },
  { key: "specific_relative_2025", category: "childcare", text: "19〜22歳の子どもがアルバイトで年収123万円超〜188万円以下ですか？（特定親族特別控除で最大63万円控除）" },
  { key: "kids_nisa_2026", category: "childcare", text: "未成年のお子さんの名義で投資を検討していますか？（こどもNISA 2026年創設予定）" },
  { key: "paternity_leave", category: "childcare", text: "お子さんが生まれる/生まれた父親ですか？（産後パパ育休で最大4週間＋給付金67%）" },
  { key: "childcare_benefit_boost", category: "childcare", text: "2025年4月以降に夫婦で育休を取得予定ですか？（実質手取り10割に引き上げ）" },
  { key: "child_nursing_leave", category: "childcare", text: "小学校就学前の子がいて、子の看護休暇を活用していますか？（年5〜10日取得可能）" },
  { key: "foster_care_allowance", category: "childcare", text: "里親として子どもを養育している、または検討していますか？（月額9万円＋生活費等）" },
  { key: "child_support_detail", category: "childcare", text: "ひとり親家庭で、児童扶養手当の額や加算を確認していますか？（月最大46,690円＋加算）" },
  // --- 障害・介護 ---
  { key: "special_disability_allowance", category: "disability", text: "重度の障害があり常時介護が必要な方がいますか？（月2.9万円）" },
  { key: "disability_pension", category: "disability", text: "病気やケガで日常生活や仕事に長期的な支障がありますか？（障害年金）" },
  { key: "nursing_care_leave", category: "disability", text: "家族の介護のため休業する予定がありますか？" },
  { key: "nursing_home_renovation", category: "disability", text: "要介護の方がいて、バリアフリー改修を検討していますか？（最大18万円補助）" },
  { key: "nursing_equipment", category: "disability", text: "要介護の方がいて、福祉用具の購入を検討していますか？（最大9万円補助）" },
  { key: "family_care_reward", category: "disability", text: "要介護4-5の方を介護サービスなしで在宅介護していますか？" },
  { key: "high_cost_nursing", category: "disability", text: "介護サービスの自己負担が月の上限額を超えていませんか？（高額介護サービス費で還付）" },
  { key: "car_tax_disability", category: "disability", text: "障害者手帳をお持ちで自動車を所有していますか？（自動車税の全額または一部減免）" },
  { key: "toll_road_disability", category: "disability", text: "障害者手帳をお持ちで有料道路を利用していますか？（通行料金が半額）" },
  { key: "public_transport_disability", category: "disability", text: "障害者手帳をお持ちでJR・航空会社を利用していますか？（運賃が半額等）" },
  { key: "assistive_device", category: "disability", text: "義肢・車いす・補聴器等の補装具が必要ですか？（公費で支給、自己負担1割）" },
  { key: "severe_disability_medical", category: "disability", text: "重度の障害があり、医療費の負担が大きいですか？（自治体の医療費助成で無料〜数百円）" },
  { key: "disability_mutual_aid", category: "disability", text: "障害のある方の保護者で、将来の生活保障を準備したいですか？（心身障害者扶養共済、掛金は全額所得控除）" },
  { key: "employment_transition", category: "disability", text: "障害があり、就職訓練や福祉的就労を利用したいですか？（就労移行支援・就労継続支援）" },
  // --- 住宅・生活 ---
  { key: "housing_benefit", category: "living", text: "離職・収入減少で家賃の支払いが厳しくなっていますか？" },
  { key: "home_renovation_subsidy", category: "living", text: "窓の断熱・給湯器交換など省エネリフォームを検討していますか？" },
  { key: "marriage_support", category: "living", text: "最近結婚し、新生活を始めましたか？（最大60万円補助）" },
  { key: "migration_support", category: "living", text: "東京23区から地方への移住を検討していますか？（最大100万円+子1人100万円）" },
  { key: "survivor_pension", category: "living", text: "ご家族が亡くなり、遺族年金をまだ請求していないですか？" },
  { key: "unpaid_pension", category: "living", text: "年金受給中のご家族が亡くなりましたか？（未支給年金を請求可能）" },
  { key: "funeral_expenses", category: "living", text: "ご家族が亡くなり、埋葬料・葬祭費を申請していないですか？" },
  { key: "pension_support", category: "living", text: "年金を受給しており、所得が低めですか？（年金生活者支援給付金）" },
  { key: "disaster_reconstruction", category: "living", text: "自然災害で住宅が全壊・大規模半壊の被害を受けましたか？" },
  { key: "disaster_condolence", category: "living", text: "自然災害でご家族が亡くなりましたか？（災害弔慰金）" },
  { key: "emergency_small_loan", category: "living", text: "一時的に生活費が足りない緊急事態ですか？（無利子10万円）" },
  { key: "comprehensive_support_loan", category: "living", text: "失業等で生活全般に困窮していますか？（月15-20万円貸付）" },
  { key: "single_parent_loan", category: "living", text: "ひとり親家庭で、生活費・教育費等の資金が必要ですか？" },
  { key: "nontax_household_benefits", category: "living", text: "住民税非課税世帯ですか？（医療費上限引き下げ・保険料軽減・保育料無料・大学授業料減免等の総合優遇）" },
  { key: "price_hike_benefit", category: "living", text: "住民税非課税世帯ですか？（物価高騰支援3万円+子1人2万円）" },
  { key: "energy_subsidy", category: "living", text: "電気・ガス料金の補助が自動適用されているか確認しましたか？" },
  { key: "migration_support_expanded", category: "living", text: "東京23区から地方への移住で就業・起業を予定していますか？（世帯100万円+子1人30万円）" },
  { key: "commuting_allowance_2026", category: "living", text: "自動車通勤で片道65km以上の長距離通勤ですか？（非課税限度額が月6.6万円に引き上げ）" },
  { key: "meal_allowance_2026", category: "living", text: "勤務先から社食・ランチ補助を受けていますか？（非課税限度額が月7,500円に倍増）" },
  { key: "livelihood_protection", category: "living", text: "他の制度を使っても生活が困窮していますか？（生活保護で最低限度の生活を保障）" },
  { key: "legal_aid", category: "living", text: "法的トラブルがあるが弁護士費用を払えないですか？（法テラスで無料相談＋費用立替）" },
  { key: "crime_victim_benefit", category: "living", text: "犯罪被害により死亡・重傷・障害を受けた方がいますか？（最大約3,974万円の給付金）" },
  { key: "barrier_free_tax", category: "living", text: "50歳以上・要介護認定者等で、自宅のバリアフリー改修を行いましたか？（所得税控除+固定資産税減額）" },
  { key: "earthquake_retrofit_tax", category: "living", text: "1981年以前の旧耐震基準の住宅を耐震改修しましたか？（所得税控除+固定資産税減額）" },
  { key: "widow_pension", category: "living", text: "自営業の夫が亡くなり、婚姻期間10年以上の妻ですか？（60〜65歳に寡婦年金を支給）" },
  { key: "death_lump_sum", category: "living", text: "国民年金加入者が年金を受けずに亡くなりましたか？（死亡一時金12〜32万円）" },
  // --- 社会保険料の減免 ---
  { key: "nhk_unemployment_reduction", category: "insurance", text: "会社都合で退職し、国保に加入しましたか？（保険料7割減の可能性）" },
  { key: "pension_exemption", category: "insurance", text: "失業・収入減少で国民年金の納付が厳しいですか？（免除制度あり）" },
  { key: "pension_maternity_exemption", category: "insurance", text: "自営業・フリーランスで出産予定がありますか？（年金4か月免除）" },
  { key: "student_pension_deferral", category: "insurance", text: "20歳以上の学生で国民年金保険料の納付を猶予したいですか？" },
  { key: "resident_tax_reduction", category: "insurance", text: "失業・災害等で住民税の納付が困難ですか？（減免制度あり）" },
  { key: "social_insurance_130_reform", category: "insurance", text: "パート・アルバイトで配偶者の扶養に入っていますか？（130万円の壁が残業代除外で緩和）" },
  { key: "maternity_social_insurance", category: "insurance", text: "会社員で産前産後休業中ですか？（健康保険・厚生年金の保険料が全額免除）" },
  { key: "childcare_social_insurance", category: "insurance", text: "会社員で育児休業中ですか？（健康保険・厚生年金の保険料が全額免除）" },
  { key: "pension_3rd_exemption", category: "insurance", text: "配偶者が会社員で、あなたの年収が130万円未満ですか？（第3号被保険者で年金保険料負担なし）" },
  // --- フリーランス・事業者向け ---
  { key: "safety_net_mutual_aid", category: "freelance", text: "個人事業主で、経営セーフティ共済（倒産防止共済）にまだ加入していないですか？（年間最大240万円を経費化）" },
  { key: "invoice_20pct_special", category: "freelance", text: "免税事業者からインボイス登録事業者に転換しましたか？（2割特例で消費税を大幅軽減）" },
  { key: "invoice_transition_2026", category: "freelance", text: "免税事業者との取引がありますか？（2026年10月から仕入税額控除の経過措置が変更）" },
  { key: "wage_increase_credit", category: "freelance", text: "個人事業主で、従業員の給与を前年比1.5%以上引き上げましたか？（増加額の15-40%を税額控除）" },
  { key: "tokyo_startup_grant", category: "freelance", text: "東京都内で創業5年以内ですか？（創業助成金で最大400万円）" },
  { key: "small_biz_sustainability", category: "freelance", text: "従業員20人以下の小規模事業者ですか？（持続化補助金で最大200万円）" },
  { key: "digital_ai_subsidy", category: "freelance", text: "会計ソフト・AI・ITツールの導入を検討していますか？（最大450万円補助）" },
  { key: "small_asset_deduction_2026", category: "freelance", text: "個人事業主で、40万円未満の事業用資産（PC等）を購入しましたか？（2026年から上限引き上げ）" },
  { key: "side_job_expenses", category: "freelance", text: "副業収入がありますか？（家賃按分・通信費・PC・サブスク・書籍・交通費等を経費計上可能）" },
  { key: "freelance_workers_comp", category: "freelance", text: "フリーランスで労災保険に未加入ですか？（2024年11月から全業種で特別加入可能、年間約2万円〜）" },
  { key: "home_office_internet", category: "freelance", text: "フリーランスで通信費・SaaSサブスク（ChatGPT Plus、GitHub Copilot、Adobe CC等）を経費計上していますか？" },
  { key: "coworking_expense", category: "freelance", text: "コワーキングスペースやカフェを仕事場として利用していますか？（経費計上可能）" },
  { key: "startup_expenses", category: "freelance", text: "開業前にかかった費用（セミナー代・名刺代・PC代等）を経費にしていますか？（任意の年に経費化可能）" },
  // --- 2025-2026年度 税制改正 ---
  { key: "basic_deduction_2025", category: "reform", text: "2025年分から基礎控除が最大95万円に引き上げ。確定申告・年末調整に反映されていますか？" },
  { key: "salary_deduction_2025", category: "reform", text: "給与所得者で、年収190万円以下ですか？（給与所得控除が55万→65万円に引き上げ）" },
  { key: "income_wall_178_2026", category: "reform", text: "2026年から年収の壁が178万円に引き上げ。パート・アルバイトの収入を調整していますか？" },
  { key: "crypto_separate_tax", category: "reform", text: "暗号資産（仮想通貨）の売却益がありますか？（2026年から分離課税20%に変更予定）" },
  // --- 相続・贈与 ---
  { key: "gift_annual_110", category: "inheritance", text: "親・祖父母から年間110万円以下の贈与を受けていますか？（暦年贈与で非課税）" },
  { key: "gift_housing", category: "inheritance", text: "親・祖父母から住宅購入資金の贈与を受ける予定がありますか？（最大1,000万円非課税）" },
  { key: "gift_education", category: "inheritance", text: "祖父母等から30歳未満のお孫さんへ教育資金を一括贈与する予定がありますか？（1,500万円まで非課税）" },
  { key: "gift_marriage_child", category: "inheritance", text: "18〜50歳の子・孫へ結婚・子育て資金を贈与する予定がありますか？（1,000万円まで非課税）" },
  { key: "inheritance_precision_tax", category: "inheritance", text: "60歳以上の親・祖父母から大きな金額の生前贈与を検討していますか？（相続時精算課税で2,500万円+年110万円非課税）" },
  // --- シニア向け ---
  { key: "working_senior_pension", category: "senior", text: "65歳以上で年金を受給しながら働いていますか？（2026年4月から基準額65万円に引き上げ）" },
  { key: "senior_employment_benefit", category: "senior", text: "60〜65歳で再雇用により賃金が75%未満に低下しましたか？（高年齢雇用継続給付）" },
  { key: "kakyu_pension", category: "senior", text: "65歳到達時に65歳未満の配偶者または18歳未満の子がいますか？（加給年金で年約40万円加算）" },
  { key: "pension_deferral", category: "senior", text: "年金の受給開始を66歳以降に繰り下げることを検討していますか？（最大84%増額）" },
  { key: "late_senior_medical", category: "senior", text: "75歳以上で、後期高齢者医療制度の負担軽減措置を確認していますか？（1割負担＋保険料軽減）" },
  { key: "silver_human_center", category: "senior", text: "60歳以上で、シルバー人材センターで短期の仕事をしてみたいですか？（年金との併給OK）" },
  // --- 外国人居住者向け ---
  { key: "foreigner_tax_treaty", category: "foreigner", text: "日本で働く外国人の方ですか？（租税条約による所得税の軽減・免除の可能性あり）" },
  { key: "foreigner_pension_refund", category: "foreigner", text: "日本を出国予定の外国人で、6ヶ月以上厚生年金に加入していましたか？（脱退一時金を請求可能）" },
  // --- 予防・健康増進 ---
  { key: "specific_health_checkup", category: "prevention", text: "40〜74歳で、メタボ健診（特定健康診査）を毎年受けていますか？（無料で受診可能）" },
  { key: "vaccination_subsidy", category: "prevention", text: "予防接種の助成制度を活用していますか？（インフルエンザ・帯状疱疹・子どもの定期接種等）" },
  { key: "dental_checkup_free", category: "prevention", text: "40歳・50歳・60歳・70歳等の節目年齢で無料歯科健診を受けていますか？" },
  { key: "mental_health_consultation", category: "prevention", text: "精神的な悩みや不調を抱えていますか？（無料相談窓口・ホットラインあり）" },
  // --- 住宅・リフォーム ---
  { key: "eco_house_2026", category: "housing", text: "省エネ住宅の新築を検討していますか？（みらいエコ住宅2026事業で最大125万円補助）" },
  { key: "window_renovation_2026", category: "housing", text: "窓を高断熱窓に改修する予定がありますか？（先進的窓リノベで最大100万円補助）" },
  { key: "hot_water_2026", category: "housing", text: "エコキュート・エネファーム等の高効率給湯器の導入を検討していますか？（最大17万円補助）" },
  { key: "solar_subsidy", category: "housing", text: "自宅に太陽光発電設備の設置を検討していますか？（東京都は最大36万円＋蓄電池で最大120万円追加）" },
  { key: "ev_cev_subsidy", category: "housing", text: "電気自動車・プラグインハイブリッド車の購入を検討していますか？（CEV補助金で最大130万円）" },
  { key: "eco_car_tax", category: "housing", text: "EV・ハイブリッド車を所有していますか？（自動車重量税免税・自動車税75%軽減等）" },
  // --- 農業・就農 ---
  { key: "farming_preparation_fund", category: "agriculture", text: "49歳以下で農業研修を受ける予定がありますか？（年間最大150万円を最長2年間交付）" },
  { key: "farming_start_fund", category: "agriculture", text: "49歳以下で独立して農業を始める予定がありますか？（年間最大150万円を最長3年間交付）" },
  { key: "farming_development", category: "agriculture", text: "新規就農者で農業機械・施設の導入を検討していますか？（最大1,000万円補助）" },
  { key: "farming_youth_loan", category: "agriculture", text: "新規就農者で農地・農機具等の購入資金が必要ですか？（無利子融資で最大3,700万円）" },
  // --- 学生向け ---
  { key: "jasso_grant_scholarship", category: "student", text: "住民税非課税世帯等の大学・専門学校生ですか？（給付型奨学金で月最大75,800円）" },
  { key: "tuition_waiver", category: "student", text: "大学等の授業料が負担ですか？（授業料減免制度で最大年70万円免除）" },
  { key: "multichild_university_free", category: "student", text: "子ども3人以上の世帯で大学等に通う学生ですか？（所得制限なしで授業料免除）" },
  { key: "education_training_general", category: "student", text: "簿記・FP・MOS等の資格講座を受講予定ですか？（一般教育訓練給付金で受講費の20%、上限10万円）" },
  { key: "education_training_specific", category: "student", text: "大型免許・介護実務者研修等の実務資格講座を受講予定ですか？（受講費の40%、上限20万円）" },
  { key: "education_training_professional", category: "student", text: "看護・保育・介護等の専門資格講座を受講予定ですか？（受講費の最大70%、年間上限56万円）" },
  // --- 省エネ・環境 ---
  { key: "solar_panel_tax_deduction", category: "energy", text: "太陽光発電設備を設置した住宅の固定資産税が減免される制度を知っていますか？" },
  { key: "battery_storage_subsidy", category: "energy", text: "家庭用蓄電池の導入を検討していますか？（東京都は最大120万円補助）" },
  { key: "insulation_renovation", category: "energy", text: "壁・天井・床の断熱リフォームを検討していますか？（最大100万円補助）" },
  // --- 生活（追加） ---
  { key: "garbage_processor_subsidy", category: "living", text: "生ごみ処理機の購入を検討していますか？（自治体が購入費の1/2〜2/3を補助）" },
  { key: "delivery_box_subsidy", category: "living", text: "宅配ボックスの設置を検討していますか？（再配達削減で自治体が補助、最大5〜15万円）" },
  { key: "electric_bicycle_subsidy", category: "living", text: "子育て世帯で電動アシスト自転車の購入を検討していますか？（自治体が補助）" },
  { key: "pet_sterilization_subsidy", category: "living", text: "飼い猫・飼い犬の不妊・去勢手術を予定していますか？（自治体が費用を一部助成）" },
  { key: "grave_removal_subsidy", category: "living", text: "墓じまい（墓石撤去・改葬）を検討していますか？（自治体が補助金を支給する場合あり）" },
  { key: "water_fee_reduction", category: "living", text: "水道料金の減免制度を利用していますか？（物価高騰対策・生活保護・障害者世帯向け）" },
  { key: "rice_coupon", category: "living", text: "自治体のおこめ券・電子クーポン・地域商品券の配布を受け取りましたか？" },
  { key: "education_loan_return_support", category: "living", text: "奨学金を返還中ですか？（企業の代理返還制度で給与課税されず返還可能）" },
  // --- 医療（追加） ---
  { key: "health_insurance_additional", category: "medical", text: "大企業の健保組合に加入していますか？（付加給付で自己負担が月25,000円超の分を還元）" },
  { key: "high_cost_medical_2026", category: "medical", text: "2026年8月以降の高額療養費制度の見直しを把握していますか？（所得区分の細分化）" },
  { key: "copayment_reduction", category: "medical", text: "災害・失業等で国保の医療費自己負担が困難ですか？（窓口負担の減額・免除が可能）" },
  // --- 障害・介護（追加） ---
  { key: "disability_taxi", category: "disability", text: "障害者手帳をお持ちで、タクシー券・福祉タクシー助成を利用していますか？（月数千円〜1万円）" },
  { key: "disability_parking", category: "disability", text: "障害者手帳をお持ちで、パーキングパーミット（障害者用駐車場利用証）を取得していますか？" },
  { key: "hearing_aid_subsidy", category: "disability", text: "軽度〜中等度の難聴で補聴器の購入を検討していますか？（自治体が最大72,450円助成）" },
  // --- 子育て（追加） ---
  { key: "maternity_support_2025", category: "childcare", text: "妊娠中または最近出産しましたか？（妊婦のための支援給付で計10万円、2025年法制度化）" },
  { key: "child_food_support", category: "childcare", text: "子ども食堂・フードバンクの利用を検討していますか？（無料〜数百円で食事を提供）" },
  { key: "kodomo_navi", category: "childcare", text: "学童クラブの待機児童ですか？（認証学童クラブ・民間学童の利用料補助あり）" },
  // --- 雇用（追加） ---
  { key: "elderly_employment_subsidy", category: "employment", text: "事業主の方：65歳以上への定年引上げや継続雇用制度を導入しましたか？（最大160万円助成）" },
  { key: "disability_employment_subsidy", category: "employment", text: "事業主の方：障害者の雇用に必要な施設整備・雇用管理を行いましたか？（助成金あり）" },
  // --- 保険（追加） ---
  { key: "farmers_pension_subsidy", category: "insurance", text: "39歳以下の農業者ですか？（農業者年金の保険料に最長20年間の国庫補助）" },
  // --- フリーランス（追加） ---
  { key: "bungeibijutsu_kenpo", category: "freelance", text: "フリーランスのクリエイターで、文芸美術国保に加入していないですか？（保険料が一律で安くなる可能性）" },
  { key: "freelance_new_law", category: "freelance", text: "フリーランスで、契約条件の書面明示・60日以内の報酬支払い等が守られていますか？（フリーランス新法）" },
  // --- 税（追加） ---
  { key: "social_insurance_deduction", category: "tax", text: "国民年金・健康保険等の社会保険料を全額所得控除していますか？（家族分も合算可能）" },
  { key: "donated_goods_deduction", category: "tax", text: "大学・社会福祉法人等に寄附をしていますか？（寄附金控除で「寄附金額-2,000円」を所得控除）" },
  { key: "life_insurance_pension_deduction", category: "tax", text: "個人年金保険に加入していますか？（保険料控除で最大4万円の所得控除）" },
  // --- シニア（追加） ---
  { key: "senior_free_pass", category: "senior", text: "65歳以上で、シルバーパス・敬老パスを取得していますか？（バス・電車が無料〜割引）" },
  { key: "senior_home_care", category: "senior", text: "一人暮らしの高齢者で、配食サービスを利用していますか？（安否確認も兼ねる）" },
  { key: "senryo_pension_reform", category: "senior", text: "遺族年金の受給に関心がありますか？（2026年改正で男女差が解消へ）" },
  // --- 外国人（追加） ---
  { key: "foreigner_health_insurance", category: "foreigner", text: "在留期間3ヶ月超の外国人で、国民健康保険に加入していますか？（保険料減額・免除の申請も可能）" },
  { key: "foreigner_childbirth", category: "foreigner", text: "国保・社保に加入している外国人で、出産予定がありますか？（出産育児一時金50万円の対象）" },
]

const CATEGORIES: Category[] = [
  { id: "tax", label: "節税・控除", description: "所得控除・税額控除で税金を取り戻す", questionCount: 0 },
  { id: "medical", label: "医療・健康", description: "高額医療費・傷病手当金など", questionCount: 0 },
  { id: "employment", label: "雇用・就職", description: "失業給付・再就職手当・職業訓練など", questionCount: 0 },
  { id: "childcare", label: "子育て・教育", description: "児童手当・出産一時金・学費支援など", questionCount: 0 },
  { id: "disability", label: "障害・介護", description: "障害年金・介護休業給付・福祉用具など", questionCount: 0 },
  { id: "living", label: "住宅・生活・年金", description: "住居支援・遺族年金・災害支援・物価高対策など", questionCount: 0 },
  { id: "insurance", label: "社会保険料の減免", description: "国保軽減・年金免除・130万円の壁など", questionCount: 0 },
  { id: "freelance", label: "フリーランス・事業者", description: "経営セーフティ共済・インボイス・補助金など", questionCount: 0 },
  { id: "reform", label: "2025-2026 税制改正", description: "基礎控除引き上げ・年収の壁178万円・暗号資産など", questionCount: 0 },
  { id: "inheritance", label: "相続・贈与", description: "暦年贈与・住宅資金贈与・教育資金贈与・相続時精算課税など", questionCount: 0 },
  { id: "senior", label: "シニア向け", description: "在職老齢年金・高年齢雇用継続給付・加給年金・繰下げ受給など", questionCount: 0 },
  { id: "foreigner", label: "外国人居住者向け", description: "租税条約による税金軽減・厚生年金の脱退一時金など", questionCount: 0 },
  { id: "prevention", label: "予防・健康増進", description: "健康診断・予防接種・メタボ健診・歯科健診など", questionCount: 0 },
  { id: "housing", label: "住宅・リフォーム", description: "省エネ住宅補助・窓リノベ・給湯器・太陽光・EV補助金など", questionCount: 0 },
  { id: "agriculture", label: "農業・就農", description: "就農準備資金・経営開始資金・農業融資など", questionCount: 0 },
  { id: "student", label: "学生向け", description: "給付型奨学金・授業料減免・教育訓練給付金など", questionCount: 0 },
  { id: "energy", label: "省エネ・環境", description: "太陽光発電税制・蓄電池補助・断熱リフォームなど", questionCount: 0 },
]

// Compute question counts
CATEGORIES.forEach((cat) => {
  cat.questionCount = QUESTIONS.filter((q) => q.category === cat.id).length
})

type AnswerEntry = { using: boolean; amount?: number }

type Props = {
  annualIncome: number
  age: number
}

export function DiagnosisWizard({ annualIncome, age }: Props) {
  const router = useRouter()
  const [selectedCategories, setSelectedCategories] = useState<Set<string> | null>(null)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, AnswerEntry>>({})
  const [followUpValue, setFollowUpValue] = useState("")
  const [pendingYes, setPendingYes] = useState(false)

  const filteredQuestions = useMemo(() => {
    if (!selectedCategories) return []
    return QUESTIONS.filter((q) => selectedCategories.has(q.category))
  }, [selectedCategories])

  const currentQuestion = filteredQuestions[step]
  const progress = filteredQuestions.length > 0
    ? Math.round(((step + 1) / filteredQuestions.length) * 100)
    : 0

  function toggleCategory(id: string) {
    setSelectedCategories((prev) => {
      const next = new Set(prev ?? [])
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function selectAll() {
    setSelectedCategories(new Set(CATEGORIES.map((c) => c.id)))
  }

  function startDiagnosis() {
    if (!selectedCategories || selectedCategories.size === 0) return
    setStep(0)
  }

  function recordAndAdvance(entry: AnswerEntry) {
    const updatedAnswers = { ...answers, [currentQuestion.key]: entry }
    setAnswers(updatedAnswers)
    setPendingYes(false)
    setFollowUpValue("")

    const nextStep = step + 1
    if (nextStep >= filteredQuestions.length) {
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

  // Category selection screen
  if (selectedCategories === null || (selectedCategories.size > 0 && step === 0 && Object.keys(answers).length === 0 && !currentQuestion)) {
    return (
      <Card className="w-full max-w-xl mx-auto">
        <CardHeader>
          <CardTitle className="text-lg">あなたに関係するカテゴリを選んでください</CardTitle>
          <CardDescription>
            選んだカテゴリの質問だけ表示します。関係ないカテゴリはスキップできます。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategories?.has(cat.id) ?? false
            return (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs font-bold ${
                  isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
                }`}>
                  {isSelected ? "v" : ""}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{cat.label}</span>
                    <span className="text-xs text-muted-foreground">{cat.questionCount}問</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
                </div>
              </button>
            )
          })}
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={selectAll}
            >
              すべて選択
            </Button>
            <Button
              size="lg"
              className="flex-1"
              onClick={startDiagnosis}
              disabled={!selectedCategories || selectedCategories.size === 0}
            >
              診断開始（{selectedCategories?.size ? filteredQuestions.length : 0}問）
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Question screen
  if (!currentQuestion) return null

  const currentCat = CATEGORIES.find((c) => c.id === currentQuestion.category)

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-primary">{currentCat?.label}</span>
          <span className="text-sm text-muted-foreground">
            {step + 1} / {filteredQuestions.length}
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
