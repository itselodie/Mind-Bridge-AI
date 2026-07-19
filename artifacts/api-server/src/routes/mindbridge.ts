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
    why_it_exists?: string;
    analogy: string;
    common_mistakes?: string[];
    applications?: string[];
    complexity?: { time: string; space: string };
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

// ─── Connection text: prerequisite_id → asked_node_id → explanation ──────────
// Explains how the prerequisite relates back to the topic the student asked about.

const CONNECTIONS: Record<string, Record<string, string>> = {
  variables_and_data_types: {
    arrays:
      "Arrays store elements of the same data type in sequence. Every array operation — indexing, sorting, comparing — depends on knowing the type of its values. Variables and data types are the foundation that arrays are built on.",
    loops:
      "A loop counter (like `i`) is itself a variable with an integer type. Understanding that `i` is a named box that increments each iteration is exactly what makes a for-loop readable.",
  },
  arrays: {
    linear_search:
      "Linear search works by scanning an array from index 0 to the last element. Every part of the algorithm — indexing, bounds checking, iteration — directly uses arrays. Once arrays click, linear search follows immediately.",
    sorted_arrays:
      "A sorted array is an array with one extra guarantee: its elements are in order. All array operations still apply exactly the same way; sorting just adds the ordering property that unlocks faster algorithms.",
    stacks:
      "A stack is most commonly implemented as an array where you only push and pop from one end. The underlying data structure is an array — stacks just restrict which operations you're allowed to perform.",
    basic_sorting:
      "Sorting algorithms rearrange elements inside an array. Bubble sort and selection sort both rely on array indexing to compare and swap adjacent elements. Arrays are the data structure these algorithms operate on.",
    binary_search:
      "Binary search operates on an array — specifically, it reads elements at calculated index positions. Understanding how arrays store data at numbered positions is essential for following how binary search jumps to the midpoint.",
  },
  loops: {
    linear_search:
      "Linear search is a for-loop over an array. The loop increments an index variable, reads the element at that index, and checks if it matches the target. Loops are literally the mechanism that drives the entire search.",
    recursion:
      "Loops and recursion both repeat work, but in different ways. A loop uses a counter; recursion uses the call stack. If you can read a for-loop step by step, you can apply the same mental model to follow a recursive call.",
    big_o_time_complexity:
      "Big-O is the language for describing how loops scale. A single loop over n items is O(n). Nested loops produce O(n²). Understanding loops is what makes Big-O notation tangible rather than abstract.",
    basic_sorting:
      "Sorting algorithms use nested loops. Bubble sort's outer loop runs n times; its inner loop makes comparisons and swaps. Loops are the engine that powers every O(n²) sorting algorithm.",
    sorted_arrays:
      "Creating a sorted array requires iterating through the data — either a sorting algorithm or a loop that maintains order on insertion. Understanding how loops process elements one by one is what makes sorting algorithms readable.",
  },
  sorted_arrays: {
    binary_search:
      "Binary search can only work because the array is sorted. Each comparison lets you eliminate half the remaining elements — but this only works if all smaller values are definitely on the left. Sorted order is the guarantee that makes binary search possible.",
  },
  divide_and_conquer: {
    binary_search:
      "Binary search is divide and conquer in its simplest form: split the search space in half, work on one half, and discard the other. Once you recognise the divide-conquer-combine pattern, binary search becomes an obvious application of it.",
    merge_sort:
      "Merge sort is divide and conquer applied to sorting: split the array, recursively sort each half, then merge them. Every step of merge sort maps directly onto the divide-conquer-combine structure.",
  },
  recursion: {
    divide_and_conquer:
      "Divide and conquer almost always uses recursion for the 'conquer' step — the recursive call IS how you solve each sub-problem. Once you're comfortable writing recursive functions, divide and conquer is the natural next pattern.",
    base_case_and_recursive_case:
      "Base case and recursive case are the two required parts of any recursive function. This concept is a deep dive into the structure you need to write recursion correctly — the part that trips people up most.",
    merge_sort:
      "The split-and-recurse step of merge sort is pure recursion: each half is sorted by calling mergeSort on itself, until you reach a single-element array (the base case). Recursion is the engine that makes merge sort work.",
    trees_intro:
      "Trees are inherently recursive structures — each node's children are themselves trees. Every tree algorithm (traversal, search, insertion) is most naturally expressed as a recursive function. Recursion is the key mental model for working with trees.",
  },
  stacks: {
    trees_intro:
      "Tree traversal algorithms use a stack — sometimes explicitly, always implicitly via the call stack in recursion. When you traverse a tree depth-first, you're pushing nodes as you go deeper and popping them as you backtrack.",
  },
  basic_sorting: {
    merge_sort:
      "Merge sort is what comes after understanding basic O(n²) sorting. Where bubble sort brute-forces comparisons, merge sort replaces that with a smarter divide-and-conquer approach to achieve O(n log n). Understanding why O(n²) is slow is exactly what motivates merge sort.",
  },
  trees_intro: {
    tree_traversal:
      "Tree traversal is the set of algorithms for visiting every node in a tree exactly once. Once you understand a tree's structure — root, parent, children, leaves — traversal is just a question of choosing the order to follow those branches.",
  },
  linear_search: {
    binary_search:
      "Linear search and binary search both solve the same problem — finding a target in a collection — but linear search checks every element while binary search eliminates half at each step. Understanding linear search makes it clear why binary search is such a dramatic improvement.",
  },
  base_case_and_recursive_case: {
    recursion:
      "The base case and recursive case are the core structure of every recursive function. Once you can reliably identify both in any recursive problem, writing and debugging recursive code becomes straightforward.",
    divide_and_conquer:
      "Every divide-and-conquer algorithm is recursive, and every recursive algorithm needs a correct base case. The base case is what stops the recursion — for merge sort it's a single-element array, for binary search it's an empty range.",
    merge_sort:
      "Merge sort's recursion bottoms out at the base case: an array of one element is already sorted. Without a correct base case, the recursion never stops. This concept directly governs when merge sort's recursion terminates.",
  },
  big_o_time_complexity: {
    binary_search:
      "Binary search is famous for its O(log n) complexity — it halves the search space each step. Understanding Big-O is what lets you appreciate why O(log n) is dramatically faster than the O(n) of linear search on large inputs.",
    merge_sort:
      "Merge sort's O(n log n) complexity is its headline feature. Big-O is the framework that explains why this is so much better than bubble sort's O(n²). Without Big-O, 'n log n vs n²' is just symbols.",
    recursion:
      "Each recursive call adds a frame to the call stack. Big-O helps you reason about how many calls that is and how much memory is used. Space complexity — the memory cost of recursion — is a direct application of Big-O thinking.",
  },
};

// ─── Input schemas ───────────────────────────────────────────────────────────

const DiagnoseInputSchema = z.object({
  question: z.string().min(1),
});

const NodeInputSchema = z.object({
  node_id: z.string().min(1),
});

const TeachInputSchema = z.object({
  node_id: z.string().min(1),
  asked_node_id: z.string().optional(),
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

/** POST /api/teach — four-section lesson: original topic + diagnosis + prerequisite + connection */
router.post("/teach", async (req, res) => {
  console.log("[MindBridge] POST /api/teach received");
  try {
    const parsed = TeachInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "node_id is required" });
      return;
    }

    const graph = await getGraph();
    const prereqNode = findNode(graph, parsed.data.node_id);
    if (!prereqNode) {
      res.status(404).json({ error: `Node '${parsed.data.node_id}' not found` });
      return;
    }

    // Look up the topic the student originally asked about (may be absent or same as prereq)
    const askedNodeId = parsed.data.asked_node_id;
    const originalNode =
      askedNodeId && askedNodeId !== parsed.data.node_id
        ? findNode(graph, askedNodeId)
        : null;

    // Connection text for this prerequisite → asked topic pair
    const connection =
      askedNodeId && CONNECTIONS[parsed.data.node_id]?.[askedNodeId]
        ? CONNECTIONS[parsed.data.node_id][askedNodeId]
        : null;

    console.log(
      `[MindBridge] POST /api/teach — prereq: ${prereqNode.id}, asked: ${askedNodeId ?? "none"}, connection: ${connection ? "yes" : "none"}`,
    );

    res.json({
      // Prerequisite (the gap to teach)
      node_id: prereqNode.id,
      label: prereqNode.label,
      explanation: prereqNode.teaching.explanation,
      why_it_exists: prereqNode.teaching.why_it_exists ?? null,
      analogy: prereqNode.teaching.analogy,
      common_mistakes: prereqNode.teaching.common_mistakes ?? [],
      applications: prereqNode.teaching.applications ?? [],
      complexity: prereqNode.teaching.complexity ?? null,
      // Original topic (what the student asked about)
      ...(originalNode && {
        original_topic_node_id: originalNode.id,
        original_topic_label: originalNode.label,
        original_topic_explanation: originalNode.teaching.explanation,
        original_topic_analogy: originalNode.teaching.analogy,
      }),
      // Conceptual bridge
      ...(connection && { connection }),
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
