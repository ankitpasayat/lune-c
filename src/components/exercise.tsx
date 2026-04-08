"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import CodeMirrorEditor from "@/components/code-editor";
import { Play, Loader2, RotateCcw, Check, X, AlignLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TestCase {
  stdin: string;
  expected_stdout: string;
}

interface ExerciseProps {
  title: string;
  description?: string;
  starterCode: string;
  testCases: TestCase[];
  hints?: string[];
  className?: string;
}

interface TestResult {
  index: number;
  passed: boolean;
  stdin: string;
  expected: string;
  actual: string | null;
  compile_output: string | null;
  status: { id: number; description: string };
}

interface SubmitResult {
  passed: boolean;
  total: number;
  passed_count: number;
  results: TestResult[];
}

export default function Exercise({
  title,
  description,
  starterCode,
  testCases,
  hints = [],
  className = "",
}: ExerciseProps) {
  const [code, setCode] = useState(starterCode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [isFormatting, setIsFormatting] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const formattedStarter = useRef(starterCode);

  // Pre-format on mount so Format button produces no diff on unchanged code
  useEffect(() => {
    let cancelled = false;
    fetch("/api/format", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source_code: starterCode }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.formatted) {
          formattedStarter.current = d.formatted;
          setCode(d.formatted);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [starterCode]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_code: code, test_cases: testCases }),
      });

      const data: SubmitResult = await res.json();
      setResult(data);
    } catch {
      setResult({
        passed: false,
        total: testCases.length,
        passed_count: 0,
        results: [],
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [code, testCases]);

  const handleFormat = useCallback(async () => {
    setIsFormatting(true);
    try {
      const res = await fetch("/api/format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_code: code }),
      });
      const data = await res.json();
      if (data.formatted) setCode(data.formatted);
    } catch { /* ignore */ }
    setIsFormatting(false);
  }, [code]);

  const handleReset = useCallback(() => {
    setCode(formattedStarter.current);
    setResult(null);
    setShowHint(false);
    setHintIndex(0);
  }, []);

  const handleNextHint = useCallback(() => {
    if (!showHint) {
      setShowHint(true);
    } else if (hintIndex < hints.length - 1) {
      setHintIndex((i) => i + 1);
    }
  }, [showHint, hintIndex, hints.length]);

  return (
    <div
      className={`rounded-lg border border-border bg-card p-4 ${className}`}
    >
      <div className="mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
            <span className="text-xs font-bold">Ex</span>
          </div>
          <h3 className="text-base font-semibold">{title}</h3>
          {result?.passed && (
            <span className="ml-auto flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
              <Check className="h-3.5 w-3.5" /> Passed
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      <CodeMirrorEditor
        value={code}
        onChange={setCode}
      />

      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFormat}
            disabled={isFormatting}
            className="h-7 px-2 text-xs"
            title="Format code (clang-format)"
          >
            {isFormatting ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <AlignLeft className="mr-1 h-3 w-3" />}
            Format
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-7 px-2 text-xs"
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            Reset
          </Button>
          {hints.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextHint}
              className="h-7 px-2 text-xs"
            >
              💡 Hint
              {showHint && hints.length > 1 && ` (${hintIndex + 1}/${hints.length})`}
            </Button>
          )}
        </div>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="h-7 px-3 text-xs"
        >
          {isSubmitting ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <Play className="mr-1 h-3 w-3" />
          )}
          Submit
        </Button>
      </div>

      {showHint && hints.length > 0 && (
        <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
          {hints[hintIndex]}
        </div>
      )}

      {result && (
        <div className="mt-2 space-y-1.5">
          <div
            className={`rounded-md border px-3 py-2 text-sm font-medium ${
              result.passed
                ? "border-green-200 bg-green-50 text-green-800 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-300"
                : "border-red-200 bg-red-50 text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
            }`}
          >
            {result.passed
              ? `All ${result.total} tests passed!`
              : `${result.passed_count}/${result.total} tests passed`}
          </div>

          {!result.passed &&
            result.results
              .filter((r) => !r.passed)
              .slice(0, 3)
              .map((r) => (
                <div
                  key={r.index}
                  className="rounded-md border border-border bg-muted/50 p-2.5 font-mono text-xs"
                >
                  <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                    <X className="h-3 w-3" />
                    <span>Test {r.index + 1} failed</span>
                  </div>
                  {r.compile_output && (
                    <pre className="mt-1.5 whitespace-pre-wrap text-red-600 dark:text-red-400">
                      {r.compile_output}
                    </pre>
                  )}
                  {!r.compile_output && (
                    <div className="mt-1.5 space-y-0.5">
                      {r.stdin && (
                        <div>
                          <span className="text-muted-foreground">
                            Input:{" "}
                          </span>
                          {r.stdin}
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">
                          Expected:{" "}
                        </span>
                        {r.expected}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Got: </span>
                        {r.actual || "(no output)"}
                      </div>
                    </div>
                  )}
                </div>
              ))}
        </div>
      )}
    </div>
  );
}
