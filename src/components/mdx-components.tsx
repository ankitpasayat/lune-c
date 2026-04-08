import Editor from "@/components/editor";
import Exercise from "@/components/exercise";
import Complexity from "@/components/complexity";
import { ErrorBoundary } from "@/components/error-boundary";

function SafeEditor(props: React.ComponentProps<typeof Editor>) {
  return (
    <ErrorBoundary>
      <Editor {...props} />
    </ErrorBoundary>
  );
}

function SafeExercise(props: React.ComponentProps<typeof Exercise>) {
  return (
    <ErrorBoundary>
      <Exercise {...props} />
    </ErrorBoundary>
  );
}

// Wrapper: code block with optional complexity annotation
function CodeBlock({
  children,
  time,
  space,
}: {
  children: React.ReactNode;
  time?: string;
  space?: string;
}) {
  return (
    <div className="mb-4">
      {children}
      {(time || space) && (
        <Complexity time={time} space={space} className="mt-1.5" />
      )}
    </div>
  );
}

// Custom MDX components available inside lesson files
export function getMDXComponents() {
  return {
    Editor: SafeEditor,
    Exercise: SafeExercise,
    Complexity,
    CodeBlock,
    // Custom callout for "modern context" connections
    Callout: ({
      children,
      type = "info",
    }: {
      children: React.ReactNode;
      type?: "info" | "warning" | "modern" | "tip";
    }) => {
      const styles: Record<string, { border: string; icon: string; label: string; labelText: string }> = {
        info: {
          border: "border-blue-200 bg-blue-50/50 dark:border-blue-800/40 dark:bg-blue-950/20",
          icon: "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400",
          label: "text-blue-700 dark:text-blue-300",
          labelText: "Note",
        },
        warning: {
          border: "border-amber-200 bg-amber-50/50 dark:border-amber-800/40 dark:bg-amber-950/20",
          icon: "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400",
          label: "text-amber-700 dark:text-amber-300",
          labelText: "Warning",
        },
        modern: {
          border: "border-primary/20 bg-primary/5 dark:border-primary/15 dark:bg-primary/5",
          icon: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary",
          label: "text-primary dark:text-primary",
          labelText: "Connection",
        },
        tip: {
          border: "border-green-200 bg-green-50/50 dark:border-green-800/40 dark:bg-green-950/20",
          icon: "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400",
          label: "text-green-700 dark:text-green-300",
          labelText: "Tip",
        },
      };
      const icons: Record<string, string> = {
        info: "ℹ️",
        warning: "⚠️",
        modern: "🔗",
        tip: "💡",
      };

      const s = styles[type] || styles.info;

      return (
        <div className={`my-4 rounded-lg border ${s.border}`}>
          <div className={`flex items-center gap-2 px-4 pt-3 pb-1`}>
            <span className={`flex h-5 w-5 items-center justify-center rounded text-xs ${s.icon}`}>
              {icons[type] || icons.info}
            </span>
            <span className={`text-xs font-semibold uppercase tracking-wide ${s.label}`}>
              {s.labelText}
            </span>
          </div>
          <div className="px-4 pb-3 text-sm [&>p:last-child]:mb-0">
            {children}
          </div>
        </div>
      );
    },
    // Typography overrides — children come via {...props} from MDX
    /* eslint-disable jsx-a11y/heading-has-content */
    h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h1 className="mb-4 mt-8 font-heading text-3xl font-bold tracking-tight" {...props} />
    ),
    h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h2
        className="mb-3 mt-8 font-heading text-2xl font-semibold tracking-tight border-b border-border pb-2"
        {...props}
      />
    ),
    h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h3 className="mb-2 mt-5 font-heading text-lg font-semibold" {...props} />
    ),
    /* eslint-enable jsx-a11y/heading-has-content */
    p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p className="mb-4 text-[15px] leading-[1.8] text-foreground/85" {...props} />
    ),
    ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
      <ul className="mb-4 ml-6 list-disc space-y-1.5 text-[15px] text-foreground/85" {...props} />
    ),
    ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
      <ol className="mb-4 ml-6 list-decimal space-y-1.5 text-[15px] text-foreground/85" {...props} />
    ),
    li: (props: React.HTMLAttributes<HTMLLIElement>) => (
      <li className="leading-[1.8]" {...props} />
    ),
    // inline code: only style when NOT inside rehype-pretty-code
    code: (props: React.HTMLAttributes<HTMLElement> & { "data-rehype-pretty-code-figure"?: string }) => {
      // rehype-pretty-code code blocks are styled via CSS
      if ("data-language" in (props as Record<string, unknown>)) return <code {...props} />;
      return (
        <code
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px] text-primary"
          {...props}
        />
      );
    },
    // pre: rehype-pretty-code handles its own <pre> styling
    pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
      <pre {...props} />
    ),
    blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
      <blockquote
        className="mb-4 border-l-4 border-primary/40 pl-4 italic text-muted-foreground"
        {...props}
      />
    ),
    a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      // eslint-disable-next-line jsx-a11y/anchor-has-content -- children from MDX via spread
      <a
        className="font-medium text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary"
        {...props}
      />
    ),
    table: (props: React.HTMLAttributes<HTMLTableElement>) => (
      <div className="mb-4 overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-sm" {...props} />
      </div>
    ),
    thead: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
      <thead className="bg-muted/50" {...props} />
    ),
    th: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
      <th
        className="border-b border-border px-3 py-2 text-left font-semibold"
        {...props}
      />
    ),
    td: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
      <td className="border-b border-border px-3 py-2" {...props} />
    ),
  };
}
