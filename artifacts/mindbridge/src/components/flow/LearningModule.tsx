import { useState } from "react";
import { useTeach } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  ArrowRight,
  BookOpen,
  Lightbulb,
  Code2,
  Star,
  AlertCircle,
  HelpCircle,
  Link2,
  AlertTriangle,
  SearchCheck,
  Zap,
  Layers,
  Clock,
} from "lucide-react";
import { InteractiveVisual } from "./InteractiveVisual";
import { NODE_CONTENT } from "@/lib/nodes";
import { cn } from "@/lib/utils";

interface LearningModuleProps {
  nodeId: string;            // node to teach
  askedNodeId?: string;      // original topic the student asked about (confusion flow only)
  askedTopic: string;        // human-readable topic string
  onContinue: () => void;
  // Direct-learn mode (learning request, e.g. "What is X?")
  isDirectLearn?: boolean;
  prereqHintLabel?: string;  // label of the optional prerequisite to surface
  prereqHintNodeId?: string; // node id of that prerequisite
  onCheckPrerequisites?: () => void; // called when student opts into prereq review
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  accentClass,
  bgClass,
  borderClass,
  label,
  title,
  children,
}: {
  icon: React.ElementType;
  accentClass: string;
  bgClass: string;
  borderClass: string;
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      {/* Label pill */}
      <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider", bgClass, accentClass)}>
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <h2 className="text-xl md:text-2xl font-bold text-foreground">{title}</h2>
      <Card className={cn("border-2 overflow-hidden shadow-sm", borderClass)}>
        <CardContent className="p-6 md:p-8">
          {children}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Code block ───────────────────────────────────────────────────────────────

function CodeBlock({ code, language }: { code: string; language?: string }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden mt-4">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/80 border-b border-border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Code2 className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Code example</span>
        </div>
        {language && (
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
            {language}
          </span>
        )}
      </div>
      <pre className="p-4 md:p-6 overflow-x-auto text-sm leading-relaxed font-mono text-foreground/85 bg-foreground/[0.03]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LearningModule({
  nodeId,
  askedNodeId,
  askedTopic,
  onContinue,
  isDirectLearn,
  prereqHintLabel,
  onCheckPrerequisites,
}: LearningModuleProps) {
  const [isStarting, setIsStarting] = useState(false);

  const teachQuery = useTeach({
    mutation: { onSuccess: () => setIsStarting(false) },
  });

  if (!teachQuery.data && !teachQuery.isPending && !isStarting) {
    setIsStarting(true);
    teachQuery.mutate({ data: { node_id: nodeId, asked_node_id: askedNodeId } });
  }

  if (teachQuery.isPending || isStarting) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="mt-4 font-medium">Building your personalised lesson...</p>
      </div>
    );
  }

  if (teachQuery.isError || !teachQuery.data) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="inline-flex items-center gap-2 text-destructive">
          <AlertCircle className="w-5 h-5" />
          <p>Failed to load lesson content.</p>
        </div>
        <Button onClick={() => teachQuery.mutate({ data: { node_id: nodeId, asked_node_id: askedNodeId } })}>
          Retry
        </Button>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = teachQuery.data as any;
  const {
    label: prereqLabel,
    explanation: prereqExplanation,
    analogy: prereqAnalogy,
    original_topic_label,
    original_topic_explanation,
    original_topic_analogy,
    connection,
    why_it_exists,
    common_mistakes,
    applications,
    complexity,
  } = data;

  const prereqContent = NODE_CONTENT[nodeId];
  const originalContent = askedNodeId ? NODE_CONTENT[askedNodeId] : undefined;

  // Whether the prerequisite IS the same node as what was asked (no redirect needed)
  const isSameNode = !original_topic_label;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">

      {/* ── Section 1: What you asked ─────────────────────────────────── */}
      {!isSameNode && original_topic_explanation && (
        <Section
          icon={HelpCircle}
          label="What you asked"
          title={original_topic_label ?? askedTopic}
          accentClass="text-chart-2"
          bgClass="bg-chart-2/10"
          borderClass="border-chart-2/20"
        >
          <p className="text-base leading-loose text-foreground/85 whitespace-pre-wrap">
            {original_topic_explanation}
          </p>

          {original_topic_analogy && (
            <div className="mt-5 flex gap-3 p-4 rounded-xl bg-chart-2/5 border border-chart-2/15">
              <Lightbulb className="w-4 h-4 text-chart-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed italic text-foreground/75">
                {original_topic_analogy}
              </p>
            </div>
          )}

          {originalContent?.codeExample && (
            <CodeBlock code={originalContent.codeExample} language={originalContent.codeLanguage} />
          )}
        </Section>
      )}

      {/* ── Section 2: Why you might be stuck ────────────────────────── */}
      {!isSameNode && (
        <Section
          icon={AlertTriangle}
          label="Why you might be stuck"
          title="There's a missing piece"
          accentClass="text-amber-600 dark:text-amber-400"
          bgClass="bg-amber-500/10"
          borderClass="border-amber-500/20"
        >
          <p className="text-base leading-relaxed text-foreground/85">
            Although <span className="font-semibold text-foreground">{original_topic_label ?? askedTopic}</span>{" "}
            is exactly what you asked about, I think the concept preventing full
            understanding is{" "}
            <span className="font-semibold text-foreground">{prereqLabel}</span>.
          </p>
          <p className="mt-3 text-base leading-relaxed text-foreground/75">
            It's a foundational concept that{" "}
            {original_topic_label ?? askedTopic} depends on. Once it's clear,
            the original topic will click much faster.
          </p>
        </Section>
      )}

      {/* ── Section 3: Learn the concept ─────────────────────────────── */}
      <Section
        icon={BookOpen}
        label={isSameNode ? "Let's learn it" : "Let's learn the missing concept"}
        title={prereqLabel}
        accentClass="text-primary"
        bgClass="bg-primary/10"
        borderClass="border-primary/20"
      >
        <p className="text-base leading-loose text-foreground/85 whitespace-pre-wrap">
          {prereqExplanation}
        </p>

        {prereqAnalogy && (
          <div className="mt-5 flex gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
            <Lightbulb className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm leading-relaxed italic text-foreground/75">
              {prereqAnalogy}
            </p>
          </div>
        )}

        {prereqContent?.codeExample && (
          <CodeBlock code={prereqContent.codeExample} language={prereqContent.codeLanguage} />
        )}
      </Section>

      {/* ── Why it exists ─────────────────────────────────────────────── */}
      {why_it_exists && (
        <Section
          icon={Zap}
          label="Why it exists"
          title="The problem it solves"
          accentClass="text-violet-600 dark:text-violet-400"
          bgClass="bg-violet-500/10"
          borderClass="border-violet-500/20"
        >
          <p className="text-base leading-loose text-foreground/85">
            {why_it_exists}
          </p>
        </Section>
      )}

      {/* ── Common mistakes ───────────────────────────────────────────── */}
      {Array.isArray(common_mistakes) && common_mistakes.length > 0 && (
        <Section
          icon={AlertTriangle}
          label="Common mistakes"
          title="What trips people up"
          accentClass="text-amber-600 dark:text-amber-400"
          bgClass="bg-amber-500/10"
          borderClass="border-amber-500/20"
        >
          <ul className="space-y-4">
            {common_mistakes.map((mistake: string, i: number) => (
              <li key={i} className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-bold mt-0.5">
                  {i + 1}
                </span>
                <p className="text-base leading-relaxed text-foreground/85">{mistake}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* ── Practical applications ─────────────────────────────────────── */}
      {Array.isArray(applications) && applications.length > 0 && (
        <Section
          icon={Layers}
          label="Practical applications"
          title="Where you'll see this in the real world"
          accentClass="text-chart-1"
          bgClass="bg-chart-1/10"
          borderClass="border-chart-1/20"
        >
          <ul className="space-y-3">
            {applications.map((app: string, i: number) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-2 h-2 rounded-full bg-chart-1 mt-2.5" />
                <p className="text-base leading-relaxed text-foreground/85">{app}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* ── Time & Space Complexity ───────────────────────────────────── */}
      {complexity && (complexity.time || complexity.space) && (
        <div className="rounded-2xl border-2 border-sky-500/30 bg-sky-500/5 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <p className="font-bold text-sm text-sky-600 dark:text-sky-400 uppercase tracking-wider">
              Time & Space Complexity
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {complexity.time && (
              <div className="p-4 rounded-xl bg-background border border-sky-500/20">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Time</p>
                <p className="font-mono font-bold text-sky-700 dark:text-sky-300 text-base leading-relaxed">{complexity.time}</p>
              </div>
            )}
            {complexity.space && (
              <div className="p-4 rounded-xl bg-background border border-sky-500/20">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Space</p>
                <p className="font-mono font-bold text-sky-700 dark:text-sky-300 text-base leading-relaxed">{complexity.space}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive visual */}
      <InteractiveVisual nodeId={nodeId} />

      {/* Key takeaway */}
      {prereqContent?.keyTakeaway && (
        <div className="rounded-2xl border-2 border-chart-2/40 bg-chart-2/10 p-6 flex gap-4 items-start">
          <Star className="w-6 h-6 text-chart-2 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-sm text-chart-2 uppercase tracking-wider">Key Takeaway</p>
            <p className="text-foreground/85 leading-relaxed font-medium">
              {prereqContent.keyTakeaway}
            </p>
          </div>
        </div>
      )}

      {/* ── Section 4: Connecting it back ──────────────────────────────── */}
      {!isSameNode && connection && (
        <Section
          icon={Link2}
          label="Connecting it back"
          title={`How this relates to ${original_topic_label ?? askedTopic}`}
          accentClass="text-chart-1"
          bgClass="bg-chart-1/10"
          borderClass="border-chart-1/20"
        >
          <p className="text-base leading-relaxed text-foreground/85">
            {connection}
          </p>
        </Section>
      )}

      {/* ── Optional prereq hint (direct-learn mode only) ─────────────── */}
      {isDirectLearn && onCheckPrerequisites && (
        <div className="rounded-2xl border-2 border-muted bg-muted/40 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <SearchCheck className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-foreground/80 leading-relaxed">
              {prereqHintLabel
                ? <>
                    <span className="font-semibold text-foreground">{prereqLabel}</span> relies on{" "}
                    <span className="font-semibold text-foreground">{prereqHintLabel}</span>.{" "}
                  </>
                : null}
              Would you like MindBridge to check whether you&apos;re missing any prerequisite concepts?
            </p>
          </div>
          <Button
            variant="outline"
            onClick={onCheckPrerequisites}
            className="gap-2 w-full sm:w-auto"
          >
            <SearchCheck className="w-4 h-4" />
            Check prerequisite concepts
          </Button>
        </div>
      )}

      {/* ── Continue CTA ──────────────────────────────────────────────── */}
      <div className="flex justify-center pt-4 pb-2">
        <Button
          size="lg"
          onClick={onContinue}
          className="gap-2 px-10 py-6 rounded-2xl shadow-md font-semibold text-base"
        >
          Check My Understanding <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
