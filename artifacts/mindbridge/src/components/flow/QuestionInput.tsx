import { useState } from "react";
import { useDiagnose } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, Send, Loader2, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  "What is an array?",
  "I don't understand binary search",
  "Explain recursion",
  "My merge sort is failing",
  "What is Big-O?",
  "I'm confused about trees",
];

export type QuestionIntent = "LEARN" | "CONFUSED";

/**
 * Classify the student's question as a learning request ("What is X?",
 * "Explain X") or a confusion/debugging request ("I don't understand X").
 * Defaults to CONFUSED so the existing diagnostic flow is unchanged when
 * the intent is ambiguous.
 */
function detectIntent(question: string): QuestionIntent {
  const q = question.toLowerCase().trim();
  const learnPatterns = [
    /^what (is|are|was|were|'s|does)\b/,
    /^explain\b/,
    /^tell me (about|what|how)\b/,
    /^define\b/,
    /^describe\b/,
    /^teach me\b/,
    /^how does\b/,
    /^how do\b/,
    /^show me\b/,
    /^can you explain\b/,
    /^can you teach\b/,
    /^i (want|need|would like) to (learn|know|understand) (about |what |how )?\w/,
  ];
  return learnPatterns.some((p) => p.test(q)) ? "LEARN" : "CONFUSED";
}

export interface DiagnoseResult {
  askedTopic: string;
  askedNodeId?: string;
  hypothesisNode: string;
  confusionType: string;
  confidence: number;
  fallback: boolean;
  intent: QuestionIntent;
}

interface QuestionInputProps {
  onDiagnosed: (result: DiagnoseResult) => void;
}

export function QuestionInput({ onDiagnosed }: QuestionInputProps) {
  const [question, setQuestion] = useState("");
  const [pendingIntent, setPendingIntent] = useState<QuestionIntent>("CONFUSED");
  const diagnose = useDiagnose();

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!question.trim() || diagnose.isPending) return;

    const intent = detectIntent(question.trim());
    setPendingIntent(intent);

    diagnose.mutate(
      { data: { question: question.trim() } },
      {
        onSuccess: (result) => {
          onDiagnosed({
            askedTopic: result.asked_topic ?? question.trim(),
            askedNodeId: result.asked_node_id ?? undefined,
            hypothesisNode: result.hypothesis_node,
            confusionType: (result as Record<string, unknown>).confusion_type as string ?? "",
            confidence: (result as Record<string, unknown>).confidence as number ?? 0.7,
            fallback: result.fallback ?? false,
            intent,
          });
        },
      },
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
          <BrainCircuit className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
          What are you stuck on?
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Describe what's confusing you, and we'll figure out exactly which concept you need to review.
        </p>
      </div>

      <Card className="border-2 border-primary/20 shadow-md">
        <CardContent className="p-2">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. I keep getting index out of bounds in my loops..."
              className="w-full pl-4 pr-16 py-4 text-lg bg-transparent border-0 focus:ring-0 focus:outline-none placeholder:text-muted-foreground/60"
              disabled={diagnose.isPending}
            />
            <Button
              type="submit"
              size="icon"
              className={cn(
                "absolute right-2 rounded-xl transition-all duration-300",
                question.trim()
                  ? "bg-primary text-primary-foreground opacity-100 scale-100"
                  : "opacity-0 scale-95 pointer-events-none",
              )}
              disabled={diagnose.isPending || !question.trim()}
            >
              {diagnose.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {diagnose.isPending && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground animate-in fade-in duration-300">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
            <Loader2 className="w-10 h-10 animate-spin text-primary relative z-10" />
          </div>
          <p className="mt-4 font-medium">
            {pendingIntent === "LEARN" ? "Preparing your lesson…" : "Diagnosing your question…"}
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            {pendingIntent === "LEARN" ? "Finding the right starting point" : "Identifying the root concept"}
          </p>
        </div>
      )}

      {!diagnose.isPending && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground px-1">
            <Lightbulb className="w-4 h-4" />
            <span>Try asking:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                onClick={() => setQuestion(example)}
                className="px-4 py-2.5 rounded-full text-sm font-medium bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200 border border-border"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
