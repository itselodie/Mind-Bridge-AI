import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Star, RotateCcw, ArrowRight, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuccessScreenProps {
  nodeLabel: string;
  score: number;
  total: number;
  onStudyAnother: () => void;
}

export function SuccessScreen({ nodeLabel, score, total, onStudyAnother }: SuccessScreenProps) {
  const [, setLocation] = useLocation();
  const ratio = score / total;
  const pct = Math.round(ratio * 100);
  const isMastered = ratio >= 0.7;

  return (
    <div className="text-center space-y-8 animate-in zoom-in-95 fade-in duration-500 max-w-lg mx-auto py-4">

      {/* Trophy */}
      <div className="relative inline-flex">
        <div
          className={cn(
            "w-28 h-28 rounded-full flex items-center justify-center mx-auto",
            isMastered
              ? "bg-chart-1/20 text-chart-1"
              : "bg-chart-2/20 text-chart-2",
          )}
        >
          <Trophy className="w-14 h-14" />
        </div>
        {isMastered && (
          <div className="absolute -top-1 -right-1 w-9 h-9 bg-chart-2 rounded-full flex items-center justify-center animate-bounce shadow-md">
            <Star className="w-5 h-5 text-white fill-white" />
          </div>
        )}
      </div>

      {/* Headline */}
      <div className="space-y-3">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">
          {isMastered ? "Great job!" : "Good effort!"}
        </h2>
        <p className="text-muted-foreground text-lg">
          {isMastered
            ? "You've mastered this topic."
            : "Keep practising — you're getting there."}
        </p>
      </div>

      {/* Score card */}
      <Card className="border-2 shadow-sm overflow-hidden">
        <CardContent className="p-6 space-y-4">

          {/* Mastered badge */}
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              You mastered
            </p>
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="w-5 h-5 text-chart-1" />
              <p className="text-2xl font-bold text-foreground">{nodeLabel}</p>
            </div>
          </div>

          <div className="border-t" />

          {/* Score */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Quiz Score</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-black text-foreground">{score}</span>
              <span className="text-2xl text-muted-foreground font-semibold">/{total}</span>
            </div>

            {/* Score bar */}
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden mt-3">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-1000",
                  isMastered ? "bg-chart-1" : "bg-chart-2",
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p
              className={cn(
                "text-sm font-semibold",
                isMastered ? "text-chart-1" : "text-chart-2",
              )}
            >
              {pct}% — {isMastered ? "Mastery achieved ✓" : "Keep going!"}
            </p>
          </div>

          {!isMastered && (
            <p className="text-xs text-muted-foreground border rounded-lg p-3 bg-muted/40">
              Score 70% or higher to mark this topic as mastered. Review the lesson and try again!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button variant="outline" size="lg" onClick={onStudyAnother} className="gap-2 rounded-xl">
          <RotateCcw className="w-4 h-4" />
          Study another topic
        </Button>
        <Button size="lg" onClick={() => setLocation("/dashboard")} className="gap-2 rounded-xl">
          View my progress <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
