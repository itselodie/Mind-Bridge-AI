import { Router } from "express";
import { readFile } from "fs/promises";
import path from "path";
import { z } from "zod";
import { diagnoseGap } from "../lib/llm";

const router = Router();

// ─── Knowledge graph ─────────────────────────────────────────────────────────

interface GraphNode {
  id: string;
  label: string;
  prerequisites: string[];
  teaching: {
    explanation: string;
    analogy: string;
  };
  validation_question: {
    prompt: string;
    options: string[];
    correct: string;
  };
  quiz: Array<{
    q: string;
    options: string[];
    correct: number;
  }>;
}

let graphCache: GraphNode[] | null = null;

async function getGraph(): Promise<GraphNode[]> {
  if (graphCache) return graphCache;
  // At runtime the bundle lives in dist/index.mjs, so import.meta.dirname = dist/.
  // graph.json lives at src/data/graph.json  →  ../src/data/graph.json relative to dist/.
  const filePath = path.resolve(import.meta.dirname, "../src/data/graph.json");
  console.log(`[MindBridge] Loading graph from: ${filePath}`);
  const raw = await readFile(filePath, "utf-8");
  graphCache = JSON.parse(raw) as GraphNode[];
  console.log(`[MindBridge] Graph loaded: ${graphCache.length} nodes`);
  return graphCache;
}

function findNode(graph: GraphNode[], id: string): GraphNode | undefined {
  return graph.find((n) => n.id === id);
}

// ─── Input schemas ───────────────────────────────────────────────────────────

const DiagnoseInputSchema = z.object({
  question: z.string().min(1),
});

const NodeInputSchema = z.object({
  node_id: z.string().min(1),
});

const MasteryInputSchema = z.object({
  mastery: z.record(z.string(), z.number()),
});

// ─── Routes ─────────────────────────────────────────────────────────────────

/** POST /api/diagnose — calls LLM, returns hypothesis */
router.post("/diagnose", async (req, res) => {
  console.log("[MindBridge] POST /api/diagnose received");
  try {
    const parsed = DiagnoseInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "question is required" });
      return;
    }

    const result = await diagnoseGap(parsed.data.question);
    console.log("[MindBridge] POST /api/diagnose — sending response");
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[MindBridge] POST /api/diagnose unhandled error:", err);
    res.status(500).json({ error: msg });
  }
});

/** POST /api/validate — static lookup */
router.post("/validate", async (req, res) => {
  console.log("[MindBridge] POST /api/validate received");
  try {
    const parsed = NodeInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "node_id is required" });
      return;
    }

    const graph = await getGraph();
    const node = findNode(graph, parsed.data.node_id);
    if (!node) {
      res.status(404).json({ error: `Node '${parsed.data.node_id}' not found` });
      return;
    }

    console.log(`[MindBridge] POST /api/validate — returning node: ${node.id}`);
    res.json({
      node_id: node.id,
      label: node.label,
      prompt: node.validation_question.prompt,
      options: node.validation_question.options,
      correct: node.validation_question.correct,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[MindBridge] POST /api/validate unhandled error:", err);
    res.status(500).json({ error: msg });
  }
});

/** POST /api/teach — static lookup */
router.post("/teach", async (req, res) => {
  console.log("[MindBridge] POST /api/teach received");
  try {
    const parsed = NodeInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "node_id is required" });
      return;
    }

    const graph = await getGraph();
    const node = findNode(graph, parsed.data.node_id);
    if (!node) {
      res.status(404).json({ error: `Node '${parsed.data.node_id}' not found` });
      return;
    }

    console.log(`[MindBridge] POST /api/teach — returning node: ${node.id}`);
    res.json({
      node_id: node.id,
      label: node.label,
      explanation: node.teaching.explanation,
      analogy: node.teaching.analogy,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[MindBridge] POST /api/teach unhandled error:", err);
    res.status(500).json({ error: msg });
  }
});

/** POST /api/quiz — static lookup */
router.post("/quiz", async (req, res) => {
  console.log("[MindBridge] POST /api/quiz received");
  try {
    const parsed = NodeInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "node_id is required" });
      return;
    }

    const graph = await getGraph();
    const node = findNode(graph, parsed.data.node_id);
    if (!node) {
      res.status(404).json({ error: `Node '${parsed.data.node_id}' not found` });
      return;
    }

    console.log(`[MindBridge] POST /api/quiz — returning node: ${node.id}`);
    res.json({
      node_id: node.id,
      label: node.label,
      quiz: node.quiz,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[MindBridge] POST /api/quiz unhandled error:", err);
    res.status(500).json({ error: msg });
  }
});

/** POST /api/progress — pure logic, returns next recommended node */
router.post("/progress", async (req, res) => {
  console.log("[MindBridge] POST /api/progress received");
  try {
    const parsed = MasteryInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "mastery map is required" });
      return;
    }

    const graph = await getGraph();
    const mastery = parsed.data.mastery;

    const topics = graph.map((node) => {
      const nodeMastery = mastery[node.id] ?? 0;
      const prerequisitesMet = node.prerequisites.every(
        (p) => (mastery[p] ?? 0) >= 0.7,
      );
      const isUnlocked = prerequisitesMet || node.prerequisites.length === 0;

      return {
        id: node.id,
        label: node.label,
        mastery: nodeMastery,
        prerequisites_met: prerequisitesMet,
        is_unlocked: isUnlocked,
      };
    });

    const nextTopic = topics.find((t) => t.mastery < 0.7 && t.is_unlocked);

    console.log(`[MindBridge] POST /api/progress — next node: ${nextTopic?.id ?? "none"}`);
    res.json({
      next_node: nextTopic?.id ?? null,
      next_label: nextTopic?.label ?? null,
      topics,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[MindBridge] POST /api/progress unhandled error:", err);
    res.status(500).json({ error: msg });
  }
});

export default router;
