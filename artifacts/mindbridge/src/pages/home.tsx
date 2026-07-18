import { useState } from "react";
import { Layout } from "@/components/layout";
import { FlowProgress, type FlowStepId } from "@/components/flow/FlowProgress";
import { QuestionInput, type DiagnoseResult } from "@/components/flow/QuestionInput";
import { DiagnosisScreen } from "@/components/flow/DiagnosisScreen";
import { LearningModule } from "@/components/flow/LearningModule";
import { ValidationCheck } from "@/components/flow/ValidationCheck";
import { QuizPanel } from "@/components/flow/QuizPanel";
import { SuccessScreen } from "@/components/flow/SuccessScreen";
import { NODE_LABELS } from "@/lib/nodes";

// ─── Step machine ────────────────────────────────────────────────────────────

type Step =
  | { id: "INPUT" }
  | { id: "DIAGNOSIS"; diagnosis: DiagnoseResult }
  // DIRECT_LEARN: student asked "What is X?" — teach X first, prereq check optional after
  | { id: "DIRECT_LEARN"; nodeId: string; askedTopic: string; prereqNodeId: string }
  | { id: "LEARN"; nodeId: string; askedNodeId?: string; askedTopic: string }
  | { id: "KNOWLEDGE_CHECK"; nodeId: string }
  | { id: "QUIZ"; nodeId: string }
  | { id: "SUCCESS"; nodeId: string; score: number; total: number };

function toFlowStep(step: Step): FlowStepId | null {
  switch (step.id) {
    case "DIAGNOSIS":      return "DIAGNOSIS";
    case "DIRECT_LEARN":   return "LEARN";
    case "LEARN":          return "LEARN";
    case "KNOWLEDGE_CHECK": return "PRACTICE";
    case "QUIZ":           return "QUIZ";
    case "SUCCESS":        return "SUCCESS";
    default:               return null;
  }
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Home() {
  const [step, setStep] = useState<Step>({ id: "INPUT" });

  const handleRestart = () => setStep({ id: "INPUT" });

  const flowStep = toFlowStep(step);

  return (
    <Layout>
      {flowStep && <FlowProgress currentStep={flowStep} />}

      <div className="w-full">
        {step.id === "INPUT" && (
          <QuestionInput
            onDiagnosed={(result) => {
              if (result.intent === "LEARN") {
                // Learning request: teach the asked topic directly, prereq check is optional after
                const nodeId = result.askedNodeId ?? result.hypothesisNode;
                setStep({
                  id: "DIRECT_LEARN",
                  nodeId,
                  askedTopic: result.askedTopic,
                  prereqNodeId: result.hypothesisNode,
                });
              } else {
                // Confusion/debugging request: run the full diagnostic flow
                setStep({ id: "DIAGNOSIS", diagnosis: result });
              }
            }}
          />
        )}

        {step.id === "DIAGNOSIS" && (
          <DiagnosisScreen
            askedTopic={step.diagnosis.askedTopic}
            hypothesisNode={step.diagnosis.hypothesisNode}
            confusionType={step.diagnosis.confusionType}
            fallback={step.diagnosis.fallback}
            onStartLearning={() =>
              setStep({
                id: "LEARN",
                nodeId: step.diagnosis.hypothesisNode,
                askedNodeId: step.diagnosis.askedNodeId,
                askedTopic: step.diagnosis.askedTopic,
              })
            }
            onRestart={handleRestart}
          />
        )}

        {step.id === "DIRECT_LEARN" && (
          <LearningModule
            nodeId={step.nodeId}
            askedTopic={step.askedTopic}
            isDirectLearn
            prereqHintNodeId={step.prereqNodeId !== step.nodeId ? step.prereqNodeId : undefined}
            prereqHintLabel={step.prereqNodeId !== step.nodeId ? (NODE_LABELS[step.prereqNodeId] ?? step.prereqNodeId) : undefined}
            onCheckPrerequisites={
              step.prereqNodeId !== step.nodeId
                ? () =>
                    setStep({
                      id: "LEARN",
                      nodeId: step.prereqNodeId,
                      askedNodeId: step.nodeId,
                      askedTopic: step.askedTopic,
                    })
                : undefined
            }
            onContinue={() =>
              setStep({ id: "KNOWLEDGE_CHECK", nodeId: step.nodeId })
            }
          />
        )}

        {step.id === "LEARN" && (
          <LearningModule
            nodeId={step.nodeId}
            askedNodeId={step.askedNodeId}
            askedTopic={step.askedTopic}
            onContinue={() =>
              setStep({ id: "KNOWLEDGE_CHECK", nodeId: step.nodeId })
            }
          />
        )}

        {step.id === "KNOWLEDGE_CHECK" && (
          <ValidationCheck
            nodeId={step.nodeId}
            onContinue={() =>
              setStep({ id: "QUIZ", nodeId: step.nodeId })
            }
          />
        )}

        {step.id === "QUIZ" && (
          <QuizPanel
            nodeId={step.nodeId}
            onComplete={(score, total) =>
              setStep({ id: "SUCCESS", nodeId: step.nodeId, score, total })
            }
          />
        )}

        {step.id === "SUCCESS" && (
          <SuccessScreen
            nodeLabel={NODE_LABELS[step.nodeId] ?? step.nodeId}
            score={step.score}
            total={step.total}
            onStudyAnother={handleRestart}
          />
        )}
      </div>
    </Layout>
  );
}
