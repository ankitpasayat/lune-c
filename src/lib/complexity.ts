/**
 * Complexity estimator for C code.
 *
 * Goes beyond pure regex by using brace-matched function-body extraction,
 * recursive-call argument analysis, and structural pattern classification
 * to identify algorithm families (quicksort, tree traversal, merge sort,
 * binary search, fibonacci, backtracking, etc.).
 *
 * Still heuristic — not a real static analysis pass.
 */

interface ComplexityResult {
  time: string;
  space: string;
}

export function estimateComplexity(code: string): ComplexityResult {
  // Strip comments and string literals to avoid false matches
  const stripped = code
    .replace(/\/\/.*$/gm, "")           // line comments
    .replace(/\/\*[\s\S]*?\*\//g, "")   // block comments
    .replace(/"(?:[^"\\]|\\.)*"/g, '""') // string literals
    .replace(/'(?:[^'\\]|\\.)*'/g, "''"); // char literals

  return { time: estimateTime(stripped), space: estimateSpace(stripped) };
}

// ---------------------------------------------------------------------------
// Structural helpers
// ---------------------------------------------------------------------------

const SKIP_NAMES = new Set([
  "if", "while", "for", "switch", "do", "else", "main", "sizeof", "return",
]);

interface FuncBody {
  name: string;
  body: string; // text between the outermost { }
}

/** Extract function definitions with brace-matched bodies. */
function extractFunctions(code: string): FuncBody[] {
  const results: FuncBody[] = [];
  const re = /\b(\w+)\s*\([^)]*\)\s*\{/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(code)) !== null) {
    if (SKIP_NAMES.has(m[1])) continue;

    // The match ends with '{', so it's at this position:
    const bracePos = m.index + m[0].length - 1;

    // Brace-match to find the complete body
    let depth = 1;
    let i = bracePos + 1;
    while (i < code.length && depth > 0) {
      if (code[i] === "{") depth++;
      else if (code[i] === "}") depth--;
      i++;
    }

    results.push({ name: m[1], body: code.substring(bracePos + 1, i - 1) });
  }
  return results;
}

interface RecursiveCall {
  pos: number;  // position in body string
  args: string; // paren-matched argument text
}

/** Find self-recursive calls with paren-matched argument extraction. */
function findRecursiveCalls(body: string, funcName: string): RecursiveCall[] {
  const calls: RecursiveCall[] = [];
  const re = new RegExp(`\\b${funcName}\\s*\\(`, "g");
  let m: RegExpExecArray | null;

  while ((m = re.exec(body)) !== null) {
    const argStart = m.index + m[0].length;
    let depth = 1;
    let i = argStart;
    while (i < body.length && depth > 0) {
      if (body[i] === "(") depth++;
      else if (body[i] === ")") depth--;
      i++;
    }
    calls.push({ pos: m.index, args: body.substring(argStart, i - 1) });
  }
  return calls;
}

/**
 * Count effective (non-mutually-exclusive) recursive calls.
 *
 * Return-guarded calls (`return f(...)`) are mutually exclusive —
 * at most one executes per frame.  We count them as a single call.
 * Non-guarded calls can all execute, so each counts individually.
 */
function countEffectiveCalls(calls: RecursiveCall[], body: string): number {
  if (calls.length <= 1) return calls.length;

  let returnGuarded = 0;
  let nonGuarded = 0;

  for (const { pos } of calls) {
    const before = body.substring(Math.max(0, pos - 30), pos).trimEnd();
    if (/\breturn$/.test(before)) {
      returnGuarded++;
    } else {
      nonGuarded++;
    }
  }

  // At most one return-guarded call can execute per frame
  return nonGuarded + Math.min(returnGuarded, 1);
}

/**
 * Classify recursive call argument patterns to identify algorithm family.
 *
 * Instead of guessing from the function body, we look at *what arguments
 * are actually passed* to the recursive calls — this is far more reliable
 * than scanning for `/2` or `mid` in the body.
 */
function classifyArgs(
  calls: RecursiveCall[],
): "pointer" | "partition" | "divide" | "decrement" | "unknown" {
  if (calls.length === 0) return "unknown";

  const joined = calls.map((c) => c.args).join(" ");

  // Pointer traversal: node->left, node->right
  if (calls.some((c) => /->/.test(c.args))) return "pointer";

  // Divide: explicit /2 in arguments (e.g. n/2, size/2)
  if (calls.some((c) => /\/\s*2/.test(c.args))) return "divide";

  // Partition: range-variable names + different argument lists
  if (calls.length >= 2) {
    const hasRangeVars =
      /\b(?:lo|low|left|l|start|begin)\b/i.test(joined) &&
      /\b(?:hi|high|right|r|end)\b/i.test(joined);
    const uniqueArgs = new Set(calls.map((c) => c.args.replace(/\s+/g, "")));
    if (hasRangeVars && uniqueArgs.size >= 2) return "partition";
  }

  // Decrement: every call has at least one arg of the form `var - const`
  if (
    calls.length >= 2 &&
    calls.every((c) =>
      c.args.split(",").some((a) => /^\s*\w+\s*-\s*\d+\s*$/.test(a)),
    )
  )
    return "decrement";

  return "unknown";
}

/**
 * Detect backtracking / factorial-class patterns.
 *
 * The signature: a for/while loop whose body contains a recursive call.
 * This means at each recursion level we branch by a loop-sized factor,
 * giving O(n!) or O(k^n) complexity.
 */
function detectBacktracking(body: string, funcName: string): boolean {
  // Find all for/while loops in the body and check if any contain a
  // recursive call.  We use brace-matching to get each loop's body.
  const loopRe = /\b(?:for|while)\s*\(/g;
  let m: RegExpExecArray | null;

  while ((m = loopRe.exec(body)) !== null) {
    // Skip past the condition parentheses
    let depth = 1;
    let i = body.indexOf("(", m.index) + 1;
    while (i < body.length && depth > 0) {
      if (body[i] === "(") depth++;
      else if (body[i] === ")") depth--;
      i++;
    }
    // Now i is right after the closing ) of the loop condition.
    // Find the loop body — either a braced block or a single statement.
    const afterParen = body.substring(i).trimStart();
    let loopBody: string;

    if (afterParen.startsWith("{")) {
      const braceStart = i + (body.substring(i).indexOf("{"));
      depth = 1;
      let j = braceStart + 1;
      while (j < body.length && depth > 0) {
        if (body[j] === "{") depth++;
        else if (body[j] === "}") depth--;
        j++;
      }
      loopBody = body.substring(braceStart + 1, j - 1);
    } else {
      // Single-statement loop body (up to next semicolon)
      const semiPos = body.indexOf(";", i);
      loopBody = semiPos >= 0 ? body.substring(i, semiPos + 1) : "";
    }

    // Check if the loop body contains a recursive call
    if (new RegExp(`\\b${funcName}\\s*\\(`).test(loopBody)) {
      return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Time complexity
// ---------------------------------------------------------------------------

/**
 * Detect mutual recursion: f calls g, g calls f.
 * Returns the set of function names involved in any mutually-recursive cycle.
 */
function findMutuallyRecursive(funcs: FuncBody[]): Set<string> {
  const nameSet = new Set(funcs.map((f) => f.name));
  // Build call graph: which other extracted functions does each func call?
  const callGraph = new Map<string, Set<string>>();
  for (const func of funcs) {
    const callees = new Set<string>();
    for (const other of funcs) {
      if (other.name === func.name) continue;
      if (new RegExp(`\\b${other.name}\\s*\\(`).test(func.body)) {
        callees.add(other.name);
      }
    }
    callGraph.set(func.name, callees);
  }
  // Find cycles: for each function, check if there's a path back to itself
  const mutual = new Set<string>();
  for (const start of nameSet) {
    const visited = new Set<string>();
    const stack = [...(callGraph.get(start) || [])];
    while (stack.length > 0) {
      const cur = stack.pop()!;
      if (cur === start) { mutual.add(start); break; }
      if (visited.has(cur)) continue;
      visited.add(cur);
      for (const next of callGraph.get(cur) || []) {
        stack.push(next);
      }
    }
  }
  return mutual;
}

function estimateTime(code: string): string {
  const funcs = extractFunctions(code);

  // Analyse recursion across all non-main functions
  let isRecursive = false;
  let effectiveCalls = 0;
  let hasDividePattern = false;
  let hasLoopInBody = false;
  let isBacktracking = false;
  let argPattern: ReturnType<typeof classifyArgs> = "unknown";

  // Check for mutual recursion
  const mutualSet = findMutuallyRecursive(funcs);
  if (mutualSet.size > 0) {
    isRecursive = true;
    // Mutual recursion is at least linear; analyse the bodies involved
    for (const func of funcs) {
      if (!mutualSet.has(func.name)) continue;
      if (/(?:\/\s*2|\bmid\b)/.test(func.body)) hasDividePattern = true;
      if (/\b(?:for|while|do)\s*[({]/.test(func.body)) hasLoopInBody = true;
      // Count cross-calls as effective branches
      let crossCalls = 0;
      for (const other of funcs) {
        if (other.name === func.name) continue;
        if (mutualSet.has(other.name) && new RegExp(`\\b${other.name}\\s*\\(`).test(func.body)) {
          crossCalls++;
        }
      }
      effectiveCalls = Math.max(effectiveCalls, crossCalls);
    }
  }

  for (const func of funcs) {
    const calls = findRecursiveCalls(func.body, func.name);
    if (calls.length === 0) continue;

    isRecursive = true;
    const ec = countEffectiveCalls(calls, func.body);
    effectiveCalls = Math.max(effectiveCalls, ec);

    if (/(?:\/\s*2|\bmid\b)/.test(func.body)) hasDividePattern = true;
    if (/\b(?:for|while|do)\s*[({]/.test(func.body)) hasLoopInBody = true;
    if (detectBacktracking(func.body, func.name)) isBacktracking = true;

    const ap = classifyArgs(calls);
    if (ap !== "unknown") argPattern = ap;
  }

  // Loop-based analysis
  const maxLoopDepth = getMaxLoopDepth(code);

  const hasLogPattern =
    /\b\w+\s*(?:\*=\s*2|\/=\s*2|>>=\s*\d+|<<=\s*\d+)/.test(code) ||
    /for\s*\([^;]*;[^;]*;\s*\w+\s*\*=\s*\d/.test(code) ||
    /for\s*\([^;]*;[^;]*;\s*\w+\s*\/=\s*\d/.test(code) ||
    (/\bmid\b/.test(code) &&
      /\/\s*2/.test(code) &&
      /\b(?:low|high|left|right|lo|hi|start|end)\b/.test(code));

  // ---- Classification ----

  if (isRecursive) {
    // Backtracking: loop drives recursion → factorial-class
    if (isBacktracking) return "O(n!)";

    if (effectiveCalls >= 2) {
      // Multi-branch recursion
      if (hasDividePattern) return "O(n log n)";        // merge sort
      if (argPattern === "pointer") return "O(n)";       // tree traversal
      if (argPattern === "partition") return "O(n log n)"; // quicksort
      if (hasLoopInBody) return "O(n log n)";            // partition-like
      if (argPattern === "decrement") return "O(2^n)";   // fibonacci
      return "O(2^n)"; // conservative default
    }

    // Single effective recursive call
    if (hasDividePattern || argPattern === "divide" || argPattern === "pointer") return "O(log n)";
    return "O(n)"; // linear recursion
  }

  if (maxLoopDepth === 0) return "O(1)";

  if (hasLogPattern && maxLoopDepth === 1) return "O(log n)";
  if (hasLogPattern && maxLoopDepth === 2) return "O(n log n)";

  if (maxLoopDepth === 1) return "O(n)";
  if (maxLoopDepth === 2) return "O(n²)";
  if (maxLoopDepth === 3) return "O(n³)";
  return `O(n^${maxLoopDepth})`;
}

// ---------------------------------------------------------------------------
// Space complexity
// ---------------------------------------------------------------------------

function estimateSpace(code: string): string {
  const hasMalloc = /\b(?:malloc|calloc|realloc)\s*\(/.test(code);
  const hasVLA = /\b\w+\s+\w+\[(?![\d\]]).+\]/.test(code);

  const funcs = extractFunctions(code);
  let isRecursive = false;
  let hasLogDepthRecursion = false;

  for (const func of funcs) {
    const calls = findRecursiveCalls(func.body, func.name);
    if (calls.length === 0) continue;

    isRecursive = true;
    if (/(?:\/\s*2|\bmid\b)/.test(func.body)) hasLogDepthRecursion = true;

    const ap = classifyArgs(calls);
    if (ap === "partition" || ap === "divide") hasLogDepthRecursion = true;

    // Return-guarded pointer traversal (BST search) has log depth
    if (ap === "pointer") {
      const ec = countEffectiveCalls(calls, func.body);
      if (ec <= 1) hasLogDepthRecursion = true;
    }
  }

  const fixedArrays = code.match(/\b\w+\s+\w+\[\d+\]/g);
  const hasLargeArray = fixedArrays?.some((a) => {
    const size = parseInt(a.match(/\[(\d+)\]/)?.[1] || "0");
    return size > 100;
  });

  if (isRecursive && hasLogDepthRecursion) return "O(log n)";
  if (isRecursive) return "O(n)";
  if (hasMalloc || hasVLA) return "O(n)";
  if (hasLargeArray) return "O(n)";
  return "O(1)";
}

function getMaxLoopDepth(code: string): number {
  let maxDepth = 0;

  // Find loop keywords and locate where their condition parentheses end
  // Includes do...while by finding the { after 'do'
  const loopRegex = /\b(?:for|while)\s*\(/g;
  const doRegex = /\bdo\s*\{/g;
  const loopCondEnds: number[] = [];
  const doLoopBraces: number[] = [];

  // Collect do...while loop brace positions
  let dm: RegExpExecArray | null;
  while ((dm = doRegex.exec(code)) !== null) {
    const bracePos = code.indexOf("{", dm.index);
    if (bracePos >= 0) doLoopBraces.push(bracePos);
  }

  let m: RegExpExecArray | null;
  while ((m = loopRegex.exec(code)) !== null) {
    const parenStart = code.indexOf("(", m.index);
    if (parenStart === -1) continue;
    let depth = 1;
    let i = parenStart + 1;
    while (i < code.length && depth > 0) {
      if (code[i] === "(") depth++;
      else if (code[i] === ")") depth--;
      i++;
    }
    loopCondEnds.push(i); // position right after the closing )
  }

  // Build combined token list with loop-condition-end markers and braces
  type Token =
    | { type: "loopEnd"; pos: number }
    | { type: "open" | "close"; pos: number };
  const tokens: Token[] = loopCondEnds.map((pos) => ({
    type: "loopEnd" as const,
    pos,
  }));

  for (let i = 0; i < code.length; i++) {
    if (code[i] === "{") tokens.push({ type: "open", pos: i });
    else if (code[i] === "}") tokens.push({ type: "close", pos: i });
  }

  tokens.sort((a, b) => a.pos - b.pos);

  // Track loop depth — only count a { as a loop brace if it immediately
  // follows a loop condition's closing ) or is a do{ brace
  let loopDepth = 0;
  let lastLoopEnd = -1;
  const braceStack: boolean[] = [];
  const doLoopSet = new Set(doLoopBraces);

  for (const tok of tokens) {
    if (tok.type === "loopEnd") {
      lastLoopEnd = tok.pos;
    } else if (tok.type === "open") {
      const isForWhileBrace =
        lastLoopEnd >= 0 &&
        code.substring(lastLoopEnd, tok.pos).trim() === "";
      const isDoLoopBrace = doLoopSet.has(tok.pos);
      lastLoopEnd = -1;
      if (isForWhileBrace || isDoLoopBrace) {
        loopDepth++;
        braceStack.push(true);
      } else {
        braceStack.push(false);
      }
      if (loopDepth > maxDepth) maxDepth = loopDepth;
    } else if (tok.type === "close") {
      lastLoopEnd = -1;
      const wasLoop = braceStack.pop();
      if (wasLoop) loopDepth--;
    }
  }

  // Handle braceless loops (for/while/do with no { after condition)
  if (maxDepth === 0 && (loopCondEnds.length > 0 || doLoopBraces.length > 0)) {
    maxDepth = 1;
  }

  // Handle nested braceless loops by counting consecutive loop keywords
  // that are not separated by braces (e.g. for(...)\n  for(...)\n    stmt;)
  const bracelessLoopRe = /\b(?:for|while)\s*\([^)]*\)\s*\n/g;
  let bm: RegExpExecArray | null;
  while ((bm = bracelessLoopRe.exec(code)) !== null) {
    let consecutiveDepth = 1;
    let pos = bm.index + bm[0].length;
    // Look ahead for more braceless loop starts
    const nextLoopRe = /^\s*(?:for|while)\s*\([^)]*\)\s*\n/;
    let remaining = code.substring(pos);
    while (nextLoopRe.test(remaining)) {
      consecutiveDepth++;
      const match = remaining.match(nextLoopRe)!;
      remaining = remaining.substring(match[0].length);
    }
    if (consecutiveDepth > maxDepth) maxDepth = consecutiveDepth;
  }

  return maxDepth;
}
