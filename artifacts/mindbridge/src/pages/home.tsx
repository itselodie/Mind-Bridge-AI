import { useState } from "react";
import { Layout } from "@/components/layout";
import { QuestionInput } from "@/components/flow/QuestionInput";
import { ValidationCheck } from "@/components/flow/ValidationCheck";
import { Explanation } from "@/components/flow/Explanation";
import { QuizPanel } from "@/components/flow/QuizPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Target, AlertCircle } from "lucide-react";

type Step = 
  | { id: 'INPUT' }
  | { id: 'DIAGNOSIS_RESULT', nodeId: string, label: string, fallback: boolean }
  | { id: 'VALIDATING', nodeId: string }
  | { id: 'EXPLANATION', nodeId: string }
  | { id: 'QUIZ', nodeId: string };

export default function Home() {
  const [step, setStep] = useState<Step>({ id: 'INPUT' });

  const handleDiagnosed = (nodeId: string, label: string, fallback: boolean) => {
    setStep({ id: 'DIAGNOSIS_RESULT', nodeId, label, fallback });
  };

  const handleRestart = () => {
    setStep({ id: 'INPUT' });
  };

  return (
    <Layout>
      <div className="w-full">
        {step.id === 'INPUT' && (
          <QuestionInput onDiagnosed={handleDiagnosed} />
        )}

        {step.id === 'DIAGNOSIS_RESULT' && (
          <div className="animate-in fade-in zoom-in-95 duration-500 max-w-xl mx-auto space-y-8 text-center py-10">
            {step.fallback ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-4">
                <AlertCircle className="w-4 h-4" />
                Couldn't reach AI — defaulting to standard topic
              </div>
            ) : null}
            
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
                <Target className="w-8 h-8" />
              </div>
              <h2 className="text-2xl text-muted-foreground font-medium">We think you might need a refresher on:</h2>
              <div className="text-4xl md:text-5xl font-bold text-foreground py-4 tracking-tight">
                {step.label}
              </div>
            </div>

            <Button 
              size="lg" 
              className="mt-8 text-lg px-8 py-6 rounded-full shadow-lg"
              onClick={() => setStep({ id: 'VALIDATING', nodeId: step.nodeId })}
            >
              Check my understanding
            </Button>
            
            <div className="pt-8">
              <Button variant="ghost" size="sm" onClick={handleRestart} className="text-muted-foreground">
                Wait, I meant something else
              </Button>
            </div>
          </div>
        )}

        {step.id === 'VALIDATING' && (
          <ValidationCheck 
            nodeId={step.nodeId} 
            onContinue={() => setStep({ id: 'EXPLANATION', nodeId: step.nodeId })} 
          />
        )}

        {step.id === 'EXPLANATION' && (
          <Explanation 
            nodeId={step.nodeId} 
            onContinue={() => setStep({ id: 'QUIZ', nodeId: step.nodeId })} 
          />
        )}

        {step.id === 'QUIZ' && (
          <QuizPanel 
            nodeId={step.nodeId} 
            onRestart={handleRestart}
          />
        )}
      </div>
    </Layout>
  );
}
