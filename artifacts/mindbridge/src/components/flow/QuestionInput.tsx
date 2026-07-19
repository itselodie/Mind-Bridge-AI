import { useState } from "react";
import { useDiagnose } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, Send, Loader2, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  "What is an array?",
  "Explain linked lists",
  "What is a hash table?",
  "I don't understand binary search",
  "Explain recursion",
  "What is Big-O?",
  "Tell me about graphs",
  "I'm confused about trees",
];

// ─── Intent detection ─────────────────────────────────────────────────────────

export type QuestionIntent = "LEARN" | "CONFUSED";

const LEARN_PATTERNS = [
  /^what (?:is|are|was|were|'s|does)\b/,
  /^explain\b/,
  /^tell me (?:about|what|how)\b/,
  /^define\b/,
  /^describe\b/,
  /^teach me\b/,
  /^how does\b/,
  /^how do\b/,
  /^show me\b/,
  /^can you explain\b/,
  /^can you teach\b/,
  /^i (?:want|need|would like) to (?:learn|know|understand) (?:about |what |how )?\w/,
];

function detectIntent(question: string): QuestionIntent {
  const q = question.toLowerCase().trim();
  return LEARN_PATTERNS.some((p) => p.test(q)) ? "LEARN" : "CONFUSED";
}

// ─── Topic extraction ─────────────────────────────────────────────────────────

/**
 * Strip the question verb/prefix and return the bare topic noun.
 * e.g. "What is an array?" → "array"
 *      "Teach me stacks"   → "stacks"
 */
function extractTopic(question: string): string {
  const q = question.trim().replace(/[?!.]+$/, "");
  const patterns: RegExp[] = [
    /^what (?:is|are|was|were|'s|does) (?:a |an |the )?(.+)$/i,
    /^explain (?:a |an |the )?(.+)$/i,
    /^tell me about (?:a |an |the )?(.+)$/i,
    /^define (?:a |an |the )?(.+)$/i,
    /^describe (?:a |an |the )?(.+)$/i,
    /^teach me (?:about )?(?:a |an |the )?(.+)$/i,
    /^how does (?:a |an |the )?(.+?)(?: work)?$/i,
    /^how do (?:a |an |the )?(.+?)(?: work)?$/i,
    /^show me (?:a |an |the )?(.+)$/i,
    /^can you explain (?:a |an |the )?(.+)$/i,
    /^can you teach me (?:about )?(?:a |an |the )?(.+)$/i,
    /^i (?:want|need|would like) to (?:learn|know|understand) (?:about |what |how )?(?:a |an |the )?(.+)$/i,
  ];
  for (const p of patterns) {
    const m = q.match(p);
    if (m) return m[1].trim();
  }
  return q;
}

// ─── Node resolution ──────────────────────────────────────────────────────────

/**
 * Map a free-text topic string to a graph node ID without hitting the API.
 * Returns null when the topic is not in the local graph (caller falls back to /diagnose).
 */
const TOPIC_ALIASES: Record<string, string> = {
  // algorithms (meta concept)
  "algorithm": "algorithms_intro",
  "algorithms": "algorithms_intro",
  "algo": "algorithms_intro",
  // data structures (broad intro topic)
  "data structure": "data_structures",
  "data structures": "data_structures",
  "data struct": "data_structures",
  "ds": "data_structures",
  // variables
  "variable": "variables_and_data_types",
  "variables": "variables_and_data_types",
  "data type": "variables_and_data_types",
  "data types": "variables_and_data_types",
  "variables and data types": "variables_and_data_types",
  "variable and data type": "variables_and_data_types",
  // arrays
  "array": "arrays",
  "arrays": "arrays",
  // linked lists
  "linked list": "linked_lists",
  "linked lists": "linked_lists",
  "singly linked list": "linked_lists",
  "doubly linked list": "linked_lists",
  "linked node": "linked_lists",
  // loops
  "loop": "loops",
  "loops": "loops",
  "for loop": "loops",
  "while loop": "loops",
  "iteration": "loops",
  // stacks
  "stack": "stacks",
  "stacks": "stacks",
  "lifo": "stacks",
  // queues
  "queue": "queues",
  "queues": "queues",
  "fifo": "queues",
  "deque": "queues",
  // hash tables
  "hash table": "hash_tables",
  "hash tables": "hash_tables",
  "hash map": "hash_tables",
  "hashmap": "hash_tables",
  "hashtable": "hash_tables",
  "dictionary": "hash_tables",
  "dict": "hash_tables",
  "map": "hash_tables",
  "hash": "hash_tables",
  "associative array": "hash_tables",
  // linear search
  "linear search": "linear_search",
  "sequential search": "linear_search",
  // sorted arrays
  "sorted array": "sorted_arrays",
  "sorted arrays": "sorted_arrays",
  "sorting an array": "sorted_arrays",
  // binary search
  "binary search": "binary_search",
  // big-o
  "big o": "big_o_time_complexity",
  "big-o": "big_o_time_complexity",
  "big o notation": "big_o_time_complexity",
  "time complexity": "big_o_time_complexity",
  "space complexity": "big_o_time_complexity",
  "complexity": "big_o_time_complexity",
  "algorithmic complexity": "big_o_time_complexity",
  "asymptotic notation": "big_o_time_complexity",
  // divide and conquer
  "divide and conquer": "divide_and_conquer",
  "divide & conquer": "divide_and_conquer",
  // basic sorting
  "sorting": "basic_sorting",
  "basic sorting": "basic_sorting",
  "bubble sort": "basic_sorting",
  "insertion sort": "basic_sorting",
  "selection sort": "basic_sorting",
  // merge sort
  "merge sort": "merge_sort",
  "mergesort": "merge_sort",
  // recursion
  "recursion": "recursion",
  "recursive": "recursion",
  "recursive function": "recursion",
  "recursive functions": "recursion",
  // base case
  "base case": "base_case_and_recursive_case",
  "recursive case": "base_case_and_recursive_case",
  "base case and recursive case": "base_case_and_recursive_case",
  // trees
  "tree": "trees_intro",
  "trees": "trees_intro",
  "binary tree": "trees_intro",
  "binary search tree": "trees_intro",
  "bst": "trees_intro",
  // tree traversal / DFS
  "tree traversal": "tree_traversal",
  "traversal": "tree_traversal",
  "inorder": "tree_traversal",
  "preorder": "tree_traversal",
  "postorder": "tree_traversal",
  "depth first search": "tree_traversal",
  "depth-first search": "tree_traversal",
  "dfs": "tree_traversal",
  // graphs / BFS
  "graph": "graphs_intro",
  "graphs": "graphs_intro",
  "graph theory": "graphs_intro",
  "directed graph": "graphs_intro",
  "undirected graph": "graphs_intro",
  "weighted graph": "graphs_intro",
  "breadth first search": "graphs_intro",
  "breadth-first search": "graphs_intro",
  "bfs": "graphs_intro",
  "adjacency list": "graphs_intro",
  "adjacency matrix": "graphs_intro",
};

function resolveNodeId(topic: string): string | null {
  const t = topic.toLowerCase().trim();

  // Exact match first
  if (TOPIC_ALIASES[t]) return TOPIC_ALIASES[t];

  // Partial containment match (longest alias wins to avoid "sort" matching "merge sort")
  let best: { nodeId: string; len: number } | null = null;
  for (const [alias, nodeId] of Object.entries(TOPIC_ALIASES)) {
    if (t.includes(alias) || alias.includes(t)) {
      if (!best || alias.length > best.len) {
        best = { nodeId, len: alias.length };
      }
    }
  }
  return best?.nodeId ?? null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

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
  /** Called immediately for learning requests with a resolved node — no API involved. */
  onDirectLearn: (nodeId: string, topic: string) => void;
  /** Called after /api/diagnose returns, for confusion/debugging requests. */
  onDiagnosed: (result: DiagnoseResult) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function QuestionInput({ onDirectLearn, onDiagnosed }: QuestionInputProps) {
  const [question, setQuestion] = useState("");
  const [isResolvingLocally, setIsResolvingLocally] = useState(false);
  const diagnose = useDiagnose();

  const isPending = diagnose.isPending || isResolvingLocally;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = question.trim();
    if (!q || isPending) return;

    const intent = detectIntent(q);

    if (intent === "LEARN") {
      const topic = extractTopic(q);
      const nodeId = resolveNodeId(topic);

      if (nodeId) {
        // ✅ LEARN + matched node → skip the API entirely
        setIsResolvingLocally(true);
        // Use a microtask to let the loading state render before the parent re-renders
        Promise.resolve().then(() => {
          setIsResolvingLocally(false);
          onDirectLearn(nodeId, topic);
        });
        return;
      }
      // LEARN but topic not in local graph → fall through to /diagnose as best-effort
    }

    // CONFUSED (or unrecognised LEARN topic) → call the diagnosis API
    diagnose.mutate(
      { data: { question: q } },
      {
        onSuccess: (result) => {
          onDiagnosed({
            askedTopic: result.asked_topic ?? q,
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
          Describe what's confusing you, or ask us to explain any concept.
        </p>
      </div>

      <Card className="border-2 border-primary/20 shadow-md">
        <CardContent className="p-2">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. What is an array? / I keep getting index out of bounds..."
              className="w-full pl-4 pr-16 py-4 text-lg bg-transparent border-0 focus:ring-0 focus:outline-none placeholder:text-muted-foreground/60"
              disabled={isPending}
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
              disabled={isPending || !question.trim()}
            >
              {isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isPending && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground animate-in fade-in duration-300">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
            <Loader2 className="w-10 h-10 animate-spin text-primary relative z-10" />
          </div>
          <p className="mt-4 font-medium">
            {isResolvingLocally ? "Preparing your lesson…" : "Diagnosing your question…"}
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            {isResolvingLocally ? "Finding the right starting point" : "Identifying the root concept"}
          </p>
        </div>
      )}

      {!isPending && (
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
