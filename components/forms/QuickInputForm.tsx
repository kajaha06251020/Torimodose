"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OCCUPATIONS, REGION_GROUPS, OCCUPATION_LABELS, REGION_LABELS } from "@/lib/constants";

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
    router.push(`/diagnosis?income=${income}&age=${age}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
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
            <SelectValue placeholder="職種を選択">
              {occupation ? OCCUPATION_LABELS[occupation] : null}
            </SelectValue>
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
            <SelectValue placeholder="都道府県を選択">
              {region ? REGION_LABELS[region] : null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {REGION_GROUPS.map((group) => (
              <SelectGroup key={group.label}>
                <SelectLabel>{group.label}</SelectLabel>
                {group.prefectures.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" disabled={!isComplete}>
        取り戻せる額を診断する
      </Button>
    </form>
  );
}
