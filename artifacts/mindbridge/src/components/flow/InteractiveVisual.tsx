import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface InteractiveVisualProps {
  nodeId: string;
}

export function InteractiveVisual({ nodeId }: InteractiveVisualProps) {
  const visual = getVisual(nodeId);
  if (!visual) return null;

  return (
    <div className="rounded-2xl border-2 border-border bg-secondary/30 overflow-hidden">
      <div className="px-5 py-3 border-b bg-secondary/50 flex items-center gap-2">
        <span className="text-sm font-semibold text-foreground">Interactive Example</span>
        <span className="text-xs text-muted-foreground ml-1">— step through it</span>
      </div>
      <div className="p-6">{visual}</div>
    </div>
  );
}

/* ─── Sorted Arrays / Binary Search ─────────────────────────────────────── */

function SortedArraysVisual() {
  const UNSORTED = [8, 2, 9, 1, 5];
  const SORTED = [1, 2, 5, 8, 9];
  const TARGET = 8;

  const steps = [
    { phase: "unsorted" as const, msg: "Unsorted array — Binary Search cannot be applied." },
    { phase: "sorted" as const, msg: "Sorted array — Binary Search can now run." },
    { phase: "mid" as const, msg: "Step 1: Middle element is 5. Target 8 > 5 → search right half only." },
    { phase: "found" as const, msg: "Step 2: Middle of right half is 8. Target found! ✓ Only 2 steps." },
  ];

  const [step, setStep] = useState(0);
  const s = steps[step];

  const midIdx = 2; // index of 5 in SORTED
  const foundIdx = 3; // index of 8 in SORTED

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {/* Unsorted row */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground w-16">Unsorted</span>
            {s.phase !== "unsorted" && (
              <span className="text-xs text-destructive font-semibold">❌ Binary Search fails</span>
            )}
          </div>
          <div className="flex gap-2">
            {UNSORTED.map((n, i) => (
              <div
                key={i}
                className={cn(
                  "w-12 h-12 rounded-xl border-2 flex items-center justify-center font-bold text-lg transition-all duration-300",
                  s.phase === "unsorted"
                    ? "border-destructive bg-destructive/10 text-destructive"
                    : "border-border bg-muted text-muted-foreground opacity-40",
                )}
              >
                {n}
              </div>
            ))}
          </div>
        </div>

        {/* Sorted row */}
        {step >= 1 && (
          <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-400">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground w-16">Sorted</span>
              <span className="text-xs text-chart-1 font-semibold">✓ Binary Search works</span>
            </div>
            <div className="flex gap-2">
              {SORTED.map((n, i) => {
                let cls =
                  "border-chart-1 bg-chart-1/10 text-chart-1";
                if (step === 2 && i === midIdx)
                  cls = "border-primary bg-primary text-primary-foreground ring-4 ring-primary/30 scale-110";
                else if (step === 3 && i === foundIdx)
                  cls = "border-chart-2 bg-chart-2 text-white ring-4 ring-chart-2/30 scale-110";
                else if (step === 3 && (i === 0 || i === 1 || i === 2))
                  cls = "border-border bg-muted text-muted-foreground opacity-30";
                else if (step >= 2 && i < midIdx)
                  cls = "border-border bg-muted text-muted-foreground opacity-30";

                return (
                  <div
                    key={i}
                    className={cn(
                      "w-12 h-12 rounded-xl border-2 flex items-center justify-center font-bold text-lg transition-all duration-300",
                      cls,
                    )}
                  >
                    {n}
                  </div>
                );
              })}
            </div>
            {step === 2 && (
              <div className="flex gap-2 mt-1">
                {SORTED.map((_, i) => (
                  <div key={i} className="w-12 flex justify-center">
                    {i === midIdx && (
                      <span className="text-xs text-primary font-bold">mid</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Message */}
      <p className="text-sm font-medium text-foreground/80 min-h-[2rem]">{s.msg}</p>

      {/* Controls */}
      <StepControls step={step} total={steps.length} onStep={setStep} />
    </div>
  );
}

/* ─── Recursion / Factorial ──────────────────────────────────────────────── */

function RecursionVisual() {
  const frames = [
    { call: "factorial(4)", note: "calls factorial(3)...", phase: "down" as const },
    { call: "factorial(3)", note: "calls factorial(2)...", phase: "down" as const },
    { call: "factorial(2)", note: "calls factorial(1)...", phase: "down" as const },
    { call: "factorial(1)", note: "BASE CASE → returns 1", phase: "base" as const },
    { call: "factorial(2)", note: "returns 2 × 1 = 2", phase: "up" as const },
    { call: "factorial(3)", note: "returns 3 × 2 = 6", phase: "up" as const },
    { call: "factorial(4)", note: "returns 4 × 6 = 24 ✓", phase: "up" as const },
  ];

  const [step, setStep] = useState(0);
  const visible = frames.slice(0, Math.min(step + 1, 4)); // descending calls
  const returning = step > 3 ? frames.slice(step) : [];

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Call Stack</p>

      {/* Stack frames */}
      <div className="space-y-1.5">
        {visible.map((f, i) => (
          <div
            key={i}
            className={cn(
              "px-4 py-2.5 rounded-xl border-2 text-sm font-mono transition-all duration-300 animate-in slide-in-from-top-2",
              i === visible.length - 1 && step <= 3
                ? "border-primary bg-primary/10 text-primary font-semibold"
                : step > 3 && i === visible.length - 1
                ? "border-chart-1 bg-chart-1/10 text-chart-1 font-semibold"
                : "border-border bg-card text-foreground/70",
              f.phase === "base" && i === visible.length - 1 && "border-chart-2 bg-chart-2/10 text-chart-2",
            )}
          >
            <span className="font-bold">{f.call}</span>
            {i === visible.length - 1 && (
              <span className="ml-3 text-xs opacity-80">{f.note}</span>
            )}
          </div>
        ))}
      </div>

      {/* Return values coming back up */}
      {step > 3 && (
        <div className="mt-3 space-y-1.5 animate-in fade-in duration-300">
          <p className="text-xs font-semibold uppercase tracking-wider text-chart-1">Returning ↑</p>
          {frames.slice(4, step + 1).map((f, i) => (
            <div
              key={i}
              className="px-4 py-2 rounded-xl border-2 border-chart-1 bg-chart-1/10 text-chart-1 text-sm font-mono animate-in slide-in-from-bottom-2"
            >
              {f.call} — {f.note}
            </div>
          ))}
        </div>
      )}

      <StepControls step={step} total={frames.length} onStep={setStep} />
    </div>
  );
}

/* ─── Linear Search ─────────────────────────────────────────────────────── */

function LinearSearchVisual() {
  const arr = [8, 2, 9, 1, 5];
  const target = 9;
  const [step, setStep] = useState(0);
  const found = step > 0 && arr[step - 1] === target;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm">
        <span className="font-semibold text-muted-foreground">Target:</span>
        <span className="px-3 py-1 rounded-lg bg-primary text-primary-foreground font-bold">{target}</span>
      </div>

      <div className="flex gap-2">
        {arr.map((n, i) => {
          const isChecked = i < step;
          const isCurrent = i === step - 1;
          const isMatch = isCurrent && n === target;

          return (
            <div
              key={i}
              className={cn(
                "w-12 h-12 rounded-xl border-2 flex items-center justify-center font-bold text-lg transition-all duration-300",
                isMatch
                  ? "border-chart-1 bg-chart-1 text-white ring-4 ring-chart-1/30 scale-110"
                  : isCurrent
                  ? "border-destructive bg-destructive/10 text-destructive scale-105"
                  : isChecked
                  ? "border-border bg-muted/50 text-muted-foreground opacity-40"
                  : "border-border bg-card text-foreground",
              )}
            >
              {n}
            </div>
          );
        })}
      </div>

      <p className="text-sm font-medium text-foreground/80">
        {step === 0
          ? "Click Next Step to start scanning from index 0."
          : found
          ? `✓ Found ${target} at index ${step - 1}. Checked ${step} element${step > 1 ? "s" : ""}.`
          : `Checked index ${step - 1}: ${arr[step - 1]} ≠ ${target}. Keep scanning...`}
      </p>

      <StepControls step={step} total={arr.length + 1} onStep={setStep} />
    </div>
  );
}

/* ─── Big-O Comparison ──────────────────────────────────────────────────── */

function BigOVisual() {
  const N = 16;
  const complexities = [
    { label: "O(1)", steps: 1, color: "bg-chart-1" },
    { label: "O(log n)", steps: Math.ceil(Math.log2(N)), color: "bg-primary" },
    { label: "O(n)", steps: N, color: "bg-chart-2" },
    { label: "O(n²)", steps: Math.min(N * N, 256), color: "bg-destructive" },
  ];
  const [shown, setShown] = useState(0);
  const maxSteps = complexities[complexities.length - 1].steps;

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground font-medium">n = {N} elements</p>
      <div className="space-y-3">
        {complexities.slice(0, shown + 1).map((c, i) => (
          <div key={c.label} className="space-y-1 animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="flex justify-between text-sm">
              <span className="font-mono font-bold">{c.label}</span>
              <span className="text-muted-foreground">{c.steps} steps</span>
            </div>
            <div className="h-5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-700", c.color)}
                style={{ width: `${(c.steps / maxSteps) * 100}%`, minWidth: "6px" }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="text-sm font-medium text-foreground/80">
        {shown === 0
          ? "O(1) is constant — always 1 operation no matter how large n gets."
          : shown === 1
          ? "O(log n) grows slowly. For n=16, only 4 steps needed (binary search)."
          : shown === 2
          ? "O(n) scales linearly — one step per element."
          : "O(n²) explodes fast. 16 elements → 256 operations. 1000 elements → 1,000,000 operations."}
      </p>

      <StepControls step={shown} total={complexities.length} onStep={setShown} />
    </div>
  );
}

/* ─── Stacks ─────────────────────────────────────────────────────────────── */

function StacksVisual() {
  const steps = [
    { items: [], msg: "Empty stack — ready to push items." },
    { items: ["A"], msg: 'push("A") → A goes on top.' },
    { items: ["A", "B"], msg: 'push("B") → B on top of A.' },
    { items: ["A", "B", "C"], msg: 'push("C") → C on top. Stack has 3 items.' },
    { items: ["A", "B"], msg: 'pop() → removes C (the LAST one pushed). LIFO!' },
    { items: ["A"], msg: 'pop() → removes B. Only A remains.' },
  ];
  const [step, setStep] = useState(0);
  const { items, msg } = steps[step];

  return (
    <div className="space-y-4">
      <div className="flex gap-6 items-end min-h-[140px]">
        {/* Stack visualization (bottom to top) */}
        <div className="flex flex-col-reverse gap-1.5 min-w-[80px]">
          {items.map((item, i) => (
            <div
              key={i}
              className={cn(
                "px-5 py-3 rounded-xl border-2 font-bold text-center transition-all duration-300 animate-in fade-in zoom-in-90",
                i === items.length - 1
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground",
              )}
            >
              {item}
            </div>
          ))}
          {items.length === 0 && (
            <div className="px-5 py-3 rounded-xl border-2 border-dashed border-muted-foreground/30 text-muted-foreground text-center text-sm">
              empty
            </div>
          )}
        </div>

        {/* Labels */}
        <div className="text-xs text-muted-foreground space-y-1">
          {items.length > 0 && (
            <div className="font-semibold text-primary">← TOP</div>
          )}
          {items.length > 1 && <div className="text-muted-foreground/60">← bottom</div>}
        </div>
      </div>

      <p className="text-sm font-medium text-foreground/80">{msg}</p>
      <StepControls step={step} total={steps.length} onStep={setStep} />
    </div>
  );
}

/* ─── Arrays / Index Access ──────────────────────────────────────────────── */

function ArraysVisual() {
  const items = ["🍎", "🍌", "🍒", "🥝", "🍓"];
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const highlights = [null, 0, 2, 4];
  const highlightStep = highlights[Math.min(step, highlights.length - 1)];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex gap-2">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(activeIdx === i ? null : i)}
              className={cn(
                "w-14 h-14 rounded-xl border-2 text-2xl flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-105",
                (activeIdx === i || highlightStep === i)
                  ? "border-primary bg-primary/10 ring-4 ring-primary/20 scale-110"
                  : "border-border bg-card",
              )}
            >
              {item}
            </button>
          ))}
        </div>
        {/* Index labels */}
        <div className="flex gap-2">
          {items.map((_, i) => (
            <div key={i} className="w-14 text-center text-xs text-muted-foreground font-mono font-bold">
              [{i}]
            </div>
          ))}
        </div>
      </div>

      <p className="text-sm font-medium text-foreground/80">
        {activeIdx !== null
          ? `fruits[${activeIdx}] = "${items[activeIdx]}" — O(1) access, instant regardless of array size.`
          : step === 0
          ? "Each item lives at a numbered index, starting at 0. Click any element or step through."
          : step === 1
          ? `fruits[0] = "${items[0]}" — the first element. Indexes always start at 0, not 1.`
          : step === 2
          ? `fruits[2] = "${items[2]}" — the third element. Index 2, not 3.`
          : `fruits[4] = "${items[4]}" — the last element. fruits.length is 5, last index is 4.`}
      </p>

      <StepControls step={step} total={highlights.length} onStep={setStep} />
    </div>
  );
}

/* ─── Loops Visual ───────────────────────────────────────────────────────── */

function LoopsVisual() {
  const values = [10, 20, 30, 40, 50];
  const [step, setStep] = useState(0);
  const active = step - 1;

  return (
    <div className="space-y-4">
      <div className="font-mono text-sm bg-card border rounded-xl p-4 text-foreground/80">
        <span className="text-primary font-semibold">for</span>{" "}
        <span>(</span>
        <span className={cn(step >= 1 && "text-chart-2 font-bold")}>let i = 0</span>
        <span>; i {"<"} </span>
        <span>5; i++)</span>
        {step > 0 && (
          <span className="ml-2 text-muted-foreground">
            {" "}// i = {active < values.length ? active : "done"}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        {values.map((v, i) => (
          <div
            key={i}
            className={cn(
              "w-12 h-12 rounded-xl border-2 flex items-center justify-center font-bold text-base transition-all duration-300",
              i === active
                ? "border-primary bg-primary text-primary-foreground scale-110 ring-4 ring-primary/20"
                : i < active
                ? "border-chart-1 bg-chart-1/10 text-chart-1"
                : "border-border bg-card text-muted-foreground",
            )}
          >
            {v}
          </div>
        ))}
      </div>

      <p className="text-sm font-medium text-foreground/80">
        {step === 0
          ? "The loop will visit every element from index 0 to 4."
          : active < values.length
          ? `Iteration ${active + 1}: i = ${active}, visiting ${values[active]}.`
          : "Loop complete. All 5 elements visited. That's O(n) — n iterations for n elements."}
      </p>

      <StepControls step={step} total={values.length + 2} onStep={setStep} />
    </div>
  );
}

/* ─── Generic fallback ───────────────────────────────────────────────────── */

function GenericConceptVisual({ nodeId }: { nodeId: string }) {
  const label = NODE_LABELS[nodeId] ?? nodeId;
  return (
    <div className="py-6 text-center text-muted-foreground space-y-3">
      <div className="text-5xl">📚</div>
      <p className="font-medium">{label}</p>
      <p className="text-sm max-w-xs mx-auto">
        Work through the explanation and analogy above, then tackle the knowledge check below.
      </p>
    </div>
  );
}

/* ─── Shared step controls ───────────────────────────────────────────────── */

function StepControls({
  step,
  total,
  onStep,
}: {
  step: number;
  total: number;
  onStep: (n: number) => void;
}) {
  const isLast = step >= total - 1;

  return (
    <div className="flex items-center gap-3 pt-2">
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => onStep(isLast ? 0 : step + 1)}
      >
        {isLast ? (
          <>
            <RotateCcw className="w-3.5 h-3.5" /> Restart
          </>
        ) : (
          <>
            Next Step <ChevronRight className="w-3.5 h-3.5" />
          </>
        )}
      </Button>
      <span className="text-xs text-muted-foreground">
        Step {Math.min(step + 1, total)} / {total}
      </span>
    </div>
  );
}

/* ─── Import labels for generic fallback ─────────────────────────────────── */

import { NODE_LABELS } from "@/lib/nodes";

/* ─── Dispatcher ─────────────────────────────────────────────────────────── */

function getVisual(nodeId: string): React.ReactNode {
  switch (nodeId) {
    case "sorted_arrays":
    case "binary_search":
      return <SortedArraysVisual />;
    case "recursion":
    case "base_case_and_recursive_case":
      return <RecursionVisual />;
    case "linear_search":
      return <LinearSearchVisual />;
    case "big_o_time_complexity":
    case "divide_and_conquer":
      return <BigOVisual />;
    case "stacks":
      return <StacksVisual />;
    case "arrays":
      return <ArraysVisual />;
    case "loops":
      return <LoopsVisual />;
    default:
      return <GenericConceptVisual nodeId={nodeId} />;
  }
}
