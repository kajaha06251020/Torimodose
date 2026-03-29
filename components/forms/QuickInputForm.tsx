"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const OCCUPATIONS = [
  { value: "software_engineer", label: "エンジニア・IT" },
  { value: "sales", label: "営業" },
  { value: "office_admin", label: "事務・管理" },
  { value: "marketing", label: "マーケティング・企画" },
];

const REGIONS = [
  { value: "tokyo", label: "東京都" },
  { value: "osaka", label: "大阪府" },
  { value: "kanagawa", label: "神奈川県" },
  { value: "aichi", label: "愛知県" },
  { value: "fukuoka", label: "福岡県" },
];

export function QuickInputForm() {
  const router = useRouter();
  const [income, setIncome] = useState("");
  const [age, setAge] = useState("");
  const [occupation, setOccupation] = useState("");
  const [region, setRegion] = useState("");

  const isComplete = income !== "" && age !== "" && occupation !== "" && region !== "";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isComplete) return;
    const params = new URLSearchParams({
      income,
      occupation,
      region,
      age,
    });
    router.push(`/result/quick?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="income">年収（万円）</Label>
          <Input
            id="income"
            type="number"
            placeholder="例: 400"
            min={1}
            value={income}
            onChange={(e) => setIncome(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="age">年齢</Label>
          <Input
            id="age"
            type="number"
            placeholder="例: 30"
            min={18}
            max={65}
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="occupation">職種</Label>
        <Select value={occupation} onValueChange={(v) => setOccupation(v ?? "")}>
          <SelectTrigger id="occupation">
            <SelectValue placeholder="職種を選択" />
          </SelectTrigger>
          <SelectContent>
            {OCCUPATIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="region">勤務地</Label>
        <Select value={region} onValueChange={(v) => setRegion(v ?? "")}>
          <SelectTrigger id="region">
            <SelectValue placeholder="勤務地を選択" />
          </SelectTrigger>
          <SelectContent>
            {REGIONS.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" disabled={!isComplete}>
        損失額を診断する
      </Button>
    </form>
  );
}
