// src/components/dashboard/UsageCard.jsx
import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Gauge, Zap, Clock, BarChart3, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UsageCard() {
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res = await fetch("/api/user/usage", { credentials: "include" });
        const json = await res.json();
        setUsage(json);
      } catch (e) {
        console.error("❌ שגיאה בשליפת usage:", e);
      }
    };

    fetchUsage();
  }, []);

  if (!usage) return null;

  const { plan, usage: used, limits } = usage;

  const percentUsed = (used.minutes_used / limits.max_minutes_per_month) * 100;
  const percentUsedTranscripts = (used.transcripts / limits.max_transcripts_per_month) * 100;

  return (
    <Card className="shadow-sm hover:shadow-md transition-all">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-500" />
          מסלול נוכחי
          <Badge className="ml-auto capitalize">{plan}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-gray-700">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-500" />
          תמלולים: {used.transcripts} / {limits.max_transcripts_per_month}
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-500" />
          דקות: {used.minutes_used} / {limits.max_minutes_per_month}
        </div>
        {"credits_left" in used && (
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-green-500" />
            קרדיטים: {used.credits_left}
          </div>
        )}
        <div className="pt-2">
          <a
            href="/pricing"
            className="text-blue-600 text-sm font-medium hover:underline"
          >
            🚀 שדרג מסלול כדי להנות ממגבלות רחבות יותר →
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
