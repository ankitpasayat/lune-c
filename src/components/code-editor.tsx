"use client";

import { useEffect, useRef, useCallback } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightActiveLine } from "@codemirror/view";
import { defaultKeymap, indentWithTab, history, historyKeymap } from "@codemirror/commands";
import { cpp } from "@codemirror/lang-cpp";
import { syntaxHighlighting, defaultHighlightStyle, indentOnInput, bracketMatching, foldGutter } from "@codemirror/language";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { oneDark } from "@codemirror/theme-one-dark";
import { useTheme } from "next-themes";

interface CodeMirrorEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  className?: string;
}

const lightTheme = EditorView.theme({
  "&": {
    backgroundColor: "oklch(0.995 0.003 12)",
    fontSize: "14px",
    height: "100%",
  },
  ".cm-scroller": {
    overflow: "auto",
  },
  ".cm-gutters": {
    backgroundColor: "oklch(0.965 0.008 12)",
    borderRight: "1px solid oklch(0.915 0.008 12)",
    color: "oklch(0.5 0.02 12)",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "oklch(0.955 0.025 14)",
  },
  ".cm-activeLine": {
    backgroundColor: "oklch(0.97 0.012 12)",
  },
  "&.cm-focused .cm-cursor": {
    borderLeftColor: "oklch(0.586 0.22 16)",
  },
  "&.cm-focused .cm-selectionBackground, ::selection": {
    backgroundColor: "oklch(0.92 0.04 14) !important",
  },
});

export default function CodeMirrorEditor({
  value,
  onChange,
  readOnly = false,
  className = "",
}: CodeMirrorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const { resolvedTheme } = useTheme();

  const handleChange = useCallback(
    (val: string) => {
      onChange?.(val);
    },
    [onChange]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const isDark = resolvedTheme === "dark";

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        history(),
        foldGutter(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        highlightSelectionMatches(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        cpp(),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          ...closeBracketsKeymap,
          ...searchKeymap,
          indentWithTab,
        ]),
        isDark ? oneDark : lightTheme,
        EditorView.theme({ "&": { height: "100%" }, ".cm-scroller": { overflow: "auto" } }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            handleChange(update.state.doc.toString());
          }
        }),
        ...(readOnly ? [EditorState.readOnly.of(true)] : []),
        EditorView.lineWrapping,
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
    // Recreate editor when theme changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedTheme, readOnly]);

  // Sync external value changes without recreating editor
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden rounded-md border border-border [&>.cm-editor]:h-full ${className}`}
    />
  );
}
