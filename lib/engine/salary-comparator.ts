export type SalaryStatRow = {
  occupation: string;
  region: string;
  ageGroup: string;
  median: number;
  p25: number;
  p75: number;
};

export type ComparisonResult = {
  median: number;
  p25: number;
  p75: number;
  medianGap: number;
  percentile: "below_p25" | "p25_to_p50" | "p50_to_p75" | "above_p75";
  annualLoss: number;
};

function ageToGroup(age: number): string {
  if (age < 20) return "under_20";
  if (age <= 24) return "20-24";
  if (age <= 29) return "25-29";
  if (age <= 34) return "30-34";
  if (age <= 39) return "35-39";
  if (age <= 44) return "40-44";
  if (age <= 49) return "45-49";
  if (age <= 54) return "50-54";
  if (age <= 59) return "55-59";
  return "60_plus";
}

function getPercentile(
  income: number,
  stat: SalaryStatRow
): ComparisonResult["percentile"] {
  if (income < stat.p25) return "below_p25";
  if (income < stat.median) return "p25_to_p50";
  if (income < stat.p75) return "p50_to_p75";
  return "above_p75";
}

export function compareSalary(params: {
  annualIncome: number;
  occupation: string;
  region: string;
  age: number;
  stats: SalaryStatRow[];
}): ComparisonResult | null {
  // 都道府県 → 代表地域のフォールバックマップ（動的importを避けるためインライン定義）
  const FALLBACK: Record<string, string> = {
    hokkaido: "hokkaido", aomori: "hokkaido", iwate: "hokkaido",
    miyagi: "hokkaido", akita: "hokkaido", yamagata: "hokkaido", fukushima: "hokkaido",
    ibaraki: "saitama", tochigi: "saitama", gunma: "saitama",
    saitama: "saitama", chiba: "chiba", tokyo: "tokyo", kanagawa: "kanagawa",
    niigata: "saitama", toyama: "aichi", ishikawa: "aichi", fukui: "aichi",
    yamanashi: "saitama", nagano: "saitama", gifu: "aichi", shizuoka: "aichi", aichi: "aichi",
    mie: "aichi", shiga: "osaka", kyoto: "kyoto", osaka: "osaka",
    hyogo: "hyogo", nara: "osaka", wakayama: "osaka",
    tottori: "osaka", shimane: "osaka", okayama: "osaka", hiroshima: "osaka", yamaguchi: "osaka",
    tokushima: "osaka", kagawa: "osaka", ehime: "osaka", kochi: "osaka",
    fukuoka: "fukuoka", saga: "fukuoka", nagasaki: "fukuoka", kumamoto: "fukuoka",
    oita: "fukuoka", miyazaki: "fukuoka", kagoshima: "fukuoka", okinawa: "fukuoka",
  };

  const ageGroup = ageToGroup(params.age);

  const findStat = (region: string) =>
    params.stats.find(
      (s) =>
        s.occupation === params.occupation &&
        s.region === region &&
        s.ageGroup === ageGroup
    );

  const stat = findStat(params.region) ?? findStat(FALLBACK[params.region] ?? "");

  if (!stat) return null;

  const medianGap = params.annualIncome - stat.median;
  const annualLoss = medianGap < 0 ? Math.abs(medianGap) : 0;

  return {
    median: stat.median,
    p25: stat.p25,
    p75: stat.p75,
    medianGap,
    percentile: getPercentile(params.annualIncome, stat),
    annualLoss,
  };
}
