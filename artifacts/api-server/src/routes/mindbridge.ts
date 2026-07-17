import { Router } from "express";
import { createReadStream } from "fs";
import { readFile } from "fs/promises";
import path from "path";
import { z } from "zod";
import { diagnoseGap } from "../lib/llm";

const router = Router();

// ─── Load graph once at startup ─────────────────────────────────────────────

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
  const filePath = path.resolve(
    import.meta.dirname,
    "../data/graph.json",
  );
  const raw = await readFile(filePath, "utf-8");
  graphCache = JSON.parse(raw) as GraphNode[];
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
  const parsed = DiagnoseInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "question is required" });
    return;
  }

  const result = await diagnoseGap(parsed.data.question);
  res.json(result);
});

/** POST /api/validate — static lookup */
router.post("/validate", async (req, res) => {
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

  res.json({
    node_id: node.id,
    label: node.label,
    prompt: node.validation_question.prompt,
    options: node.validation_question.options,
    correct: node.validation_question.correct,
  });
});

/** POST /api/teach — static lookup */
router.post("/teach", async (req, res) => {
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

  res.json({
    node_id: node.id,
    label: node.label,
    explanation: node.teaching.explanation,
    analogy: node.teaching.analogy,
  });
});

/** POST /api/quiz — static lookup */
router.post("/quiz", async (req, res) => {
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

  res.json({
    node_id: node.id,
    label: node.label,
    quiz: node.quiz,
  });
});

/** POST /api/progress — pure logic, returns next recommended node */
router.post("/progress", async (req, res) => {
  const parsed = MasteryInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "mastery map is required" });
    return;
  }

  const graph = await getGraph();
  const mastery = parsed.data.mastery;

  // Compute topics with mastery and unlock state
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

  // Find first node where mastery < 0.7 AND all prerequisites have mastery >= 0.7
  const nextTopic = topics.find((t) => t.mastery < 0.7 && t.is_unlocked);

  res.json({
    next_node: nextTopic?.id ?? null,
    next_label: nextTopic?.label ?? null,
    topics,
  });
});

export default router;
