import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export type FlowStepId = "DIAGNOSIS" | "LEARN" | "PRACTICE" | "QUIZ" | "SUCCESS";

const STEPS: { id: FlowStepId; label: string }[] = [
  { id: "DIAGNOSIS", label: "Diagnosis" },
  { id: "LEARN", label: "Learn" },
  { id: "PRACTICE", label: "Practice" },
  { id: "QUIZ", label: "Quiz" },
  { id: "SUCCESS", label: "Mastered" },
];

interface FlowProgressProps {
  currentStep: FlowStepId;
}

export function FlowProgress({ currentStep }: FlowProgressProps) {
  const currentIdx = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="w-full mb-10">
      <div className="flex items-center justify-center gap-0">
        {STEPS.map((step, idx) => {
          const isDone = idx < currentIdx;
          const isCurrent = idx === currentIdx;

          return (
            <div key={step.id} className="flex items-center">
              {/* Node */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                    isDone && "bg-chart-1 text-white",
                    isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    !isDone && !isCurrent && "bg-muted text-muted-foreground",
                  )}
                >
                  {isDone ? <Check className="w-4 h-4" /> : idx + 1}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium hidden sm:block transition-colors",
                    isCurrent && "text-primary font-semibold",
                    isDone && "text-chart-1",
                    !isDone && !isCurrent && "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div className="w-10 sm:w-16 h-0.5 mx-1 mt-[-14px] sm:mt-[-14px] transition-all duration-300"
                  style={{
                    background: idx < currentIdx
                      ? "hsl(var(--chart-1))"
                      : "hsl(var(--border))",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
