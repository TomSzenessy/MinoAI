"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { EditorState } from "@codemirror/state";
import {
  EditorView,
  keymap,
  placeholder as cmPlaceholder,
} from "@codemirror/view";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { defaultHighlightStyle, syntaxHighlighting } from "@codemirror/language";

export interface MarkdownEditorHandle {
  focus: () => void;
}

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

const editorTheme = EditorView.theme({
  "&": {
    backgroundColor: "transparent",
    color: "var(--text-secondary)",
    fontSize: "15px",
    lineHeight: "1.75",
    minHeight: "500px",
  },
  ".cm-scroller": {
    fontFamily: "inherit",
  },
  ".cm-content": {
    padding: "0",
    minHeight: "500px",
    caretColor: "#ffffff",
  },
  ".cm-line": {
    padding: "0",
  },
  ".cm-placeholder": {
    color: "var(--text-tertiary)",
  },
  ".cm-gutters": {
    display: "none",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-selectionBackground, ::selection": {
    backgroundColor: "rgba(187, 134, 252, 0.28) !important",
  },
});

export const MarkdownEditor = forwardRef<MarkdownEditorHandle, MarkdownEditorProps>(
  function MarkdownEditor({ value, onChange, placeholder }, ref) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const editorViewRef = useRef<EditorView | null>(null);
    const onChangeRef = useRef(onChange);
    const applyingExternalUpdateRef = useRef(false);

    useEffect(() => {
      onChangeRef.current = onChange;
    }, [onChange]);

    useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          editorViewRef.current?.focus();
        },
      }),
      [],
    );

    useEffect(() => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      const state = EditorState.create({
        doc: value,
        extensions: [
          history(),
          keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
          markdown(),
          syntaxHighlighting(defaultHighlightStyle),
          EditorView.lineWrapping,
          cmPlaceholder(placeholder),
          editorTheme,
          EditorView.updateListener.of((update) => {
            if (!update.docChanged || applyingExternalUpdateRef.current) {
              return;
            }
            onChangeRef.current(update.state.doc.toString());
          }),
        ],
      });

      const view = new EditorView({
        state,
        parent: container,
      });

      editorViewRef.current = view;

      return () => {
        view.destroy();
        editorViewRef.current = null;
      };
    }, [placeholder]);

    useEffect(() => {
      const view = editorViewRef.current;
      if (!view) {
        return;
      }

      const currentDoc = view.state.doc.toString();
      if (currentDoc === value) {
        return;
      }

      applyingExternalUpdateRef.current = true;
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: value,
        },
      });
      applyingExternalUpdateRef.current = false;
    }, [value]);

    return <div ref={containerRef} className="min-h-[500px] h-full w-full" />;
  },
);
