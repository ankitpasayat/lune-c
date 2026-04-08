import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content");

/** Only allow slug-safe characters: lowercase alphanumeric with hyphens */
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

export interface LessonMeta {
  slug: string;
  title: string;
  module: string;
  moduleSlug: string;
  order: number;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

export interface ModuleMeta {
  slug: string;
  title: string;
  order: number;
  description: string;
  phase: number;
  lessons: LessonMeta[];
}

export function getModules(): ModuleMeta[] {
  const moduleDirs = fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));

  return moduleDirs.map((dir) => {
    const modulePath = path.join(CONTENT_DIR, dir.name);
    const metaPath = path.join(modulePath, "meta.json");
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));

    const lessons = getLessonsForModule(dir.name, modulePath);

    return {
      slug: dir.name,
      title: meta.title,
      order: meta.order,
      description: meta.description,
      phase: meta.phase,
      lessons,
    };
  });
}

function getLessonsForModule(
  moduleSlug: string,
  modulePath: string
): LessonMeta[] {
  const files = fs
    .readdirSync(modulePath)
    .filter((f) => f.endsWith(".mdx"))
    .sort();

  return files.map((file) => {
    const filePath = path.join(modulePath, file);
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data } = matter(raw);
    const slug = file.replace(/\.mdx$/, "");

    return {
      slug,
      title: data.title || slug,
      module: data.module || moduleSlug,
      moduleSlug,
      order: data.order ?? 0,
      description: data.description || "",
      difficulty: data.difficulty || "beginner",
    };
  });
}

export function getLessonSource(
  moduleSlug: string,
  lessonSlug: string
): { source: string; meta: LessonMeta } | null {
  if (!isValidSlug(moduleSlug) || !isValidSlug(lessonSlug)) return null;

  const filePath = path.join(CONTENT_DIR, moduleSlug, `${lessonSlug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { content, data } = matter(raw);

  return {
    source: content,
    meta: {
      slug: lessonSlug,
      title: data.title || lessonSlug,
      module: data.module || moduleSlug,
      moduleSlug,
      order: data.order ?? 0,
      description: data.description || "",
      difficulty: data.difficulty || "beginner",
    },
  };
}
