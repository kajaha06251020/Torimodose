type LossDisplayProps = {
  annualLoss: number;
  median: number;
  percentile: string;
};

const PERCENTILE_LABELS: Record<string, string> = {
  below_p25: "下位25%未満",
  p25_to_p50: "下位25〜50%",
  p50_to_p75: "上位25〜50%",
  above_p75: "上位25%以上",
};

export function LossDisplay({ annualLoss, median, percentile }: LossDisplayProps) {
  const hasLoss = annualLoss > 0;

  return (
    <div className="text-center">
      <p className="text-sm text-muted-foreground">あなたの推定損失額</p>
      <p className={`mt-2 text-4xl sm:text-5xl font-black ${hasLoss ? "text-red-600" : "text-green-600"}`}>
        {hasLoss ? "-" : "+"}¥{annualLoss.toLocaleString()}
        <span className="text-base font-normal text-muted-foreground">/年</span>
      </p>
      <div className="mt-4 space-y-1 text-sm text-muted-foreground">
        <p>同年代・同職種の中央値: ¥{median.toLocaleString()}</p>
        <p>あなたの位置: {PERCENTILE_LABELS[percentile] ?? percentile}</p>
      </div>
    </div>
  );
}
