import { notFound } from "next/navigation";
import { getModules, getLessonSource } from "@/lib/content";
import { compileMDX } from "next-mdx-remote/rsc";
import { getMDXComponents } from "@/components/mdx-components";
import remarkGfm from "remark-gfm";
import rehypePrettyCode from "rehype-pretty-code";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ module: string; lesson: string }>;
}

export async function generateStaticParams() {
  const modules = getModules();
  const params: { module: string; lesson: string }[] = [];

  for (const mod of modules) {
    for (const lesson of mod.lessons) {
      params.push({ module: mod.slug, lesson: lesson.slug });
    }
  }

  return params;
}

export default async function LessonPage({ params }: PageProps) {
  const { module: moduleSlug, lesson: lessonSlug } = await params;
  const lessonData = getLessonSource(moduleSlug, lessonSlug);

  if (!lessonData) {
    notFound();
  }

  const { source, meta } = lessonData;

  // Find prev/next lessons
  const modules = getModules();
  const allLessons = modules.flatMap((m) =>
    m.lessons.map((l) => ({
      ...l,
      moduleSlug: m.slug,
      moduleTitle: m.title,
    }))
  );
  const currentIndex = allLessons.findIndex(
    (l) => l.moduleSlug === moduleSlug && l.slug === lessonSlug
  );
  const prev = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const next =
    currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const { content } = await compileMDX({
    source,
    components: getMDXComponents(),
    options: {
      parseFrontmatter: true,
      blockJS: false,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [[rehypePrettyCode, { theme: { dark: "one-dark-pro", light: "github-light" }, defaultColor: false, keepBackground: false }]],
      },
    },
  });

  return (
    <article>
      <div className="mb-6">
        <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {meta.module}
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">{meta.title}</h1>
        {meta.description && (
          <p className="mt-2 text-[15px] text-muted-foreground leading-relaxed">
            {meta.description}
          </p>
        )}
      </div>

      <div className="prose-custom">{content}</div>

      {/* Prev/Next navigation */}
      <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
        {prev ? (
          <Link href={`/lessons/${prev.moduleSlug}/${prev.slug}`}>
            <Button variant="ghost" className="gap-1 text-sm">
              <ChevronLeft className="h-4 w-4" />
              <div className="text-left">
                <div className="text-[10px] text-muted-foreground">
                  Previous
                </div>
                <div>{prev.title}</div>
              </div>
            </Button>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link href={`/lessons/${next.moduleSlug}/${next.slug}`}>
            <Button variant="ghost" className="gap-1 text-sm">
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground">Next</div>
                <div>{next.title}</div>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <div />
        )}
      </div>
    </article>
  );
}
