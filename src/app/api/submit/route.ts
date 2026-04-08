import { NextRequest, NextResponse } from "next/server";
import { compileAndRun } from "@/lib/compiler";

interface TestCase {
  stdin: string;
  expected_stdout: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { source_code, test_cases } = body;

    if (!source_code || typeof source_code !== "string") {
      return NextResponse.json(
        { error: "source_code is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(test_cases) || test_cases.length === 0) {
      return NextResponse.json(
        { error: "test_cases array is required" },
        { status: 400 }
      );
    }

    if (test_cases.length > 20) {
      return NextResponse.json(
        { error: "Maximum 20 test cases allowed" },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      test_cases.map(async (tc: TestCase, index: number) => {
        const result = await compileAndRun(source_code, tc.stdin);

        const actual = (result.stdout ?? "").trimEnd();
        const expected = tc.expected_stdout.trimEnd();
        const passed = actual === expected;

        return {
          index,
          passed,
          stdin: tc.stdin,
          expected: tc.expected_stdout,
          actual: result.stdout,
          stderr: result.stderr,
          compile_output: result.compile_output,
          status: result.status,
        };
      })
    );

    const allPassed = results.every((r) => r.passed);

    return NextResponse.json({
      passed: allPassed,
      total: results.length,
      passed_count: results.filter((r) => r.passed).length,
      results,
    });
  } catch (error) {
    console.error("Submit API error:", error);
    return NextResponse.json(
      { error: "Failed to verify submission" },
      { status: 500 }
    );
  }
}
