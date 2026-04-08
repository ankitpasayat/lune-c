import { execFile } from "child_process";
import { mkdtemp, writeFile, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

export interface CompileResult {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  status: { id: number; description: string };
  time: string | null;
  memory: number | null; // peak RSS in KB
}

const TIMEOUT_MS = 10_000;
const MAX_OUTPUT = 64 * 1024; // 64KB

function runProcess(
  cmd: string,
  args: string[],
  opts: { timeout: number; stdin?: string; maxBuffer?: number }
): Promise<{ stdout: string; stderr: string; exitCode: number | null; signal: string | null }> {
  return new Promise((resolve) => {
    const child = execFile(
      cmd,
      args,
      {
        timeout: opts.timeout,
        maxBuffer: opts.maxBuffer ?? MAX_OUTPUT,
        encoding: "utf-8",
      },
      (error, stdout, stderr) => {
        resolve({
          stdout: stdout ?? "",
          stderr: stderr ?? "",
          exitCode: error ? (error as NodeJS.ErrnoException & { code?: string | number }).code === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER" ? null : child.exitCode : 0,
          signal: error?.killed ? "SIGKILL" : (child.signalCode ?? null),
        });
      }
    );
    if (opts.stdin) {
      child.stdin?.write(opts.stdin);
      child.stdin?.end();
    }
  });
}

/** Parse peak RSS from GNU time -v stderr output */
function parsePeakMemory(timeStderr: string): number | null {
  const match = timeStderr.match(/Maximum resident set size \(kbytes\): (\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/** Split GNU time's stats lines from the program's actual stderr */
function splitTimeOutput(stderr: string): { programStderr: string; peakMemoryKB: number | null } {
  // GNU time -v outputs lines starting with a tab or specific labels
  const timeMarker = "\tCommand being timed:";
  const markerIdx = stderr.indexOf(timeMarker);
  if (markerIdx === -1) {
    return { programStderr: stderr, peakMemoryKB: null };
  }
  const programStderr = stderr.slice(0, markerIdx);
  const timeOutput = stderr.slice(markerIdx);
  return {
    programStderr,
    peakMemoryKB: parsePeakMemory(timeOutput),
  };
}

export async function compileAndRun(
  sourceCode: string,
  stdin?: string
): Promise<CompileResult> {
  const dir = await mkdtemp(join(tmpdir(), "lune-c-"));
  const srcPath = join(dir, "main.c");
  const binPath = join(dir, "main");

  try {
    await writeFile(srcPath, sourceCode, "utf-8");

    // Compile
    const compile = await runProcess("gcc", [
      "-o", binPath,
      "-Wall", "-Wextra",
      "-std=c17",
      "-lm",
      srcPath,
    ], { timeout: TIMEOUT_MS });

    if (compile.exitCode !== 0) {
      return {
        stdout: null,
        stderr: null,
        compile_output: compile.stderr,
        status: { id: 6, description: "Compilation Error" },
        time: null,
        memory: null,
      };
    }

    // Run with GNU time for memory tracking
    const start = performance.now();
    const run = await runProcess("/usr/bin/time", [
      "-v", binPath,
    ], {
      timeout: TIMEOUT_MS,
      stdin,
    });
    const elapsed = ((performance.now() - start) / 1000).toFixed(3);
    const { programStderr, peakMemoryKB } = splitTimeOutput(run.stderr);

    if (run.signal === "SIGKILL") {
      return {
        stdout: run.stdout || null,
        stderr: null,
        compile_output: null,
        status: { id: 5, description: "Time Limit Exceeded" },
        time: elapsed,
        memory: peakMemoryKB,
      };
    }

    if (run.exitCode !== 0) {
      return {
        stdout: run.stdout || null,
        stderr: programStderr || null,
        compile_output: null,
        status: { id: 11, description: "Runtime Error (NZEC)" },
        time: elapsed,
        memory: peakMemoryKB,
      };
    }

    return {
      stdout: run.stdout || null,
      stderr: programStderr || null,
      compile_output: null,
      status: { id: 3, description: "Accepted" },
      time: elapsed,
      memory: peakMemoryKB,
    };
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
