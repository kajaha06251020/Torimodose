import { redirect } from "next/navigation"
import { DiagnosisWizard } from "@/components/forms/DiagnosisWizard"

type Props = {
  searchParams: Promise<{ income?: string; age?: string }>
}

export default async function DiagnosisPage({ searchParams }: Props) {
  const params = await searchParams

  if (!params.income || !params.age) {
    redirect("/")
  }

  const income = parseInt(params.income, 10)
  const age = parseInt(params.age, 10)

  if (isNaN(income) || isNaN(age)) {
    redirect("/")
  }

  return (
    <div className="flex flex-col items-center py-8 sm:py-16 px-4 min-h-screen bg-zinc-50 dark:bg-black">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-8">
        控除・給付金の診断
      </h1>
      <DiagnosisWizard annualIncome={income * 10000} age={age} />
    </div>
  )
}
