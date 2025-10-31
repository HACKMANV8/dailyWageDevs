// katalyst_/modules/playground/components/playground-editor.tsx
"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import Editor, { type Monaco } from "@monaco-editor/react";
import { configureMonaco, defaultEditorOptions, getEditorLanguage } from "@/modules/playground/lib/editor-config";
import type { TemplateFile } from "@/modules/playground/lib/path-to-json";
import { useYjsCollaboration } from "@/modules/collaboration/hooks/useYjsCollaboration";

interface PlaygroundEditorProps {
  activeFile: TemplateFile | undefined;
  content: string;
  onContentChange: (value: string) => void;
  suggestion: string | null;
  suggestionLoading: boolean;
  suggestionPosition: { line: number; column: number } | null;
  onAcceptSuggestion: (editor: any, monaco: any) => void;
  onRejectSuggestion: (editor: any) => void;
  onTriggerSuggestion: (type: string, editor: any) => void;
  collaborationEnabled?: boolean;
}

export const PlaygroundEditor = ({
  activeFile,
  content,
  onContentChange,
  suggestion,
  suggestionLoading,
  suggestionPosition,
  onAcceptSuggestion,
  onRejectSuggestion,
  onTriggerSuggestion,
  collaborationEnabled = true,
}: PlaygroundEditorProps) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const inlineCompletionProviderRef = useRef<any>(null);
  const currentSuggestionRef = useRef<{
    text: string;
    position: { line: number; column: number };
    id: string;
  } | null>(null);
  const isAcceptingSuggestionRef = useRef(false);
  const suggestionAcceptedRef = useRef(false);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tabCommandRef = useRef<any>(null);
  const [isCollaborativeMode, setIsCollaborativeMode] = useState(false);

  // === YJS COLLABORATION INTEGRATION ===
  const { binding } = useYjsCollaboration({
    editor: editorRef.current,
    monaco: monacoRef.current,
    fileId: activeFile ? `${activeFile.filename}.${activeFile.fileExtension}` : "",
    enabled: collaborationEnabled && !!activeFile,
  });

  // Update collaborative mode status
  useEffect(() => {
    setIsCollaborativeMode(!!binding && collaborationEnabled);
  }, [binding, collaborationEnabled]);

  // Generate unique ID for each suggestion
  const generateSuggestionId = () => `suggestion-${Date.now()}-${Math.random()}`;

  // Create inline completion provider
  const createInlineCompletionProvider = useCallback(
    (monaco: Monaco) => {
      return {
        provideInlineCompletions: async (model: any, position: any, context: any, token: any) => {
          console.log("provideInlineCompletions called", {
            hasSuggestion: !!suggestion,
            hasPosition: !!suggestionPosition,
            currentPos: `${position.lineNumber}:${position.column}`,
            suggestionPos: suggestionPosition ? `${suggestionPosition.line}:${suggestionPosition.column}` : null,
            isAccepting: isAcceptingSuggestionRef.current,
            suggestionAccepted: suggestionAcceptedRef.current,
          });

          if (isAcceptingSuggestionRef.current || suggestionAcceptedRef.current) {
            return { items: [] };
          }

          if (!suggestion || !suggestionPosition) return { items: [] };

          const currentLine = position.lineNumber;
          const currentColumn = position.column;
          const isPositionMatch =
            currentLine === suggestionPosition.line &&
            currentColumn >= suggestionPosition.column &&
            currentColumn <= suggestionPosition.column + 2;

          if (!isPositionMatch) return { items: [] };

          const suggestionId = generateSuggestionId();
          currentSuggestionRef.current = {
            text: suggestion,
            position: suggestionPosition,
            id: suggestionId,
          };

          const cleanSuggestion = suggestion.replace(/\r/g, "");

          return {
            items: [
              {
                insertText: cleanSuggestion,
                range: new monaco.Range(
                  suggestionPosition.line,
                  suggestionPosition.column,
                  suggestionPosition.line,
                  suggestionPosition.column,
                ),
                kind: monaco.languages.CompletionItemKind.Snippet,
                label: "AI Suggestion",
                detail: "AI-generated code suggestion",
                documentation: "Press Tab to accept",
                sortText: "0000",
                filterText: "",
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              },
            ],
          };
        },
        freeInlineCompletions: () => {},
        disposeInlineCompletions: () => {},
      };
    },
    [suggestion, suggestionPosition],
  );

  const clearCurrentSuggestion = useCallback(() => {
    currentSuggestionRef.current = null;
    suggestionAcceptedRef.current = false;
    if (editorRef.current) {
      editorRef.current.trigger("ai", "editor.action.inlineSuggest.hide", null);
    }
  }, []);

  const acceptCurrentSuggestion = useCallback(() => {
    if (!editorRef.current || !monacoRef.current || !currentSuggestionRef.current) return false;

    if (isAcceptingSuggestionRef.current || suggestionAcceptedRef.current) return false;

    isAcceptingSuggestionRef.current = true;
    suggestionAcceptedRef.current = true;

    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const currentSuggestion = currentSuggestionRef.current;

    try {
      const cleanSuggestionText = currentSuggestion.text.replace(/\r/g, "");
      const currentPosition = editor.getPosition();
      const suggestionPos = currentSuggestion.position;

      if (
        currentPosition.lineNumber !== suggestionPos.line ||
        currentPosition.column < suggestionPos.column ||
        currentPosition.column > suggestionPos.column + 5
      ) {
        return false;
      }

      const range = new monaco.Range(suggestionPos.line, suggestionPos.column, suggestionPos.line, suggestionPos.column);
      const success = editor.executeEdits("ai-suggestion-accept", [
        { range, text: cleanSuggestionText, forceMoveMarkers: true },
      ]);

      if (!success) return false;

      const lines = cleanSuggestionText.split("\n");
      const endLine = suggestionPos.line + lines.length - 1;
      const endColumn = lines.length === 1 ? suggestionPos.column + cleanSuggestionText.length : lines[lines.length - 1].length + 1;
      editor.setPosition({ lineNumber: endLine, column: endColumn });

      clearCurrentSuggestion();
      onAcceptSuggestion(editor, monaco);
      return true;
    } catch (error) {
      console.error("Error accepting suggestion:", error);
      return false;
    } finally {
      isAcceptingSuggestionRef.current = false;
      setTimeout(() => {
        suggestionAcceptedRef.current = false;
      }, 1000);
    }
  }, [clearCurrentSuggestion, onAcceptSuggestion]);

  const hasActiveSuggestionAtPosition = useCallback(() => {
    if (!editorRef.current || !currentSuggestionRef.current) return false;
    const position = editorRef.current.getPosition();
    const suggestion = currentSuggestionRef.current;
    return (
      position.lineNumber === suggestion.position.line &&
      position.column >= suggestion.position.column &&
      position.column <= suggestion.position.column + 2
    );
  }, []);

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    console.log("[Editor] Instance mounted", !!editorRef.current);

    editor.updateOptions({
      ...defaultEditorOptions,
      inlineSuggest: { enabled: true, mode: "prefix", suppressSuggestions: false },
      suggest: { preview: false, showInlineDetails: false, insertMode: "replace" },
      quickSuggestions: { other: true, comments: false, strings: false },
      cursorSmoothCaretAnimation: "on",
    });

    configureMonaco(monaco);

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
      onTriggerSuggestion("completion", editor);
    });

    if (tabCommandRef.current?.dispose) tabCommandRef.current.dispose();

    tabCommandRef.current = editor.addCommand(
      monaco.KeyCode.Tab,
      () => {
        if (isAcceptingSuggestionRef.current || suggestionAcceptedRef.current) {
          editor.trigger("keyboard", "tab", null);
          return;
        }

        if (currentSuggestionRef.current && hasActiveSuggestionAtPosition()) {
          const accepted = acceptCurrentSuggestion();
          if (accepted) return;
        }

        editor.trigger("keyboard", "tab", null);
      },
      "editorTextFocus && !editorReadonly && !suggestWidgetVisible",
    );

    editor.addCommand(monaco.KeyCode.Escape, () => {
      if (currentSuggestionRef.current) {
        onRejectSuggestion(editor);
        clearCurrentSuggestion();
      }
    });

    editor.onDidChangeCursorPosition((e: any) => {
      if (isAcceptingSuggestionRef.current) return;

      if (currentSuggestionRef.current && !suggestionAcceptedRef.current) {
        const suggestionPos = currentSuggestionRef.current.position;
        if (
          e.position.lineNumber !== suggestionPos.line ||
          e.position.column < suggestionPos.column ||
          e.position.column > suggestionPos.column + 10
        ) {
          clearCurrentSuggestion();
          onRejectSuggestion(editor);
        }
      }

      if (!currentSuggestionRef.current && !suggestionLoading) {
        if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);
        suggestionTimeoutRef.current = setTimeout(() => {
          onTriggerSuggestion("completion", editor);
        }, 300);
      }
    });

    editor.onDidChangeModelContent((e: any) => {
      if (isAcceptingSuggestionRef.current) return;

      if (currentSuggestionRef.current && e.changes.length > 0 && !suggestionAcceptedRef.current) {
        const change = e.changes[0];
        if (
          change.text === currentSuggestionRef.current.text ||
          change.text === currentSuggestionRef.current.text.replace(/\r/g, "")
        ) {
          return;
        }
        clearCurrentSuggestion();
      }

      if (e.changes.length > 0 && !suggestionAcceptedRef.current) {
        const change = e.changes[0];
        if ("{.=,(:;".includes(change.text)) {
          setTimeout(() => {
            if (editorRef.current && !currentSuggestionRef.current && !suggestionLoading) {
              onTriggerSuggestion("completion", editor);
            }
          }, 100);
        }
      }
    });

    updateEditorLanguage();
  };

  const updateEditorLanguage = () => {
    if (!activeFile || !monacoRef.current || !editorRef.current) return;
    const model = editorRef.current.getModel();
    if (!model) return;
    const language = getEditorLanguage(activeFile.fileExtension || "");
    try {
      monacoRef.current.editor.setModelLanguage(model, language);
    } catch (error) {
      console.warn("Failed to set editor language:", error);
    }
  };

  useEffect(() => {
    updateEditorLanguage();
  }, [activeFile]);

  useEffect(() => {
    return () => {
      if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);
      if (inlineCompletionProviderRef.current) inlineCompletionProviderRef.current.dispose();
      if (tabCommandRef.current?.dispose) tabCommandRef.current.dispose();
    };
  }, []);

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    if (isAcceptingSuggestionRef.current || suggestionAcceptedRef.current) return;

    if (inlineCompletionProviderRef.current) {
      inlineCompletionProviderRef.current.dispose();
      inlineCompletionProviderRef.current = null;
    }

    currentSuggestionRef.current = null;

    if (suggestion && suggestionPosition) {
      const language = getEditorLanguage(activeFile?.fileExtension || "");
      const provider = createInlineCompletionProvider(monacoRef.current);
      inlineCompletionProviderRef.current = monacoRef.current.languages.registerInlineCompletionsProvider(language, provider);

      setTimeout(() => {
        if (editorRef.current && !isAcceptingSuggestionRef.current && !suggestionAcceptedRef.current) {
          editorRef.current.trigger("ai", "editor.action.inlineSuggest.trigger", null);
        }
      }, 50);
    }

    return () => {
      if (inlineCompletionProviderRef.current) {
        inlineCompletionProviderRef.current.dispose();
        inlineCompletionProviderRef.current = null;
      }
    };
  }, [suggestion, suggestionPosition, activeFile, createInlineCompletionProvider]);

  const handleEditorChange = (value: string | undefined) => {
    // Only update content if not in collaborative mode
    // In collaborative mode, Yjs MonacoBinding handles this
    if (!isCollaborativeMode && value !== undefined) {
      onContentChange(value);
    }
  };

  return (
    <div className="h-full relative">
      {/* Collaborative Mode Indicator */}
      {isCollaborativeMode && (
        <div className="absolute top-2 left-2 z-10 bg-green-100 dark:bg-green-900 px-2 py-1 rounded text-xs text-green-700 dark:text-green-300 flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Collaborative Mode
        </div>
      )}

      {/* Loading indicator */}
      {suggestionLoading && (
        <div className="absolute top-2 right-2 z-10 bg-red-100 dark:bg-red-900 px-2 py-1 rounded text-xs text-red-700 dark:text-red-300 flex items-center gap-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          AI thinking...
        </div>
      )}

      {currentSuggestionRef.current && !suggestionLoading && (
        <div className="absolute top-2 right-2 z-10 bg-green-100 dark:bg-green-900 px-2 py-1 rounded text-xs text-green-700 dark:text-green-300 flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          Press Tab to accept
        </div>
      )}

      <Editor
        height="100%"
        value={content}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        language={activeFile ? getEditorLanguage(activeFile.fileExtension || "") : "plaintext"}
        options={defaultEditorOptions}
      />
    </div>
  );
};