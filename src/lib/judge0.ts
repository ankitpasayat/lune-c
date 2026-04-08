const JUDGE0_URL = process.env.JUDGE0_URL || "http://localhost:2358";

interface SubmissionRequest {
  source_code: string;
  language_id: number; // 50 = C (GCC 9.2.0), 75 = C (Clang 7.0.1)
  stdin?: string;
  expected_output?: string;
  cpu_time_limit?: number;
  memory_limit?: number;
}

interface SubmissionResult {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  status: {
    id: number;
    description: string;
  };
  time: string | null;
  memory: number | null;
}

// Language ID for C (GCC) in Judge0
export const C_LANGUAGE_ID = 50;

export async function createSubmission(
  req: SubmissionRequest
): Promise<string> {
  const res = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=true&wait=false`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source_code: Buffer.from(req.source_code).toString("base64"),
      language_id: req.language_id,
      stdin: req.stdin ? Buffer.from(req.stdin).toString("base64") : undefined,
      expected_output: req.expected_output
        ? Buffer.from(req.expected_output).toString("base64")
        : undefined,
      cpu_time_limit: req.cpu_time_limit ?? 5,
      memory_limit: req.memory_limit ?? 262144, // 256MB in KB
    }),
  });

  if (!res.ok) {
    throw new Error(`Judge0 submission failed: ${res.status}`);
  }

  const data = await res.json();
  return data.token;
}

export async function getSubmission(token: string): Promise<SubmissionResult> {
  const res = await fetch(
    `${JUDGE0_URL}/submissions/${encodeURIComponent(token)}?base64_encoded=true`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error(`Judge0 get submission failed: ${res.status}`);
  }

  const data = await res.json();

  return {
    stdout: data.stdout ? Buffer.from(data.stdout, "base64").toString() : null,
    stderr: data.stderr ? Buffer.from(data.stderr, "base64").toString() : null,
    compile_output: data.compile_output
      ? Buffer.from(data.compile_output, "base64").toString()
      : null,
    status: data.status,
    time: data.time,
    memory: data.memory,
  };
}

export async function submitAndWait(
  req: SubmissionRequest,
  maxAttempts = 20,
  delayMs = 500
): Promise<SubmissionResult> {
  const token = await createSubmission(req);

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, delayMs));
    const result = await getSubmission(token);

    // Status 1 = In Queue, 2 = Processing
    if (result.status.id > 2) {
      return result;
    }
  }

  throw new Error("Submission timed out waiting for result");
}
