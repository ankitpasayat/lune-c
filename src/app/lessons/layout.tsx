import { Menu } from "lucide-react";
import Link from "next/link";
import { getModules } from "@/lib/content";
import Sidebar from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LessonsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const modules = getModules();

  return (
    <div className="flex h-screen">
      {/* Mobile header */}
      <div className="fixed inset-x-0 top-0 z-50 flex h-12 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-primary"
        >
          <span className="text-base">⌘</span>
          <span className="font-heading">lune-c</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <label htmlFor="sidebar-toggle" className="cursor-pointer p-1">
            <Menu className="h-5 w-5" />
          </label>
        </div>
      </div>

      {/* Sidebar toggle for mobile */}
      <input type="checkbox" id="sidebar-toggle" className="peer hidden" />

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 shrink-0 flex-col border-r border-border bg-sidebar lg:flex peer-checked:flex peer-checked:pt-12">
        <Sidebar modules={modules} />
      </aside>

      {/* Overlay for mobile sidebar */}
      <label
        htmlFor="sidebar-toggle"
        className="fixed inset-0 z-30 hidden bg-black/50 peer-checked:block lg:!hidden"
      >
        <span className="sr-only">Close sidebar</span>
      </label>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pt-12 lg:ml-72 lg:pt-0">
        <div className="mx-auto max-w-3xl px-6 py-10">{children}</div>
      </main>
    </div>
  );
}
