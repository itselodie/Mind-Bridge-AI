import { GoogleGenAI } from "@google/genai";
import { logger } from "./logger";

const VALID_NODE_IDS = [
  "variables_and_data_types",
  "arrays",
  "loops",
  "linear_search",
  "sorted_arrays",
  "binary_search",
  "divide_and_conquer",
  "basic_sorting",
  "merge_sort",
  "recursion",
  "base_case_and_recursive_case",
  "stacks",
  "big_o_time_complexity",
  "trees_intro",
  "tree_traversal",
];

const FALLBACK_NODE = "variables_and_data_types";

// Models tried in order — if the first is overloaded/erroring, try the next
const MODEL_PRIORITY = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-2.5-flash",
];

export interface DiagnosisResult {
  asked_topic: string;
  hypothesis_node: string;
  confusion_type: string;
  confidence: number;
  fallback: boolean;
  error?: string;
}

function createClient(): GoogleGenAI {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return new GoogleGenAI({ apiKey });
}

function buildPrompt(question: string): string {
  return `You are MindBridge AI, a diagnostic tutor for intro data structures & algorithms.

A student wrote: "${question}"

Your job: identify which foundational DSA concept they are actually struggling with — not just what they asked about, but the underlying prerequisite that's likely missing.

Respond with ONLY a JSON object (no markdown, no explanation) matching exactly:
{"asked_topic": "<topic the student mentioned>", "hypothesis_node": "<node_id>", "confusion_type": "<brief type of confusion e.g. conceptual misunderstanding>", "confidence": <0.0-1.0>}

The hypothesis_node MUST be one of these exact ids:
${VALID_NODE_IDS.join(", ")}

Pick the most likely prerequisite gap. Example: for binary search, the gap might be "sorted_arrays" or "divide_and_conquer" rather than "binary_search" itself.`;
}

async function callGemini(
  ai: GoogleGenAI,
  model: string,
  prompt: string,
): Promise<string> {
  const response = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      maxOutputTokens: 1024,
    },
  });

  const rawText = (response.text ?? "").trim();
  if (!rawText) {
    throw new Error(`Empty response from model ${model}`);
  }

  // Log the raw response so we can see exactly what the model returned
  logger.debug({ model, rawText }, "[MindBridge] Raw Gemini response");
  if (process.env["NODE_ENV"] === "development") {
    console.log(`[MindBridge] Raw response from ${model}:`, rawText);
  }

  return rawText;
}

async function callWithRetry(
  ai: GoogleGenAI,
  prompt: string,
): Promise<string> {
  const maxAttemptsPerModel = 2;
  const errors: string[] = [];

  for (const model of MODEL_PRIORITY) {
    for (let attempt = 1; attempt <= maxAttemptsPerModel; attempt++) {
      try {
        const raw = await callGemini(ai, model, prompt);

        // Validate it's parseable before returning
        const cleaned = raw
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/\s*```$/, "");
        JSON.parse(cleaned); // throws if truncated/malformed
        return cleaned;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const isOverloaded =
          msg.includes("503") ||
          msg.includes("UNAVAILABLE") ||
          msg.includes("high demand");
        const isMalformedJson =
          err instanceof SyntaxError || msg.includes("JSON");

        logger.warn(
          { model, attempt, err },
          `[MindBridge] Attempt ${attempt} with ${model} failed: ${msg}`,
        );
        if (process.env["NODE_ENV"] === "development") {
          console.error(
            `[MindBridge] ${model} attempt ${attempt} error:`,
            msg,
          );
        }

        errors.push(`${model}[${attempt}]: ${msg}`);

        // Don't retry this model if it's a permanent error (auth, quota, etc.)
        // Only retry/fallback for overload or malformed JSON
        if (!isOverloaded && !isMalformedJson) {
          break; // skip remaining attempts on this model, try next
        }

        // Short backoff before retry (same model, attempt 2) or next model
        if (attempt < maxAttemptsPerModel) {
          await new Promise((r) => setTimeout(r, 500 * attempt));
        }
      }
    }
  }

  throw new Error(
    `All Gemini models failed. Errors:\n${errors.join("\n")}`,
  );
}

export async function diagnoseGap(question: string): Promise<DiagnosisResult> {
  const isDev = process.env["NODE_ENV"] === "development";

  try {
    const ai = createClient();
    const prompt = buildPrompt(question);
    const cleanedJson = await callWithRetry(ai, prompt);

    const parsed = JSON.parse(cleanedJson) as {
      asked_topic?: unknown;
      hypothesis_node?: unknown;
      confusion_type?: unknown;
      confidence?: unknown;
    };

    const hypothesisNode =
      typeof parsed.hypothesis_node === "string" &&
      VALID_NODE_IDS.includes(parsed.hypothesis_node)
        ? parsed.hypothesis_node
        : FALLBACK_NODE;

    const confidence =
      typeof parsed.confidence === "number" &&
      parsed.confidence >= 0 &&
      parsed.confidence <= 1
        ? parsed.confidence
        : 0.7;

    const confusionType =
      typeof parsed.confusion_type === "string" &&
      parsed.confusion_type.length > 0
        ? parsed.confusion_type
        : "conceptual misunderstanding";

    logger.info(
      { hypothesisNode, confidence, model: "gemini" },
      "[MindBridge] Diagnosis complete",
    );

    return {
      asked_topic:
        typeof parsed.asked_topic === "string" ? parsed.asked_topic : question,
      hypothesis_node: hypothesisNode,
      confusion_type: confusionType,
      confidence,
      fallback: false,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    // Always log the full error — never swallow silently
    logger.error({ err, question }, `[MindBridge] Gemini diagnosis failed: ${errorMessage}`);
    console.error("[MindBridge] Full error:", err);

    return {
      asked_topic: question,
      hypothesis_node: FALLBACK_NODE,
      confusion_type: "unknown",
      confidence: 0.5,
      fallback: true,
      error: isDev ? errorMessage : "AI temporarily unavailable",
    };
  }
}
