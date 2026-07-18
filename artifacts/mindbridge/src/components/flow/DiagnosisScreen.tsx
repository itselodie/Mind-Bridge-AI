import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, BookOpen, ArrowRight, RotateCcw, AlertCircle, Sparkles } from "lucide-react";
import { NODE_LABELS } from "@/lib/nodes";

interface DiagnosisScreenProps {
  askedTopic: string;
  hypothesisNode: string;
  confusionType: string;
  fallback: boolean;
  onStartLearning: () => void;
  onRestart: () => void;
}

export function DiagnosisScreen({
  askedTopic,
  hypothesisNode,
  confusionType,
  fallback,
  onStartLearning,
  onRestart,
}: DiagnosisScreenProps) {
  const nodeLabel = NODE_LABELS[hypothesisNode] ?? hypothesisNode;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-xl mx-auto space-y-6">

      {/* Fallback banner */}
      {fallback && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary border text-sm text-muted-foreground">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          AI is currently busy — defaulting to a standard starting point.
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-3 pt-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold">
          <Brain className="w-4 h-4" />
          MindBridge Diagnosis Complete
        </div>
        <p className="text-muted-foreground text-base leading-relaxed">
          {fallback ? (
            "We'll start with a solid foundation."
          ) : (
            <>
              Good news!{" "}
              <span className="font-semibold text-foreground">{askedTopic}</span>{" "}
              isn't actually the problem.
            </>
          )}
        </p>
      </div>

      {/* Diagnosed concept card */}
      <Card className="border-2 border-primary/30 shadow-md bg-gradient-to-br from-card to-primary/5 overflow-hidden">
        <CardContent className="p-8 text-center space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            The concept you're missing
          </p>
          <div className="flex items-center justify-center gap-3">
            <BookOpen className="w-7 h-7 text-primary flex-shrink-0" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              {nodeLabel}
            </h2>
          </div>
          {!fallback && confusionType && (
            <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
              {confusionType}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Why explanation */}
      <Card className="border border-accent bg-accent/30">
        <CardContent className="p-6 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-accent-foreground">
            <Sparkles className="w-4 h-4" />
            Why this matters
          </div>
          <p className="text-foreground/80 leading-relaxed">
            {getWhyText(hypothesisNode, askedTopic)}
          </p>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="space-y-3 pt-2">
        <Button
          size="lg"
          className="w-full text-lg py-6 rounded-2xl shadow-lg gap-2 font-semibold"
          onClick={onStartLearning}
        >
          Start Learning <ArrowRight className="w-5 h-5" />
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Takes about 2 minutes. Quiz included.
        </p>
      </div>

      <div className="flex justify-center pt-2">
        <Button variant="ghost" size="sm" onClick={onRestart} className="text-muted-foreground gap-2">
          <RotateCcw className="w-3.5 h-3.5" />
          My question was different
        </Button>
      </div>
    </div>
  );
}

/** Construct a "why" sentence from the diagnosed node and asked topic */
function getWhyText(hypothesisNode: string, askedTopic: string): string {
  const WHY: Record<string, string> = {
    sorted_arrays:
      "Binary search relies on sorted order to eliminate half the search space at each step. Without sorted data, you can't safely skip elements — so the algorithm breaks down completely.",
    divide_and_conquer:
      "Binary search is a divide-and-conquer algorithm at its core. Understanding how to split a problem in half and solve each part independently is the real insight behind it.",
    arrays:
      "Before tackling search or sort algorithms, you need a solid grip on how arrays store data and how index-based access works — every other algorithm builds on this.",
    loops:
      "Loops are the engine behind most algorithms. Understanding iteration — how to visit each element and when to stop — is foundational before moving to more complex patterns.",
    recursion:
      "Recursion is how many elegant algorithms (including tree traversal and merge sort) are written. Grasping how a function calls itself on a smaller version of the problem unlocks a whole class of solutions.",
    base_case_and_recursive_case:
      "A recursive function without a proper base case runs forever. This is the single most common source of stack overflows — understanding why the base case is non-negotiable is essential.",
    big_o_time_complexity:
      "Algorithm analysis answers the question 'how much slower does this get as data grows?' Without this, you can't judge whether your solution is fast enough — or why binary search beats linear search.",
    variables_and_data_types:
      "Every data structure stores typed values. Knowing what types you're working with — numbers, strings, booleans — determines which operations are valid and what mistakes to watch for.",
    linear_search:
      "Linear search is the baseline: check every element in order. Understanding why it's O(n) — and when it's the only option — makes it clear why sorted data and binary search are worth the effort.",
    stacks:
      "Stacks power function calls, undo operations, and parsing. Understanding Last-In-First-Out order is essential before you can understand the call stack that makes recursion work.",
    trees_intro:
      "Tree traversal requires understanding the tree structure first: what a node is, what parent/child relationships mean, and how a binary tree is different from a list.",
    basic_sorting:
      "Merge sort is built on simpler sorting intuition. Seeing how bubble sort works — and why it's slow — makes the divide-and-conquer speedup of merge sort concrete and meaningful.",
  };

  return (
    WHY[hypothesisNode] ??
    `Mastering ${NODE_LABELS[hypothesisNode] ?? hypothesisNode} will build the foundation you need to confidently understand ${askedTopic}. Let's cover it properly before moving on.`
  );
}
