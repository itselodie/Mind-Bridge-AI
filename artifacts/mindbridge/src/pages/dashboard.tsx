import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useGetProgress } from "@workspace/api-client-react";
import { useMasteryContext } from "@/context/MasteryContext";
import { Layout } from "@/components/layout";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Lock,
  CheckCircle2,
  Trophy,
  ArrowRight,
  Flame,
  Target,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NODE_CATEGORIES } from "@/lib/nodes";

// Mock streak — in a real app this would come from the backend
const MOCK_STREAK = 7;

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { state } = useMasteryContext();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [isStarting, setIsStarting] = useState(false);

  const progressQuery = useGetProgress({
    mutation: {
      onSuccess: () => setIsStarting(false),
    },
  });

  useEffect(() => {
    setIsStarting(true);
    progressQuery.mutate({ data: { mastery: state.mastery } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.mastery]);

  if (progressQuery.isPending || isStarting) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="mt-4 font-medium">Loading your progress...</p>
        </div>
      </Layout>
    );
  }

  if (progressQuery.isError || !progressQuery.data) {
    return (
      <Layout>
        <div className="text-center py-12 space-y-4">
          <p className="text-destructive">Failed to load progress data.</p>
          <Button onClick={() => progressQuery.mutate({ data: { mastery: state.mastery } })}>
            Retry
          </Button>
        </div>
      </Layout>
    );
  }

  const { next_node, next_label, topics } = progressQuery.data;

  // ── Computed stats ────────────────────────────────────────────────────────
  const masteredCount = topics.filter((t) => t.mastery >= 0.7).length;
  const inProgressCount = topics.filter((t) => t.mastery > 0 && t.mastery < 0.7).length;
  const overallPct = Math.round(
    (topics.reduce((sum, t) => sum + t.mastery, 0) / topics.length) * 100,
  );

  const toggleCategory = (label: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500">

        {/* ── Header stats ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border shadow-sm">
            <CardContent className="p-4 flex flex-col items-center text-center gap-1">
              <div className="w-9 h-9 rounded-xl bg-chart-1/15 text-chart-1 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-foreground">{masteredCount}</span>
              <span className="text-xs text-muted-foreground font-medium">Mastered</span>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardContent className="p-4 flex flex-col items-center text-center gap-1">
              <div className="w-9 h-9 rounded-xl bg-chart-2/15 text-chart-2 flex items-center justify-center">
                <Flame className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-foreground">{MOCK_STREAK}</span>
              <span className="text-xs text-muted-foreground font-medium">Day Streak</span>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardContent className="p-4 flex flex-col items-center text-center gap-1">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-foreground">{overallPct}%</span>
              <span className="text-xs text-muted-foreground font-medium">Complete</span>
            </CardContent>
          </Card>
        </div>

        {/* ── Overall progress bar ────────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span className="text-muted-foreground">Overall completion</span>
            <span className="text-foreground font-bold">{masteredCount} / {topics.length} topics</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-1000"
              style={{ width: `${overallPct}%` }}
            />
          </div>
        </div>

        {/* ── Today's recommendation ──────────────────────────────────────── */}
        <Card className="border-2 shadow-sm overflow-hidden bg-gradient-to-br from-card to-primary/5">
          <CardContent className="p-6 md:p-8">
            {next_node ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="flex-1 space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                    <Target className="w-3.5 h-3.5" />
                    Today's Recommendation
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">{next_label}</h3>
                  <p className="text-sm text-muted-foreground">
                    {inProgressCount > 0
                      ? `${inProgressCount} topic${inProgressCount > 1 ? "s" : ""} in progress · study this next to keep your streak.`
                      : "Start here to build your foundation step by step."}
                  </p>
                </div>
                <Button
                  size="lg"
                  className="gap-2 rounded-xl shrink-0 font-semibold"
                  onClick={() => setLocation("/")}
                >
                  Study now <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center gap-4 py-4">
                <div className="w-16 h-16 bg-chart-2/20 text-chart-2 rounded-full flex items-center justify-center">
                  <Trophy className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">You've mastered everything!</h3>
                  <p className="text-muted-foreground mt-1">
                    Incredible work — a full DSA foundation built.
                  </p>
                </div>
                <Button variant="outline" onClick={() => setLocation("/")}>
                  Keep reviewing
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Progress by category ────────────────────────────────────────── */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold tracking-tight">Progress by Topic</h2>

          <div className="space-y-2">
            {NODE_CATEGORIES.map((category) => {
              const catTopics = category.nodeIds
                .map((id) => topics.find((t) => t.id === id))
                .filter(Boolean) as typeof topics;

              const catMastered = catTopics.filter((t) => t.mastery >= 0.7).length;
              const catAvgPct = catTopics.length
                ? Math.round(
                    (catTopics.reduce((s, t) => s + t.mastery, 0) / catTopics.length) * 100,
                  )
                : 0;
              const isOpen = expanded.has(category.label);

              return (
                <Card key={category.label} className="border overflow-hidden">
                  {/* Category header — always visible */}
                  <button
                    onClick={() => toggleCategory(category.label)}
                    className="w-full p-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors text-left"
                  >
                    <span className="text-2xl">{category.emoji}</span>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-foreground">{category.label}</span>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-muted-foreground font-medium">
                            {catMastered}/{catTopics.length}
                          </span>
                          <span className="text-sm font-bold text-foreground w-10 text-right">
                            {catAvgPct}%
                          </span>
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-700",
                            catAvgPct >= 70
                              ? "bg-chart-1"
                              : catAvgPct > 0
                              ? "bg-chart-2"
                              : "bg-muted-foreground/30",
                          )}
                          style={{ width: `${catAvgPct}%` }}
                        />
                      </div>
                    </div>
                  </button>

                  {/* Expanded: individual topic rows */}
                  {isOpen && (
                    <div className="border-t divide-y bg-secondary/10 animate-in fade-in duration-200">
                      {catTopics.map((topic) => {
                        const pct = Math.round(topic.mastery * 100);
                        const isMastered = topic.mastery >= 0.7;

                        return (
                          <div
                            key={topic.id}
                            className="flex items-center gap-4 px-4 py-3"
                          >
                            <div
                              className={cn(
                                "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
                                isMastered
                                  ? "bg-chart-1/20 text-chart-1"
                                  : !topic.is_unlocked
                                  ? "bg-muted text-muted-foreground"
                                  : "bg-primary/10 text-primary",
                              )}
                            >
                              {isMastered ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : !topic.is_unlocked ? (
                                <Lock className="w-3.5 h-3.5" />
                              ) : (
                                <span className="text-xs font-bold">{pct}</span>
                              )}
                            </div>

                            <span
                              className={cn(
                                "flex-1 text-sm font-medium",
                                !topic.is_unlocked && "text-muted-foreground",
                              )}
                            >
                              {topic.label}
                            </span>

                            <div className="flex items-center gap-2 w-28">
                              <Progress
                                value={pct}
                                className={cn(
                                  "h-2 flex-1",
                                  !topic.is_unlocked && "opacity-30",
                                )}
                                indicatorClassName={cn(
                                  isMastered
                                    ? "bg-chart-1"
                                    : topic.mastery > 0
                                    ? "bg-chart-2"
                                    : "bg-muted-foreground/30",
                                )}
                              />
                              <span className="text-xs font-bold text-muted-foreground w-8 text-right">
                                {pct}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* ── Mastered topics quick-view ──────────────────────────────────── */}
        {masteredCount > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Mastered ({masteredCount})
            </h3>
            <div className="flex flex-wrap gap-2">
              {topics
                .filter((t) => t.mastery >= 0.7)
                .map((topic) => (
                  <div
                    key={topic.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-chart-1/10 text-chart-1 text-sm font-medium border border-chart-1/20"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {topic.label}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
