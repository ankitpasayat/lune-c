import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sandbox | lune-c",
  description: "Free-form C code editor — write, compile, and run C code instantly.",
};

export default function SandboxLayout({ children }: { children: React.ReactNode }) {
  return children;
}
