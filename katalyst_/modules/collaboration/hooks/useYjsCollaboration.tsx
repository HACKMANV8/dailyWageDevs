// modules/collaboration/hooks/useYjsCollaboration.tsx
"use client";

import { useEffect, useRef, useCallback } from 'react';
import { editor as MonacoEditor } from 'monaco-editor';
import { MonacoBinding } from 'y-monaco';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { Awareness } from 'y-protocols/awareness';
import { useYjs } from '../providers/YjsProvider';

interface UseYjsCollaborationProps {
  editor: MonacoEditor.IStandaloneCodeEditor | null;
  monaco: typeof import('monaco-editor') | null;
  fileId: string;
  enabled?: boolean;
}

export const useYjsCollaboration = ({
  editor,
  monaco,
  fileId,
  enabled = true
}: UseYjsCollaborationProps) => {
  const { ydoc, provider, awareness } = useYjs();
  const bindingRef = useRef<MonacoBinding | null>(null);
  const yTextRef = useRef<Y.Text | null>(null);

  useEffect(() => {
    if (!enabled || !editor || !monaco || !ydoc || !provider || !awareness) {
      console.log('[YjsCollaboration] Skipping setup:', {
        enabled,
        hasEditor: !!editor,
        hasMonaco: !!monaco,
        hasYdoc: !!ydoc,
        hasProvider: !!provider,
        hasAwareness: !!awareness
      });
      return;
    }

    console.log('[YjsCollaboration] Setting up for file:', fileId);

    try {
      // Get or create Y.Text for this specific file
      const yText = ydoc.getText(`monaco-${fileId}`);
      yTextRef.current = yText;

      // Get the editor model
      const model = editor.getModel();
      if (!model) {
        console.error('[YjsCollaboration] No editor model available');
        return;
      }

      // Create Monaco binding
      // This connects the Monaco editor to the Yjs document
      const binding = new MonacoBinding(
        yText,
        model,
        new Set([editor]),
        awareness as Awareness
      );

      bindingRef.current = binding;
      console.log('[YjsCollaboration] MonacoBinding created successfully');

      // Cleanup function
      return () => {
        console.log('[YjsCollaboration] Cleaning up binding for file:', fileId);
        if (bindingRef.current) {
          bindingRef.current.destroy();
          bindingRef.current = null;
        }
      };
    } catch (error) {
      console.error('[YjsCollaboration] Error setting up collaboration:', error);
    }
  }, [editor, monaco, ydoc, provider, awareness, fileId, enabled]);

  // Function to get current collaborative content
  const getCollaborativeContent = useCallback(() => {
    if (yTextRef.current) {
      return yTextRef.current.toString();
    }
    return null;
  }, []);

  // Function to update collaborative content (if needed manually)
  const setCollaborativeContent = useCallback((content: string) => {
    if (yTextRef.current && ydoc) {
      ydoc.transact(() => {
        yTextRef.current!.delete(0, yTextRef.current!.length);
        yTextRef.current!.insert(0, content);
      });
    }
  }, [ydoc]);

  return {
    binding: bindingRef.current,
    yText: yTextRef.current,
    getCollaborativeContent,
    setCollaborativeContent
  };