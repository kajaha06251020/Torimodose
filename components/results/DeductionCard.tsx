import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DeductionCardProps = {
  name: string;
  potentialSaving: number;
  legalBasis: string;
  description: string;
  howTo: string;
};

export function DeductionCard({
  name,
  potentialSaving,
  legalBasis,
  description,
  howTo,
}: DeductionCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{name}</CardTitle>
          <span className="shrink-0 text-lg font-bold text-red-600">
            ¥{potentialSaving.toLocaleString()}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{legalBasis}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm">{description}</p>
        <div className="rounded bg-muted p-3">
          <p className="text-xs font-medium text-muted-foreground">取り戻す方法</p>
          <p className="mt-1 text-sm">{howTo}</p>
        </div>
      </CardContent>
    </Card>
  );
}
