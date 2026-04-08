"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Play, Loader2, RotateCcw, AlignLeft } from "lucide-react";
import CodeMirrorEditor from "@/components/code-editor";
import Complexity from "@/components/complexity";
import { Button } from "@/components/ui/button";

interface EditorProps {
  defaultCode?: string;
  stdin?: string;
  className?: string;
  time?: string;   // e.g. "O(n)"
  space?: string;  // e.g. "O(1)"
  storageKey?: string;  // localStorage key for auto-save
}

interface RunResult {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  status: { id: number; description: string };
  time: string | null;
  memory: number | null;
}

export default function Editor({
  defaultCode = '#include <stdio.h>\n\nint main() {\n    printf("Hello, world!\\n");\n    return 0;\n}\n',
  stdin = "",
  className = "",
  time,
  space,
  storageKey,
}: EditorProps) {
  const [code, setCode] = useState(() => {
    if (storageKey && typeof window !== "undefined") {
      const saved = localStorage.getItem(`lune-editor-${storageKey}`);
      if (saved) return saved;
    }
    return defaultCode;
  });
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [status, setStatus] = useState<string>("");
  const formattedDefault = useRef(defaultCode);
  const userHasEdited = useRef(false);

  // Pre-format on mount so Format button produces no diff on unchanged code
  // Skip if code was restored from localStorage
  useEffect(() => {
    if (storageKey && typeof window !== "undefined" && localStorage.getItem(`lune-editor-${storageKey}`)) {
      return; // Don't overwrite restored code
    }
    let cancelled = false;
    userHasEdited.current = false;
    fetch("/api/format", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source_code: defaultCode }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.formatted && !userHasEdited.current) {
          formattedDefault.current = d.formatted;
          setCode(d.formatted);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [defaultCode]);

  const handleCodeChange = useCallback((newCode: string) => {
    userHasEdited.current = true;
    setCode(newCode);
  }, []);

  // Auto-save to localStorage with debounce
  useEffect(() => {
    if (!storageKey) return;
    const timer = setTimeout(() => {
      localStorage.setItem(`lune-editor-${storageKey}`, code);
    }, 1000);
    return () => clearTimeout(timer);
  }, [code, storageKey]);

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setOutput("");
    setStatus("Compiling...");

    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_code: code, stdin }),
      });

      const result: RunResult = await res.json();

      if (result.compile_output) {
        setOutput(result.compile_output);
        setStatus("Compilation Error");
      } else if (result.stderr) {
        setOutput(
          (result.stdout || "") + "\n--- stderr ---\n" + result.stderr
        );
        setStatus(result.status.description);
      } else {
        setOutput(result.stdout || "(no output)");
        setStatus(
          `${result.status.description} • ${result.time ?? "?"}s${result.memory ? ` • ${result.memory >= 1024 ? (result.memory / 1024).toFixed(1) + "MB" : result.memory + "KB"}` : ""}`
        );
      }
    } catch {
      setOutput("Error: Could not connect to code execution service");
      setStatus("Connection Error");
    } finally {
      setIsRunning(false);
    }
  }, [code, stdin]);

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
    setCode(formattedDefault.current);
    setOutput("");
    setStatus("");
    if (storageKey) localStorage.removeItem(`lune-editor-${storageKey}`);
  }, [storageKey]);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-primary/60" />
          <span className="text-xs font-medium text-muted-foreground font-mono">
            main.c
          </span>
        </div>
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

      <div className="overflow-hidden">
        <CodeMirrorEditor
          value={code}
          onChange={handleCodeChange}
        />
      </div>

      {(output || isRunning) && (
        <div className="rounded-md border border-border bg-muted/50 font-mono text-sm">
          <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Output
            </span>
            {status && (
              <span className="text-xs text-muted-foreground">{status}</span>
            )}
          </div>
          <pre className="max-h-[200px] overflow-auto whitespace-pre-wrap p-3 text-foreground">
            {isRunning ? "Running..." : output}
          </pre>
        </div>
      )}

      {(time || space) && (
        <Complexity time={time} space={space} />
      )}
    </div>
  );
}
