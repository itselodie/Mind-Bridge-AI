import { useState } from "react";
import { useTeach } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowRight, BookOpen, Lightbulb } from "lucide-react";

interface ExplanationProps {
  nodeId: string;
  onContinue: () => void;
}

export function Explanation({ nodeId, onContinue }: ExplanationProps) {
  const [isStarting, setIsStarting] = useState(false);
  
  const teachQuery = useTeach({
    mutation: {
      onSuccess: () => {
        setIsStarting(false);
      }
    }
  });

  // Start query on mount
  if (!teachQuery.data && !teachQuery.isPending && !isStarting) {
    setIsStarting(true);
    teachQuery.mutate({ data: { node_id: nodeId } });
  }

  if (teachQuery.isPending || isStarting) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="mt-4 font-medium">Generating explanation...</p>
      </div>
    );
  }

  if (teachQuery.isError || !teachQuery.data) {
    return (
      <div className="text-center py-12 text-destructive">
        <p>Failed to load explanation.</p>
        <Button onClick={() => teachQuery.mutate({ data: { node_id: nodeId } })} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const { label, explanation, analogy } = teachQuery.data;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
      <div className="space-y-2 text-center">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground mb-2">
          Here's the gap we found
        </h2>
        <div className="inline-flex items-center gap-3">
          <h1 className="text-3xl md:text-4xl font-semibold text-foreground">
            {label}
          </h1>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="border-2 shadow-sm overflow-hidden">
          <div className="bg-primary/5 px-6 py-4 border-b flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-primary">Explanation</h3>
          </div>
          <CardContent className="p-6 md:p-8">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p className="text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap">
                {explanation}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-accent shadow-sm overflow-hidden bg-accent/20">
          <div className="bg-accent/40 px-6 py-4 border-b border-accent/20 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-accent-foreground" />
            <h3 className="font-semibold text-accent-foreground">Analogy</h3>
          </div>
          <CardContent className="p-6 md:p-8">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p className="text-lg leading-relaxed text-foreground/90 italic">
                {analogy}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center pt-4">
        <Button size="lg" onClick={onContinue} className="gap-2 px-10 rounded-full shadow-md">
          Test yourself <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
