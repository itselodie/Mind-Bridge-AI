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

export async function diagnoseGap(question: string): Promise<DiagnosisResult> {
  const timeoutMs = 10000;

  const prompt = `You are MindBridge AI, a diagnostic tutor for intro data structures & algorithms.

A student wrote: "${question}"

Your job: identify which foundational DSA concept they are actually struggling with — not just what they asked about, but the underlying prerequisite that's likely missing.

You MUST respond with ONLY a JSON object (no markdown, no explanation) matching exactly:
{"asked_topic": "<topic the student mentioned>", "hypothesis_node": "<node_id>", "confusion_type": "<brief description of the type of confusion, e.g. 'conceptual misunderstanding' or 'implementation confusion'>", "confidence": <0.0-1.0>}

The hypothesis_node MUST be one of these exact ids:
${VALID_NODE_IDS.join(", ")}

Pick the most likely prerequisite gap. For example, if they ask about binary search, the gap might be "sorted_arrays" or "divide_and_conquer" rather than "binary_search" itself.`;

  try {
    const ai = createClient();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let rawJson: string;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          maxOutputTokens: 512,
        },
      });
      clearTimeout(timeoutId);

      rawJson = (response.text ?? "").trim();
      if (!rawJson) {
        throw new Error("Empty response from Gemini");
      }
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }

    // Strip any markdown fences if the model included them despite the mime type
    rawJson = rawJson.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

    const parsed = JSON.parse(rawJson) as {
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
      typeof parsed.confusion_type === "string" && parsed.confusion_type.length > 0
        ? parsed.confusion_type
        : "conceptual misunderstanding";

    return {
      asked_topic:
        typeof parsed.asked_topic === "string" ? parsed.asked_topic : question,
      hypothesis_node: hypothesisNode,
      confusion_type: confusionType,
      confidence,
      fallback: false,
    };
  } catch (err) {
    // Log the full error so it's visible in server console — never swallow silently
    const isDev = process.env["NODE_ENV"] === "development";
    const errorMessage = err instanceof Error ? err.message : String(err);

    logger.error(
      { err, question },
      `[MindBridge] Gemini API call failed: ${errorMessage}`,
    );

    if (isDev) {
      console.error("[MindBridge] Gemini API error (full):", err);
    }

    return {
      asked_topic: question,
      hypothesis_node: FALLBACK_NODE,
      confusion_type: "unknown",
      confidence: 0.5,
      fallback: true,
      error: isDev ? errorMessage : undefined,
    };
  }
}
