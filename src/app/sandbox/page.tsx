"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Play, Loader2, RotateCcw, ArrowLeft, Clock, HardDrive, AlignLeft } from "lucide-react";
import CodeMirrorEditor from "@/components/code-editor";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { estimateComplexity } from "@/lib/complexity";

const DEFAULT_CODE = `#include <stdio.h>
#include <stdlib.h>

int main() {
    printf("Hello from the sandbox!\\n");
    return 0;
}
`;

interface RunResult {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  status: { id: number; description: string };
  time: string | null;
  memory: number | null;
}

export default function SandboxPage() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [stdin, setStdin] = useState("");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [showStdin, setShowStdin] = useState(false);
  const [complexity, setComplexity] = useState({ time: "", space: "" });
  const [isFormatting, setIsFormatting] = useState(false);

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

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setOutput("");
    setResult(null);

    // Auto-calculate complexity from source
    setComplexity(estimateComplexity(code));

    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_code: code, stdin }),
      });

      const data: RunResult = await res.json();
      setResult(data);

      if (data.compile_output) {
        setOutput(data.compile_output);
      } else if (data.stderr) {
        setOutput((data.stdout || "") + "\n--- stderr ---\n" + data.stderr);
      } else {
        setOutput(data.stdout || "(no output)");
      }
    } catch {
      setOutput("Error: Could not connect to code execution service");
    } finally {
      setIsRunning(false);
    }
  }, [code, stdin]);

  const handleReset = useCallback(() => {
    setCode(DEFAULT_CODE);
    setOutput("");
    setResult(null);
    setStdin("");
    setComplexity({ time: "", space: "" });
  }, []);

  const statusText = result
    ? `${result.status.description} • ${result.time ?? "?"}s${result.memory ? ` • ${result.memory >= 1024 ? (result.memory / 1024).toFixed(1) + "MB" : result.memory + "KB"}` : ""}`
    : "";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="flex h-12 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="font-heading font-bold text-primary">lune-c</span>
            </Link>
            <span className="text-border">/</span>
            <span className="text-sm font-medium">Sandbox</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
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
            <Button
              size="sm"
              onClick={handleRun}
              disabled={isRunning}
              className="h-7 px-3 text-xs"
            >
              {isRunning ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <Play className="mr-1 h-3 w-3" />
              )}
              Run
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Editor panel */}
        <div className="flex flex-1 flex-col border-b border-border lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-primary/60" />
              <span className="text-xs font-medium text-muted-foreground font-mono">
                main.c
              </span>
            </div>
            <button
              onClick={() => setShowStdin(!showStdin)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showStdin ? "Hide" : "Show"} stdin
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            <CodeMirrorEditor
              value={code}
              onChange={setCode}
              className="min-h-[400px] lg:min-h-0 lg:h-full"
            />
          </div>
          {showStdin && (
            <div className="border-t border-border">
              <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground border-b border-border">
                stdin
              </div>
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                className="w-full resize-none bg-transparent p-3 font-mono text-sm outline-none min-h-[80px]"
                placeholder="Standard input (optional)..."
              />
            </div>
          )}
        </div>

        {/* Output panel */}
        <div className="flex flex-col lg:w-[45%]">
          <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Output
            </span>
            {statusText && (
              <span className="text-xs text-muted-foreground">{statusText}</span>
            )}
          </div>
          <pre className="flex-1 overflow-auto whitespace-pre-wrap p-3 font-mono text-sm text-foreground min-h-[200px]">
            {isRunning ? "Running..." : output || "Run your code to see output here."}
          </pre>

          {/* Complexity badge */}
          {(complexity.time || complexity.space) && (
            <div className="border-t border-border px-3 py-2.5">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Complexity</span>
                <div className="inline-flex items-center gap-3 rounded-md border border-border bg-muted/50 px-3 py-1.5 font-mono text-xs">
                  {complexity.time && (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3 w-3 text-primary/70" />
                      <span className="text-foreground/80">{complexity.time}</span>
                    </span>
                  )}
                  {complexity.time && complexity.space && (
                    <span className="text-border">|</span>
                  )}
                  {complexity.space && (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <HardDrive className="h-3 w-3 text-primary/70" />
                      <span className="text-foreground/80">{complexity.space}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
