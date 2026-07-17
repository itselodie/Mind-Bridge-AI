import { useState } from "react";
import { useLocation } from "wouter";
import { useQuiz } from "@workspace/api-client-react";
import { useMasteryContext } from "@/context/MasteryContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Trophy, ArrowRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizPanelProps {
  nodeId: string;
  onRestart: () => void;
}

export function QuizPanel({ nodeId, onRestart }: QuizPanelProps) {
  const [, setLocation] = useLocation();
  const { updateMastery } = useMasteryContext();
  const [isStarting, setIsStarting] = useState(false);
  
  // State for quiz taking
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const quizQuery = useQuiz({
    mutation: {
      onSuccess: () => {
        setIsStarting(false);
      }
    }
  });

  // Start query on mount
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
      <div className="text-center py-12 text-destructive">
        <p>Failed to load quiz.</p>
        <Button onClick={() => quizQuery.mutate({ data: { node_id: nodeId } })} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const { quiz, label } = quizQuery.data;
  
  const handleSelect = (idx: number) => {
    if (isRevealed) return;
    setSelectedOption(idx);
    setIsRevealed(true);
    
    const isCorrect = idx === quiz[currentQuestionIdx].correct;
    if (isCorrect) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIdx < quiz.length - 1) {
      setCurrentQuestionIdx(idx => idx + 1);
      setSelectedOption(null);
      setIsRevealed(false);
    } else {
      // Finish quiz
      const finalScore = score + (selectedOption === quiz[currentQuestionIdx].correct ? 1 : 0);
      const masteryRatio = finalScore / quiz.length;
      updateMastery(nodeId, masteryRatio);
      setIsCompleted(true);
    }
  };

  if (isCompleted) {
    const ratio = score / quiz.length;
    const isMastered = ratio >= 0.7;
    
    return (
      <div className="text-center space-y-8 animate-in zoom-in-95 duration-500 max-w-lg mx-auto py-10">
        <div className={cn(
          "inline-flex items-center justify-center p-6 rounded-full",
          isMastered ? "bg-chart-1/20 text-chart-1" : "bg-chart-2/20 text-chart-2"
        )}>
          <Trophy className="w-16 h-16" />
        </div>
        
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">
            {isMastered ? "Great job!" : "Good effort!"}
          </h2>
          <p className="text-xl text-muted-foreground">
            You got <span className="font-bold text-foreground">{score}/{quiz.length}</span> correct
          </p>
          <div className="inline-block px-4 py-2 bg-secondary rounded-lg font-medium text-sm">
            {label} mastery updated
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Button variant="outline" size="lg" onClick={onRestart} className="gap-2">
            <RotateCcw className="w-4 h-4" /> Study another topic
          </Button>
          <Button size="lg" onClick={() => setLocation('/dashboard')} className="gap-2">
            View my progress <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  const currentQ = quiz[currentQuestionIdx];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          {label} — Question {currentQuestionIdx + 1} of {quiz.length}
        </div>
        <div className="text-sm font-medium">
          Score: {score}
        </div>
      </div>

      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${(currentQuestionIdx / quiz.length) * 100}%` }}
        />
      </div>

      <Card className="border-2 shadow-sm overflow-hidden">
        <div className="bg-secondary/30 p-6 md:p-8 border-b">
          <p className="text-xl font-medium leading-relaxed">{currentQ.q}</p>
        </div>
        <CardContent className="p-6 md:p-8">
          <div className="space-y-3">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentQ.correct;
              
              let stateClass = "border-border hover:border-primary hover:bg-secondary/50";
              let Icon = null;
              
              if (isRevealed) {
                if (isCorrect) {
                  stateClass = "border-chart-1 bg-chart-1/10 text-chart-1";
                  Icon = CheckCircle2;
                } else if (isSelected && !isCorrect) {
                  stateClass = "border-destructive bg-destructive/10 text-destructive";
                  Icon = XCircle;
                } else {
                  stateClass = "border-border opacity-40";
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
                    stateClass
                  )}
                >
                  <span className={cn("font-medium", isRevealed && isCorrect && "text-chart-1 font-semibold")}>
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
          <Button size="lg" onClick={handleNext} className="gap-2 px-8">
            {currentQuestionIdx < quiz.length - 1 ? "Next Question" : "Finish Quiz"} <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
