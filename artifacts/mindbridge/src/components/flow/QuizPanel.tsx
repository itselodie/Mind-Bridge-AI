import { useState } from "react";
import { useQuiz } from "@workspace/api-client-react";
import { useMasteryContext } from "@/context/MasteryContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, ArrowRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizPanelProps {
  nodeId: string;
  onComplete: (score: number, total: number) => void;
}

export function QuizPanel({ nodeId, onComplete }: QuizPanelProps) {
  const { updateMastery } = useMasteryContext();
  const [isStarting, setIsStarting] = useState(false);

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [score, setScore] = useState(0);

  const quizQuery = useQuiz({
    mutation: {
      onSuccess: () => setIsStarting(false),
    },
  });

  // Fire on mount
  if (!quizQuery.data && !quizQuery.isPending && !isStarting) {
    setIsStarting(true);
    quizQuery.mutate({ data: { node_id: nodeId } });
  }

  if (quizQuery.isPending || isStarting) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="mt-4 font-medium">Preparing your quiz...</p>
      </div>
    );
  }

  if (quizQuery.isError || !quizQuery.data) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="inline-flex items-center gap-2 text-destructive">
          <AlertCircle className="w-5 h-5" />
          <p>Failed to load quiz.</p>
        </div>
        <Button onClick={() => quizQuery.mutate({ data: { node_id: nodeId } })}>
          Retry
        </Button>
      </div>
    );
  }

  const { quiz, label } = quizQuery.data;
  const currentQ = quiz[currentQuestionIdx];
  const progressPct = (currentQuestionIdx / quiz.length) * 100;

  const handleSelect = (idx: number) => {
    if (isRevealed) return;
    setSelectedOption(idx);
    setIsRevealed(true);
    if (idx === currentQ.correct) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIdx < quiz.length - 1) {
      setCurrentQuestionIdx((i) => i + 1);
      setSelectedOption(null);
      setIsRevealed(false);
    } else {
      // Last question — compute final score including current answer
      const isLastCorrect = selectedOption === currentQ.correct;
      const finalScore = score + (isLastCorrect ? 0 : 0); // already counted in handleSelect
      const masteryRatio = score / quiz.length;
      updateMastery(nodeId, masteryRatio);
      onComplete(score, quiz.length);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl mx-auto">

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-muted-foreground uppercase tracking-wide">
            {label} — Question {currentQuestionIdx + 1} of {quiz.length}
          </span>
          <span className="font-bold text-foreground">
            {score} correct
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <Card className="border-2 shadow-sm overflow-hidden">
        <div className="bg-secondary/30 p-6 md:p-8 border-b">
          <p className="text-xl font-medium leading-relaxed">{currentQ.q}</p>
        </div>
        <CardContent className="p-6 md:p-8">
          <div className="space-y-3">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrectOpt = idx === currentQ.correct;

              let stateClass =
                "border-border hover:border-primary hover:bg-secondary/50 cursor-pointer";
              let Icon = null;

              if (isRevealed) {
                if (isCorrectOpt) {
                  stateClass = "border-chart-1 bg-chart-1/10 text-chart-1";
                  Icon = CheckCircle2;
                } else if (isSelected && !isCorrectOpt) {
                  stateClass = "border-destructive bg-destructive/10 text-destructive";
                  Icon = XCircle;
                } else {
                  stateClass = "border-border opacity-40 cursor-default";
                }
              } else if (isSelected) {
                stateClass = "border-primary bg-primary/5 text-primary ring-1 ring-primary";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  disabled={isRevealed}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between",
                    stateClass,
                    isRevealed && "cursor-default",
                  )}
                >
                  <span className={cn("font-medium", isRevealed && isCorrectOpt && "font-semibold")}>
                    {option}
                  </span>
                  {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {isRevealed && (
        <div className="flex justify-end animate-in fade-in duration-300 slide-in-from-bottom-2">
          <Button size="lg" onClick={handleNext} className="gap-2 px-8 rounded-xl">
            {currentQuestionIdx < quiz.length - 1 ? "Next Question" : "Finish Quiz"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
