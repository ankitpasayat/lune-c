import Link from "next/link";
import {
  ArrowRight,
  Terminal,
  Cpu,
  Network,
  Database,
  Shield,
  Zap,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const PHASES = [
  {
    phase: 1,
    title: "Foundations",
    description:
      "Your first C programs — variables, control flow, arrays, strings, pointers, and dynamic memory. Every abstraction you've ever used starts here.",
    icon: Terminal,
    modules: ["C Fundamentals", "Arrays & Strings", "Pointers & Memory"],
  },
  {
    phase: 2,
    title: "Core DSA",
    description:
      "Build every data structure from scratch. Your Python list? It's a dynamic array you'll implement in 50 lines of C.",
    icon: Cpu,
    modules: [
      "Structs & Enums",
      "Linked Lists",
      "Stacks, Queues & Trees",
      "Sorting & Searching",
      "Algorithm Techniques",
      "Recursion & Backtracking",
      "Dynamic Programming",
    ],
  },
  {
    phase: 3,
    title: "Systems & Low-Level",
    description:
      "File I/O, the preprocessor, Makefiles, bitwise tricks, and memory layout. You'll see what the compiler actually does with your code.",
    icon: Zap,
    modules: [
      "File I/O",
      "The Preprocessor & Build System",
      "Bitwise & Low-Level",
    ],
  },
  {
    phase: 4,
    title: "OS & Concurrency",
    description:
      'Processes, threads, mutexes, signals, sockets. When you run `docker run`, it calls fork() + exec() — and you\'ll write that.',
    icon: Network,
    modules: [
      "System Calls & Processes",
      "Threads & Concurrency",
      "IPC & Sockets",
    ],
  },
  {
    phase: 5,
    title: "Applications",
    description:
      "Advanced data structures, real-world projects, and battle-tested debugging — build non-trivial programs from scratch.",
    icon: Database,
    modules: [
      "Advanced Data Structures",
      "Building Real Programs",
      "Debugging & Testing",
    ],
  },
  {
    phase: 6,
    title: "Specialization",
    description:
      "Embedded systems, cache optimization, SIMD, function pointers, and modern C standards. Go deep.",
    icon: Shield,
    modules: [
      "Embedded & Constrained C",
      "Performance & Advanced C",
    ],
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold text-primary"
          >
            <span className="text-base">⌘</span>
            <span className="font-heading">lune-c</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/sandbox">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                <Terminal className="h-3.5 w-3.5" />
                Sandbox
              </Button>
            </Link>
            <Link href="/lessons/01-c-fundamentals/01-hello-world">
              <Button size="sm" className="gap-1.5">
                Start Learning
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto max-w-5xl px-6 py-24 text-center">
          <div className="mb-4 inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            21 modules · 89 lessons · Complete CS curriculum
          </div>
          <h1 className="font-heading mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Learn C from the
            <br />
            <span className="text-primary">ground up</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            An interactive course covering a full CS degree — data structures,
            algorithms, operating systems, networking, compilers, databases —
            all taught through C programming with an in-browser code editor.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/lessons/01-c-fundamentals/01-hello-world">
              <Button size="lg" className="gap-2">
                <Terminal className="h-4 w-4" />
                Start with Hello World
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            No setup required. Write and run C code right in your browser.
          </p>
        </div>
      </section>

      {/* Preview editor */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <div className="rounded-lg border border-border bg-card p-1 shadow-sm">
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400/60" />
                <div className="h-3 w-3 rounded-full bg-amber-400/60" />
                <div className="h-3 w-3 rounded-full bg-green-400/60" />
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                main.c
              </span>
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-sm leading-relaxed">
              <code>
                <span className="text-muted-foreground">{`// Every modern abstraction was built in C.\n// Here, you'll build them yourself.\n\n`}</span>
                <span className="text-blue-600 dark:text-blue-400">
                  #include
                </span>
                {` `}
                <span className="text-green-700 dark:text-green-400">
                  &lt;stdio.h&gt;
                </span>
                {`\n\n`}
                <span className="text-blue-600 dark:text-blue-400">int</span>
                {` `}
                <span className="text-amber-700 dark:text-amber-300">
                  main
                </span>
                {`() {\n    `}
                <span className="text-amber-700 dark:text-amber-300">
                  printf
                </span>
                {`(`}
                <span className="text-green-700 dark:text-green-400">{`"Hello, world!\\n"`}</span>
                {`);\n    `}
                <span className="text-blue-600 dark:text-blue-400">
                  return
                </span>
                {` `}
                <span className="text-purple-600 dark:text-purple-400">0</span>
                {`;\n}`}
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* Curriculum */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-12 text-center">
            <h2 className="font-heading mb-3 text-3xl font-bold tracking-tight">
              Full Curriculum
            </h2>
            <p className="text-muted-foreground">
              6 phases, 21 modules, from{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-primary">
                printf
              </code>{" "}
              to distributed consensus.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {PHASES.map((phase) => (
              <div
                key={phase.phase}
                className="rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/30"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <phase.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Phase {phase.phase}
                    </div>
                    <h3 className="text-lg font-semibold">{phase.title}</h3>
                  </div>
                </div>
                <p className="mb-4 text-sm text-muted-foreground leading-relaxed">
                  {phase.description}
                </p>
                <ul className="space-y-1">
                  {phase.modules.map((mod) => (
                    <li
                      key={mod}
                      className="flex items-center gap-2 text-sm text-foreground/80"
                    >
                      <div className="h-1 w-1 rounded-full bg-primary/50" />
                      {mod}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-muted/30 py-16">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="font-heading mb-3 text-2xl font-bold">Ready to start?</h2>
          <p className="mb-6 text-muted-foreground">
            No signup required. Jump straight into writing C.
          </p>
          <Link href="/lessons/01-c-fundamentals/01-hello-world">
            <Button size="lg" className="gap-2">
              Begin Module 1
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="mx-auto max-w-5xl px-6 text-center text-xs text-muted-foreground">
          lune-c — An open interactive C programming course.
        </div>
      </footer>
    </div>
  );
}
