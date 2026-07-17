import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useGetProgress } from "@workspace/api-client-react";
import { useMasteryContext } from "@/context/MasteryContext";
import { Layout } from "@/components/layout";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, Unlock, CheckCircle2, Play, Trophy, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { state } = useMasteryContext();
  const [isStarting, setIsStarting] = useState(false);

  const progressQuery = useGetProgress({
    mutation: {
      onSuccess: () => {
        setIsStarting(false);
      }
    }
  });

  // Call on mount and when mastery changes
  useEffect(() => {
    setIsStarting(true);
    progressQuery.mutate({ data: { mastery: state.mastery } });
    // We intentionally only want this to run when state.mastery changes structurally,
    // but the object reference is stable in our app unless updated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.mastery, progressQuery.mutate]);

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
        <div className="text-center py-12 text-destructive">
          <p>Failed to load progress data.</p>
        </div>
      </Layout>
    );
  }

  const { next_node, next_label, topics } = progressQuery.data;

  // Sort: unlocked first, then locked. Within unlocked, sort by mastery (lower first, so needs attention is at top)
  const sortedTopics = [...topics].sort((a, b) => {
    if (a.is_unlocked && !b.is_unlocked) return -1;
    if (!a.is_unlocked && b.is_unlocked) return 1;
    if (a.is_unlocked && b.is_unlocked) {
      return a.mastery - b.mastery;
    }
    return 0;
  });

  const masteredTopics = topics.filter(t => t.mastery >= 0.7);

  return (
    <Layout>
      <div className="space-y-10 animate-in fade-in duration-500">
        
        {/* Section 2 (Top visually): Learning Path / Next Up */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Your Learning Path</h2>
          
          <Card className="border-2 shadow-sm overflow-hidden bg-gradient-to-br from-card to-secondary/50">
            <CardContent className="p-8 md:p-10 text-center flex flex-col items-center">
              {next_node ? (
                <>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6">
                    <Play className="w-4 h-4" /> Suggested Next
                  </div>
                  <h3 className="text-3xl font-bold mb-8">{next_label}</h3>
                  <Button 
                    size="lg" 
                    className="px-8 py-6 text-lg rounded-full shadow-md gap-2"
                    onClick={() => setLocation('/')}
                  >
                    Study this now <ArrowRight className="w-5 h-5" />
                  </Button>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-chart-2/20 text-chart-2 rounded-full flex items-center justify-center mb-6">
                    <Trophy className="w-10 h-10" />
                  </div>
                  <h3 className="text-3xl font-bold mb-4">You've mastered all topics!</h3>
                  <p className="text-lg text-muted-foreground mb-8">
                    Incredible work. You've built a solid foundation in data structures and algorithms.
                  </p>
                  <Button 
                    variant="outline"
                    size="lg" 
                    onClick={() => setLocation('/')}
                  >
                    Back to studying
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Mastered topics quick view */}
        {masteredTopics.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Mastered ({masteredTopics.length}/{topics.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {masteredTopics.map(topic => (
                <div key={topic.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-chart-1/10 text-chart-1 text-sm font-medium border border-chart-1/20">
                  <CheckCircle2 className="w-4 h-4" />
                  {topic.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 1: MasteryBar list */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">All Topics</h2>
          <div className="grid gap-3">
            {sortedTopics.map(topic => {
              const percentage = Math.round(topic.mastery * 100);
              const isMastered = topic.mastery >= 0.7;
              
              let statusColor = "bg-primary";
              let indicatorColor = "bg-primary";
              
              if (!topic.is_unlocked) {
                indicatorColor = "bg-muted-foreground/30";
              } else if (isMastered) {
                indicatorColor = "bg-chart-1";
              } else if (topic.mastery > 0) {
                indicatorColor = "bg-chart-2";
              }

              return (
                <Card 
                  key={topic.id} 
                  className={cn(
                    "border transition-all",
                    !topic.is_unlocked && "bg-muted/30 opacity-75 grayscale-[0.5]"
                  )}
                >
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                        isMastered ? "bg-chart-1/20 text-chart-1" :
                        !topic.is_unlocked ? "bg-muted text-muted-foreground" :
                        "bg-primary/10 text-primary"
                      )}>
                        {isMastered ? <CheckCircle2 className="w-5 h-5" /> : 
                         !topic.is_unlocked ? <Lock className="w-5 h-5" /> : 
                         <Unlock className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{topic.label}</h4>
                        {!topic.is_unlocked && (
                          <p className="text-sm text-muted-foreground">Prerequisites not met</p>
                        )}
                        {topic.is_unlocked && !isMastered && topic.mastery > 0 && (
                          <p className="text-sm text-muted-foreground">In progress</p>
                        )}
                        {topic.is_unlocked && topic.mastery === 0 && (
                          <p className="text-sm text-muted-foreground">Not started</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 sm:w-1/3 min-w-[200px]">
                      <Progress 
                        value={percentage} 
                        className={cn("h-3", !topic.is_unlocked && "bg-muted-foreground/10")} 
                        indicatorClassName={indicatorColor}
                      />
                      <span className="text-sm font-bold w-12 text-right">
                        {percentage}%
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

      </div>
    </Layout>
  );
}
