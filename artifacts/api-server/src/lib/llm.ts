import { GoogleGenAI } from "@google/genai";
import { logger } from "./logger";

const VALID_NODE_IDS = [
  "data_structures",
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
const TIMEOUT_MS = 20_000; // gemini-2.5-flash can be slow under load
const MAX_RETRIES = 4; // total attempts (covers both JSON failures and retryable HTTP errors)
const BASE_RETRY_DELAY_MS = 800;

// HTTP status codes that indicate a transient server-side problem worth retrying.
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

export interface DiagnosisResult {
  asked_topic: string;
  asked_node_id?: string;
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

Your job:
1. Identify the topic the student is asking about (asked_node_id) — which node in our graph best matches what they mentioned.
2. Identify the underlying prerequisite that is likely missing (hypothesis_node) — this may be the same node or a prerequisite of it.

Respond with ONLY valid JSON (no markdown, no explanation):
{"asked_topic": "<topic the student mentioned>", "asked_node_id": "<node_id>", "hypothesis_node": "<node_id>", "confusion_type": "<brief type of confusion>", "confidence": <0.0-1.0>}

Both asked_node_id and hypothesis_node MUST be one of these exact ids:
${VALID_NODE_IDS.join(", ")}

Rules:
- asked_node_id is the node that matches what the student asked about.
- hypothesis_node is the prerequisite concept they are probably missing. It should be a prerequisite OF the asked_node_id when possible.
- If the student is asking about a foundational concept with no prerequisites, asked_node_id and hypothesis_node may be the same.

Example: for "I don't understand binary search" → asked_node_id: "binary_search", hypothesis_node: "sorted_arrays" (a prerequisite of binary_search).`;
}

/**
 * Call Gemini once with a hard 10-second timeout.
 * Returns the raw response text or throws.
 */
async function callGeminiOnce(
  ai: GoogleGenAI,
  prompt: string,
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.error("[MindBridge] Gemini request timed out after 10s — aborting");
    controller.abort();
  }, TIMEOUT_MS);

  try {
    console.log("[MindBridge] Gemini request started");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 1024,
      },
    });

    console.log("[MindBridge] Gemini response received");

    const rawText = (response.text ?? "").trim();
    if (!rawText) {
      throw new Error("Gemini returned an empty response");
    }

    return rawText;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Attempt up to MAX_RETRIES times, retrying on:
 *   - Transient HTTP errors (429, 500, 502, 503, 504) with exponential backoff
 *   - Truncated / malformed JSON with a short fixed delay
 *
 * Fatal errors (auth, bad request, etc.) are thrown immediately without retry.
 */
async function callWithRetry(
  ai: GoogleGenAI,
  prompt: string,
): Promise<string> {
  let lastErr: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    // ── Step 1: call the API ────────────────────────────────────────────────
    let rawText: string;
    try {
      rawText = await callGeminiOnce(ai, prompt);
    } catch (err) {
      lastErr = err;
      const status = (err as { status?: number }).status;
      const isRetryable = status !== undefined && RETRYABLE_STATUS_CODES.has(status);

      if (!isRetryable) {
        // Auth failures, quota exceeded at account level, bad requests, etc. — fail fast.
        console.error(
          `[MindBridge] Gemini API error (status ${status ?? "unknown"}) — not retryable, giving up: ${err instanceof Error ? err.message : String(err)}`,
        );
        throw err;
      }

      if (attempt === MAX_RETRIES) {
        console.error(
          `[MindBridge] Gemini returned ${status} on all ${MAX_RETRIES} attempts — giving up`,
        );
        throw err;
      }

      const delay = BASE_RETRY_DELAY_MS * attempt; // 800 ms, 1600 ms, 2400 ms …
      console.warn(
        `[MindBridge] Gemini returned ${status} on attempt ${attempt}/${MAX_RETRIES} — retrying in ${delay} ms`,
      );
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }

    // ── Step 2: validate / parse JSON ──────────────────────────────────────
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    console.log(`[MindBridge] Raw response (attempt ${attempt}): ${cleaned}`);

    try {
      JSON.parse(cleaned);
      console.log("[MindBridge] JSON parsed successfully");
      return cleaned;
    } catch (parseErr) {
      lastErr = parseErr;
      const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
      console.error(
        `[MindBridge] JSON parse failed on attempt ${attempt}: ${msg} | raw: ${cleaned}`,
      );
      logger.warn(
        { attempt, rawText: cleaned, parseErr },
        "[MindBridge] Truncated/malformed JSON from Gemini — retrying",
      );

      if (attempt === MAX_RETRIES) {
        throw new Error(
          `Gemini returned malformed JSON after ${MAX_RETRIES} attempts: ${msg}`,
        );
      }

      await new Promise((r) => setTimeout(r, 300));
    }
  }

  throw lastErr ?? new Error("Unreachable");
}

export async function diagnoseGap(question: string): Promise<DiagnosisResult> {
  const isDev = process.env["NODE_ENV"] === "development";

  console.log(`[MindBridge] Request received — question: "${question}"`);

  try {
    const ai = createClient();
    const prompt = buildPrompt(question);
    const cleanedJson = await callWithRetry(ai, prompt);

    const parsed = JSON.parse(cleanedJson) as {
      asked_topic?: unknown;
      asked_node_id?: unknown;
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

    const askedNodeId =
      typeof parsed.asked_node_id === "string" &&
      VALID_NODE_IDS.includes(parsed.asked_node_id)
        ? parsed.asked_node_id
        : undefined;

    const result: DiagnosisResult = {
      asked_topic:
        typeof parsed.asked_topic === "string" ? parsed.asked_topic : question,
      asked_node_id: askedNodeId,
      hypothesis_node: hypothesisNode,
      confusion_type: confusionType,
      confidence,
      fallback: false,
    };

    logger.info(
      { hypothesisNode, confidence },
      "[MindBridge] Diagnosis complete",
    );
    console.log(
      `[MindBridge] Response sent to frontend — node: ${hypothesisNode}, confidence: ${confidence}`,
    );

    return result;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    // Always log the full error — never swallow silently
    logger.error({ err, question }, `[MindBridge] Gemini diagnosis failed: ${errorMessage}`);
    console.error("[MindBridge] Full error:", err);

    const fallback: DiagnosisResult = {
      asked_topic: question,
      hypothesis_node: FALLBACK_NODE,
      confusion_type: "unknown",
      confidence: 0.5,
      fallback: true,
      error: isDev ? errorMessage : "AI temporarily unavailable",
    };

    console.log(
      `[MindBridge] Response sent to frontend — FALLBACK (${errorMessage})`,
    );

    return fallback;
  }
}
