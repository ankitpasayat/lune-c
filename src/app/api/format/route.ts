import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";

function formatCode(source: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn("clang-format", [
      "--style={BasedOnStyle: Google, IndentWidth: 4, ColumnLimit: 100}",
      "--assume-filename=main.c",
    ]);

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (d: Buffer) => { stdout += d.toString(); });
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });

    proc.on("close", (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr || `clang-format exited with code ${code}`));
    });

    proc.on("error", reject);

    proc.stdin.write(source);
    proc.stdin.end();

    setTimeout(() => { proc.kill(); reject(new Error("Timeout")); }, 5000);
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { source_code } = body;

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

    const formatted = await formatCode(source_code);
    return NextResponse.json({ formatted });
  } catch {
    return NextResponse.json(
      { error: "Formatting failed" },
      { status: 500 }
    );
  }
}
