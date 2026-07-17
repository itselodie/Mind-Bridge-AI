import Anthropic from "@anthropic-ai/sdk";
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
  confidence: number;
  fallback: boolean;
}

function createClient(): Anthropic {
  const apiKey = process.env["ANTHROPIC_API_KEY"];
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  return new Anthropic({ apiKey });
}

export async function diagnoseGap(question: string): Promise<DiagnosisResult> {
  const timeoutMs = 8000;

  const prompt = `You are MindBridge AI, a diagnostic tutor for intro data structures & algorithms.

A student wrote: "${question}"

Your job: identify which foundational DSA concept they are actually struggling with — not just what they asked about, but the underlying prerequisite that's likely missing.

You MUST respond with ONLY a JSON object (no markdown, no explanation) matching exactly:
{"asked_topic": "<topic the student mentioned>", "hypothesis_node": "<node_id>", "confidence": <0.0-1.0>}

The hypothesis_node MUST be one of these exact ids:
${VALID_NODE_IDS.join(", ")}

Pick the most likely prerequisite gap. For example, if they ask about binary search, the gap might be "sorted_arrays" or "divide_and_conquer" rather than "binary_search" itself.`;

  try {
    const client = createClient();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let rawJson: string;
    try {
      const response = await client.messages.create(
        {
          model: "claude-haiku-4-5",
          max_tokens: 256,
          messages: [{ role: "user", content: prompt }],
        },
        { signal: controller.signal as AbortSignal },
      );
      clearTimeout(timeoutId);

      const block = response.content[0];
      if (block.type !== "text") {
        throw new Error("Unexpected response type from Anthropic");
      }
      rawJson = block.text.trim();
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }

    // Strip any markdown fences if the model included them
    rawJson = rawJson.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

    const parsed = JSON.parse(rawJson) as {
      asked_topic?: unknown;
      hypothesis_node?: unknown;
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

    return {
      asked_topic:
        typeof parsed.asked_topic === "string"
          ? parsed.asked_topic
          : question,
      hypothesis_node: hypothesisNode,
      confidence,
      fallback: false,
    };
  } catch (err) {
    logger.warn({ err }, "LLM call failed — using fallback diagnosis");
    return {
      asked_topic: question,
      hypothesis_node: FALLBACK_NODE,
      confidence: 0.5,
      fallback: true,
    };
  }
}
