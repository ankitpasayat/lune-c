import { NextRequest, NextResponse } from "next/server";
import { compileAndRun } from "@/lib/compiler";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const limit = checkRateLimit(req, { maxRequests: 20, windowMs: 60_000 });
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) } }
    );
  }

  try {
    const body = await req.json();
    const { source_code, stdin } = body;

    if (!source_code || typeof source_code !== "string") {
      return NextResponse.json(
        { error: "source_code is required" },
        { status: 400 }
      );
    }

    if (source_code.length > 50000) {
      return NextResponse.json(
        { error: "Source code too large (max 50KB)" },
        { status: 400 }
      );
    }

    const result = await compileAndRun(source_code, typeof stdin === "string" ? stdin : undefined);

    return NextResponse.json({
      stdout: result.stdout,
      stderr: result.stderr,
      compile_output: result.compile_output,
      status: result.status,
      time: result.time,
      memory: result.memory,
    });
  } catch (error) {
    console.error("Run API error:", error);
    return NextResponse.json(
      { error: "Failed to execute code" },
      { status: 500 }
    );
  }
}
