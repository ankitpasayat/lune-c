"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, BookOpen, Terminal } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

interface Lesson {
  slug: string;
  title: string;
  order: number;
}

interface Module {
  slug: string;
  title: string;
  order: number;
  phase: number;
  lessons: Lesson[];
}

interface SidebarProps {
  modules: Module[];
}

const PHASE_LABELS = [
  "",
  "Foundations",
  "Core DSA",
  "Systems & Low-Level",
  "OS & Concurrency",
  "Applications",
  "Specialization",
];

export default function Sidebar({ modules }: SidebarProps) {
  const pathname = usePathname();
  const [expandedModules, setExpandedModules] = useState<Set<string>>(() => {
    // Auto-expand the module containing the current lesson
    const currentModule = modules.find((m) =>
      m.lessons.some((l) => pathname.includes(`/${m.slug}/${l.slug}`))
    );
    return new Set(currentModule ? [currentModule.slug] : []);
  });

  const toggleModule = (slug: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  const groupedByPhase = modules.reduce(
    (acc, mod) => {
      const phase = mod.phase || 1;
      if (!acc[phase]) acc[phase] = [];
      acc[phase].push(mod);
      return acc;
    },
    {} as Record<number, Module[]>
  );

  return (
    <nav className="flex min-h-0 flex-1 flex-col">
      {/* Fixed header */}
      <div className="flex shrink-0 items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold text-primary"
        >
          <span className="font-mono text-sm">⌘</span>
          <span className="font-heading">lune-c</span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <Link
          href="/sandbox"
          className={`mb-3 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-sidebar-accent ${
            pathname === "/sandbox" ? "bg-sidebar-accent text-primary" : "text-muted-foreground"
          }`}
        >
          <Terminal className="h-3.5 w-3.5" />
          Sandbox
        </Link>

        <div className="space-y-4">
        {Object.entries(groupedByPhase)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([phase, phaseModules]) => (
            <div key={phase}>
              <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Phase {phase} · {PHASE_LABELS[Number(phase)] || ""}
              </div>

              {phaseModules.map((mod) => {
                const isExpanded = expandedModules.has(mod.slug);
                const isActiveModule = mod.lessons.some((l) =>
                  pathname.includes(`/${mod.slug}/${l.slug}`)
                );

                return (
                  <div key={mod.slug} className="mb-0.5">
                    <button
                      onClick={() => toggleModule(mod.slug)}
                      className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent ${
                        isActiveModule
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      <ChevronRight
                        className={`h-3 w-3 shrink-0 transition-transform ${
                          isExpanded ? "rotate-90" : ""
                        }`}
                      />
                      <BookOpen className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{mod.title}</span>
                    </button>

                    {isExpanded && (
                      <div className="ml-4 border-l border-border pl-2">
                        {mod.lessons.map((lesson) => {
                          const href = `/lessons/${mod.slug}/${lesson.slug}`;
                          const isActive = pathname === href;

                          return (
                            <Link
                              key={lesson.slug}
                              href={href}
                              className={`block rounded-md px-2 py-1 text-sm transition-colors ${
                                isActive
                                  ? "bg-primary/10 font-medium text-primary"
                                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
                              }`}
                            >
                              {lesson.title}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}
