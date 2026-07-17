import { useState } from "react";
import { useValidate } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ValidationCheckProps {
  nodeId: string;
  onContinue: () => void;
}

export function ValidationCheck({ nodeId, onContinue }: ValidationCheckProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  
  const validateQuery = useValidate({
    mutation: {
      onSuccess: () => {
        setIsStarting(false);
      }
    }
  });

  // Start query on mount if not already done
  if (!validateQuery.data && !validateQuery.isPending && !isStarting) {
    setIsStarting(true);
    validateQuery.mutate({ data: { node_id: nodeId } });
  }

  if (validateQuery.isPending || isStarting) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="mt-4 font-medium">Preparing a quick check...</p>
      </div>
    );
  }

  if (validateQuery.isError || !validateQuery.data) {
    return (
      <div className="text-center py-12 text-destructive">
        <p>Failed to load validation question.</p>
        <Button onClick={() => validateQuery.mutate({ data: { node_id: nodeId } })} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const { prompt, options, correct, label } = validateQuery.data;
  
  const handleSelect = (option: string) => {
    if (isRevealed) return;
    setSelectedOption(option);
    setIsRevealed(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      <div className="space-y-2 text-center">
        <div className="inline-block px-3 py-1 rounded-full bg-accent text-accent-foreground text-sm font-semibold tracking-wide uppercase mb-2">
          {label}
        </div>
        <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
          Let's check your understanding
        </h2>
        <p className="text-muted-foreground">
          Answer this quick question to see if we've found the right gap.
        </p>
      </div>

      <Card className="border-2 shadow-sm overflow-hidden">
        <div className="bg-secondary/50 p-6 border-b">
          <p className="text-lg font-medium leading-relaxed">{prompt}</p>
        </div>
        <CardContent className="p-6">
          <div className="space-y-3">
            {options.map((option, idx) => {
              const isSelected = selectedOption === option;
              const isCorrect = option === correct;
              
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
                  stateClass = "border-border opacity-50";
                }
              } else if (isSelected) {
                stateClass = "border-primary bg-primary/5 text-primary ring-1 ring-primary";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(option)}
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
          <Button size="lg" onClick={onContinue} className="gap-2 px-8">
            Continue to explanation <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
