/**
 * Simple heuristic-based Big-O complexity estimator for C code.
 * This is NOT a real static analysis — it uses pattern matching
 * on common loop/recursion patterns to give a rough estimate.
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

  const time = estimateTime(stripped);
  const space = estimateSpace(stripped);

  return { time, space };
}

function estimateTime(code: string): string {
  // Detect recursion (function calls its own name inside its body)
  const funcMatch = code.match(/\b(\w+)\s*\([^)]*\)\s*\{/g);
  const funcNames = funcMatch
    ?.map((m) => m.match(/\b(\w+)\s*\(/)?.[1])
    .filter((n): n is string => !!n && n !== "main" && n !== "if" && n !== "while" && n !== "for" && n !== "switch");

  let isRecursive = false;
  let hasDividePattern = false;
  if (funcNames) {
    for (const name of funcNames) {
      // Check if function body contains a call to itself
      const bodyRegex = new RegExp(
        `\\b${name}\\s*\\([^)]*\\)\\s*\\{([\\s\\S]*?)\\n\\}`,
      );
      const bodyMatch = code.match(bodyRegex);
      if (bodyMatch) {
        const body = bodyMatch[1];
        const callRegex = new RegExp(`\\b${name}\\s*\\(`);
        if (callRegex.test(body)) {
          isRecursive = true;
          // Check for divide-and-conquer pattern (n/2, mid, etc.)
          if (/\b(?:n\s*\/\s*2|mid|len\s*\/\s*2|size\s*\/\s*2|right|left)/.test(body)) {
            hasDividePattern = true;
          }
        }
      }
    }
  }

  // Count max loop nesting depth
  const maxLoopDepth = getMaxLoopDepth(code);

  // Check for common logarithmic patterns inside loops
  const hasLogPattern =
    /(?:i\s*\*=\s*2|i\s*\/=\s*2|i\s*>>=\s*1|i\s*<<=\s*1|>>|<<)/.test(code) ||
    /for\s*\([^;]*;[^;]*;\s*\w+\s*\*=\s*\d/.test(code) ||
    /for\s*\([^;]*;[^;]*;\s*\w+\s*\/=\s*\d/.test(code);

  // Determine time complexity
  if (isRecursive && hasDividePattern && maxLoopDepth >= 1) {
    return "O(n log n)";
  }
  if (isRecursive && hasDividePattern) {
    return "O(log n)";
  }
  if (isRecursive) {
    return "O(2^n)"; // conservative for simple recursion
  }

  if (maxLoopDepth === 0) {
    return "O(1)";
  }

  if (hasLogPattern && maxLoopDepth === 1) {
    return "O(log n)";
  }
  if (hasLogPattern && maxLoopDepth === 2) {
    return "O(n log n)";
  }

  if (maxLoopDepth === 1) return "O(n)";
  if (maxLoopDepth === 2) return "O(n²)";
  if (maxLoopDepth === 3) return "O(n³)";
  return `O(n^${maxLoopDepth})`;
}

function estimateSpace(code: string): string {
  // Check for dynamic allocation
  const hasMalloc = /\b(?:malloc|calloc|realloc)\s*\(/.test(code);
  const hasVLA = /\b\w+\s+\w+\[(?![\d\]]).+\]/.test(code); // variable-length array

  // Check for recursion (implies stack space)
  const funcMatch = code.match(/\b(\w+)\s*\([^)]*\)\s*\{/g);
  const funcNames = funcMatch
    ?.map((m) => m.match(/\b(\w+)\s*\(/)?.[1])
    .filter((n): n is string => !!n && n !== "main" && n !== "if" && n !== "while" && n !== "for" && n !== "switch");

  let isRecursive = false;
  if (funcNames) {
    for (const name of funcNames) {
      const bodyRegex = new RegExp(
        `\\b${name}\\s*\\([^)]*\\)\\s*\\{([\\s\\S]*?)\\n\\}`,
      );
      const bodyMatch = code.match(bodyRegex);
      if (bodyMatch) {
        const body = bodyMatch[1];
        if (new RegExp(`\\b${name}\\s*\\(`).test(body)) {
          isRecursive = true;
        }
      }
    }
  }

  // Check for fixed-size arrays
  const fixedArrays = code.match(/\b\w+\s+\w+\[\d+\]/g);
  const hasLargeArray = fixedArrays?.some((a) => {
    const size = parseInt(a.match(/\[(\d+)\]/)?.[1] || "0");
    return size > 100;
  });

  if (isRecursive) return "O(n)"; // stack frames
  if (hasMalloc || hasVLA) return "O(n)";
  if (hasLargeArray) return "O(n)";
  return "O(1)";
}

function getMaxLoopDepth(code: string): number {
  // Simple brace-counting approach to find max loop nesting
  let maxDepth = 0;
  let currentDepth = 0;
  const loopRegex = /\b(?:for|while|do)\s*[\({]/g;

  // Tokenize into loop-starts and braces
  const tokens: { type: "loop" | "open" | "close"; pos: number }[] = [];

  let m: RegExpExecArray | null;
  while ((m = loopRegex.exec(code)) !== null) {
    tokens.push({ type: "loop", pos: m.index });
  }

  for (let i = 0; i < code.length; i++) {
    if (code[i] === "{") tokens.push({ type: "open", pos: i });
    else if (code[i] === "}") tokens.push({ type: "close", pos: i });
  }

  tokens.sort((a, b) => a.pos - b.pos);

  // Track which braces belong to loops
  let loopDepth = 0;
  let expectBrace = false;
  const braceStack: boolean[] = []; // true = this brace level is a loop

  for (const tok of tokens) {
    if (tok.type === "loop") {
      expectBrace = true;
    } else if (tok.type === "open") {
      if (expectBrace) {
        loopDepth++;
        braceStack.push(true);
        expectBrace = false;
      } else {
        braceStack.push(false);
      }
      if (loopDepth > maxDepth) maxDepth = loopDepth;
    } else if (tok.type === "close") {
      const wasLoop = braceStack.pop();
      if (wasLoop) loopDepth--;
    }
  }

  // Also handle single-line for loops without braces (for(;;) for(;;) stmt;)
  // Count sequential for/while on same indentation with no brace
  const forNoBrace = code.match(/for\s*\([^)]*\)\s*\n\s*for/g);
  if (forNoBrace) {
    currentDepth = forNoBrace.length + 1;
    if (currentDepth > maxDepth) maxDepth = currentDepth;
  }

  return maxDepth;
}
