/** Shared node metadata used across the frontend */

/**
 * First-level prerequisites for each node, mirroring graph.json.
 * Used by the direct-learn flow to surface optional prereq hints
 * without calling the API.
 */
export const NODE_PREREQUISITES: Record<string, string[]> = {
  data_structures:             ["variables_and_data_types"],
  variables_and_data_types:    [],
  arrays:                      ["variables_and_data_types"],
  loops:                       ["variables_and_data_types"],
  linear_search:               ["arrays", "loops"],
  sorted_arrays:               ["arrays", "loops"],
  binary_search:               ["sorted_arrays", "divide_and_conquer"],
  divide_and_conquer:          ["recursion"],
  basic_sorting:               ["arrays", "loops"],
  recursion:                   ["loops"],
  base_case_and_recursive_case: ["recursion"],
  merge_sort:                  ["recursion", "basic_sorting", "divide_and_conquer"],
  stacks:                      ["arrays"],
  big_o_time_complexity:       ["loops"],
  trees_intro:                 ["recursion", "stacks"],
  tree_traversal:              ["trees_intro", "recursion"],
};

export const NODE_LABELS: Record<string, string> = {
  data_structures: "Data Structures",
  variables_and_data_types: "Variables & Data Types",
  arrays: "Arrays",
  loops: "Loops",
  linear_search: "Linear Search",
  sorted_arrays: "Sorted Arrays",
  binary_search: "Binary Search",
  divide_and_conquer: "Divide & Conquer",
  basic_sorting: "Basic Sorting",
  merge_sort: "Merge Sort",
  recursion: "Recursion",
  base_case_and_recursive_case: "Base Case & Recursive Case",
  stacks: "Stacks",
  big_o_time_complexity: "Big-O / Time Complexity",
  trees_intro: "Trees (Intro)",
  tree_traversal: "Tree Traversal",
};

export interface NodeCategory {
  label: string;
  emoji: string;
  nodeIds: string[];
}

export const NODE_CATEGORIES: NodeCategory[] = [
  { label: "Fundamentals", emoji: "⚙️", nodeIds: ["variables_and_data_types", "arrays", "loops", "stacks"] },
  { label: "Searching", emoji: "🔍", nodeIds: ["linear_search", "sorted_arrays", "binary_search"] },
  { label: "Complexity", emoji: "📈", nodeIds: ["big_o_time_complexity", "divide_and_conquer"] },
  { label: "Recursion", emoji: "🔁", nodeIds: ["recursion", "base_case_and_recursive_case"] },
  { label: "Sorting", emoji: "🗂️", nodeIds: ["basic_sorting", "merge_sort"] },
  { label: "Trees", emoji: "🌲", nodeIds: ["trees_intro", "tree_traversal"] },
];

export interface NodeContent {
  codeExample: string;
  codeLanguage: string;
  keyTakeaway: string;
}

export const NODE_CONTENT: Record<string, NodeContent> = {
  data_structures: {
    codeExample: `// Arrays — O(1) access by index
const scores = [95, 87, 92];
console.log(scores[1]); // 87

// Stack — Last-In First-Out
const stack = [];
stack.push("A"); stack.push("B");
stack.pop(); // "B" removed

// Object (Hash Map) — O(1) lookup by key
const lookup = { alice: 95, bob: 87 };
console.log(lookup["alice"]); // 95

// Each structure makes different trade-offs:
// Array  → fast index access, slow middle insert
// Stack  → fast push/pop, no random access
// Hash   → fast key lookup, unordered`,
    codeLanguage: "JavaScript",
    keyTakeaway: "A data structure is a contract: it defines which operations are fast and which are slow. Picking the right one for your problem is what separates good code from slow code.",
  },
  variables_and_data_types: {
    codeExample: `// Variables hold data of different types
let name = "Alice";        // string
let age = 25;              // number
let isStudent = true;      // boolean
let scores = [95, 87, 92]; // array

console.log(typeof name);  // "string"
console.log(typeof age);   // "number"`,
    codeLanguage: "JavaScript",
    keyTakeaway: "Every value has a type. Knowing the type determines which operations are valid — you cannot sort text the same way you sort numbers.",
  },
  arrays: {
    codeExample: `// Arrays store items at numbered positions (indices)
const fruits = ["apple", "banana", "cherry"];
//                  0         1         2   ← index

// Access by index (starts at 0)
console.log(fruits[0]);  // "apple"
console.log(fruits[2]);  // "cherry"
console.log(fruits.length); // 3`,
    codeLanguage: "JavaScript",
    keyTakeaway: "Arrays give you O(1) access by index — [5] is just as fast as [5,000,000]. The trade-off: inserting or deleting in the middle requires shifting elements, which is O(n).",
  },
  loops: {
    codeExample: `// Loops repeat code for each element
const nums = [10, 20, 30, 40, 50];

for (let i = 0; i < nums.length; i++) {
  console.log(\`Index \${i}: \${nums[i]}\`);
}
// Index 0: 10
// Index 1: 20
// ...

// Cleaner when index isn't needed:
for (const n of nums) console.log(n);`,
    codeLanguage: "JavaScript",
    keyTakeaway: "Loops are the engine behind O(n) algorithms. Nested loops multiply complexity: two nested loops over n items = O(n²) — which gets slow fast.",
  },
  linear_search: {
    codeExample: `// Check every element one by one until found
function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i; // found!
  }
  return -1; // not found
}

// Works on ANY array — sorted or unsorted
linearSearch([8, 2, 9, 1, 5], 9); // returns 2`,
    codeLanguage: "JavaScript",
    keyTakeaway: "Linear search is O(n) — in the worst case it checks every element. It works on unsorted data, but if your data is sorted, binary search does the same job in O(log n).",
  },
  sorted_arrays: {
    codeExample: `// Sorting unlocks faster algorithms
const unsorted = [8, 2, 9, 1, 5];
const sorted = [...unsorted].sort((a, b) => a - b);
console.log(sorted); // [1, 2, 5, 8, 9]

// Now binary search works:
// Middle = 5. Looking for 8?
// 8 > 5 → search right half [8, 9] only
// Found in 2 steps instead of checking all 5!`,
    codeLanguage: "JavaScript",
    keyTakeaway: "A sorted array is the prerequisite for binary search. Without sorted order, you cannot safely eliminate half the elements at each step — you would miss the target.",
  },
  binary_search: {
    codeExample: `// Eliminate half the data at each step
function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;    // found
    if (arr[mid] < target) left = mid + 1; // go right
    else right = mid - 1;                  // go left
  }
  return -1; // not found
}

// arr MUST be sorted first!
binarySearch([1, 2, 5, 8, 9], 8); // returns 3`,
    codeLanguage: "JavaScript",
    keyTakeaway: "Binary search is O(log n) because the search space halves every step. Searching 1,000,000 items takes at most 20 steps. Requirement: the array must be sorted.",
  },
  recursion: {
    codeExample: `// A function that calls itself on a smaller problem
function factorial(n) {
  if (n <= 1) return 1;          // base case — stop!
  return n * factorial(n - 1);   // recursive case
}

// factorial(4) works like this:
// 4 × factorial(3)
//   3 × factorial(2)
//     2 × factorial(1)
//       → 1 (base case)
//     → 2 × 1 = 2
//   → 3 × 2 = 6
// → 4 × 6 = 24`,
    codeLanguage: "JavaScript",
    keyTakeaway: "Every recursive function needs exactly two things: a base case that stops the recursion, and a recursive case that shrinks the problem. Missing either causes wrong answers or a stack overflow.",
  },
  base_case_and_recursive_case: {
    codeExample: `function countdown(n) {
  // ✅ BASE CASE — stops recursion
  if (n <= 0) { console.log("Done!"); return; }

  // ✅ RECURSIVE CASE — problem gets smaller
  console.log(n);
  countdown(n - 1); // n decreases every call
}

// ❌ BROKEN — no base case = infinite loop!
function broken(n) {
  console.log(n);
  broken(n - 1); // never stops → stack overflow
}`,
    codeLanguage: "JavaScript",
    keyTakeaway: "The base case is not optional — it prevents infinite recursion. Every recursive call must move the problem closer to the base case, or you will get a stack overflow error.",
  },
  stacks: {
    codeExample: `// Stack: Last In, First Out (LIFO)
const stack = [];

stack.push("A"); // [A]
stack.push("B"); // [A, B]
stack.push("C"); // [A, B, C]

// Peek at top
stack[stack.length - 1]; // "C"

// Pop removes from the TOP
stack.pop(); // "C" removed → [A, B]
stack.pop(); // "B" removed → [A]

// Real use: browser back button, undo, call stack`,
    codeLanguage: "JavaScript",
    keyTakeaway: "Stacks enforce Last-In-First-Out order. Your browser's back button, undo history, function call tracking, and expression parsing all rely on this LIFO property.",
  },
  big_o_time_complexity: {
    codeExample: `// O(1) — constant time, always 1 step
function getFirst(arr) { return arr[0]; }

// O(log n) — halves the problem each step
function binarySearch(arr, t) { /* ... */ }

// O(n) — one step per element
function sum(arr) {
  let total = 0;
  for (const n of arr) total += n;
  return total;
}

// O(n²) — nested loops
function hasDuplicate(arr) {
  for (let i = 0; i < arr.length; i++)
    for (let j = i + 1; j < arr.length; j++)
      if (arr[i] === arr[j]) return true;
  return false;
}`,
    codeLanguage: "JavaScript",
    keyTakeaway: "Big-O describes how runtime grows as input size grows — not the actual milliseconds. O(log n) vs O(n) on 1,000,000 items: 20 steps vs 1,000,000 steps. This difference is why algorithm choice matters.",
  },
  divide_and_conquer: {
    codeExample: `// Pattern: divide the problem → solve halves → combine
function mergeSort(arr) {
  if (arr.length <= 1) return arr; // base case

  // 1. DIVIDE: split in half
  const mid = Math.floor(arr.length / 2);

  // 2. CONQUER: solve each half recursively
  const left  = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));

  // 3. COMBINE: merge the two sorted halves
  return merge(left, right); // O(n) merge step
}
// Total: O(n log n) — log n levels, O(n) work each`,
    codeLanguage: "JavaScript",
    keyTakeaway: "Divide & Conquer turns an O(n²) problem into O(n log n) by splitting it into independent subproblems. Binary search, merge sort, and quick sort all use this pattern.",
  },
  basic_sorting: {
    codeExample: `// Bubble sort: repeatedly swap adjacent elements
function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        // Swap neighbours if out of order
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}
// [64, 34, 25, 12] → [12, 25, 34, 64]
// Time: O(n²) — slow, but easy to understand`,
    codeLanguage: "JavaScript",
    keyTakeaway: "Bubble sort's O(n²) complexity shows why algorithm choice matters. Understanding its nested loops helps you recognise why merge sort's O(n log n) is so much better for large datasets.",
  },
  merge_sort: {
    codeExample: `function merge(left, right) {
  const result = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) result.push(left[i++]);
    else result.push(right[j++]);
  }
  return [...result, ...left.slice(i), ...right.slice(j)];
}

function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  return merge(
    mergeSort(arr.slice(0, mid)),  // sort left
    mergeSort(arr.slice(mid))      // sort right
  );
}`,
    codeLanguage: "JavaScript",
    keyTakeaway: "Merge sort achieves O(n log n) — the theoretical best for comparison-based sorting. It uses divide & conquer: recursively split to single elements, then merge back in sorted order.",
  },
  trees_intro: {
    codeExample: `// A tree node holds a value and links to children
class TreeNode {
  constructor(value) {
    this.value = value;
    this.left  = null;
    this.right = null;
  }
}

// Build a small binary tree:
//        5
//       / \\
//      3   8
//     / \\
//    1   4
const root    = new TreeNode(5);
root.left     = new TreeNode(3);
root.right    = new TreeNode(8);
root.left.left  = new TreeNode(1);
root.left.right = new TreeNode(4);`,
    codeLanguage: "JavaScript",
    keyTakeaway: "Trees are hierarchical — each node has one parent and any number of children. A balanced binary tree enables O(log n) search, insert, and delete: the foundation of databases and file systems.",
  },
  tree_traversal: {
    codeExample: `// Three orders to visit every node exactly once
function inorder(node) {    // Left → Root → Right
  if (!node) return;
  inorder(node.left);
  console.log(node.value);  // visit root in middle
  inorder(node.right);
}

function preorder(node) {   // Root → Left → Right
  if (!node) return;
  console.log(node.value);  // visit root first
  preorder(node.left);
  preorder(node.right);
}

// Inorder on a BST prints values in sorted order!`,
    codeLanguage: "JavaScript",
    keyTakeaway: "Inorder traversal of a Binary Search Tree always produces elements in sorted order. All traversals are O(n) — every node must be visited exactly once.",
  },
};
