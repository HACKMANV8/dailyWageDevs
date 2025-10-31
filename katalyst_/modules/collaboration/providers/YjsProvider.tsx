// modules/collaboration/providers/YjsProvider.tsx
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { Awareness } from 'y-protocols/awareness';
import { initializeYjsDocument, YjsConfig } from '../lib/yjs-config';

interface YjsContextValue {
  ydoc: Y.Doc | null;
  provider: WebrtcProvider | null;
  awareness: Awareness | null;
  isConnected: boolean;
  activeUsers: Array<{ clientId: number; name: string; color: string }>;
  updateUsername: (name: string) => void;
  updateUserColor: (color: string) => void;
}

const YjsContext = createContext<YjsContextValue | null>(null);

export const useYjs = () => {
  const context = useContext(YjsContext);
  if (!context) {
    throw new Error('useYjs must be used within YjsProvider');
  }
  return context;
};

interface YjsProviderProps {
  children: React.ReactNode;
  config: YjsConfig;
  enabled?: boolean;
}

export const YjsProvider: React.FC<YjsProviderProps> = ({ children, config, enabled = true }) => {
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<WebrtcProvider | null>(null);
  const [awareness, setAwareness] = useState<Awareness | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<Array<{ clientId: number; name: string; color: string }>>([]);

  // Initialize Yjs when enabled
  useEffect(() => {
    if (!enabled || !config.roomName) return;

    console.log('[Yjs] Initializing collaborative session:', config.roomName);
    
    const { ydoc: newYdoc, provider: newProvider } = initializeYjsDocument(config);
    
    setYdoc(newYdoc);
    setProvider(newProvider);
    setAwareness(newProvider.awareness);

    // Connection status listeners
    newProvider.on('status', (event: { status: string }) => {
      console.log('[Yjs] Connection status:', event.status);
      setIsConnected(event.status === 'connected');
    });

    newProvider.on('peers', (event: { added: number[]; removed: number[]; webrtcPeers: number[] }) => {
      console.log('[Yjs] Peers changed:', {
        added: event.added,
        removed: event.removed,
        total: event.webrtcPeers.length
      });
    });

    // Update active users when awareness changes
    const updateUsers = () => {
      const users: Array<{ clientId: number; name: string; color: string }> = [];
      newProvider.awareness.getStates().forEach((state, clientId) => {
        if (state.user) {
          users.push({
            clientId,
            name: state.user.name || 'Anonymous',
            color: state.user.color || '#888888'
          });
        }
      });
      setActiveUsers(users);
    };

    newProvider.awareness.on('change', updateUsers);
    updateUsers();

    // Cleanup
    return () => {
      console.log('[Yjs] Destroying collaborative session');
      newProvider.awareness.off('change', updateUsers);
      newProvider.destroy();
      newYdoc.destroy();
    };
  }, [enabled, config.roomName, config.username, config.userColor]);

  const updateUsername = useCallback((name: string) => {
    if (provider) {
      const currentUser = provider.awareness.getLocalState()?.user || {};
      provider.awareness.setLocalStateField('user', {
        ...currentUser,
        name
      });
    }
  }, [provider]);

  const updateUserColor = useCallback((color: string) => {
    if (provider) {
      const currentUser = provider.awareness.getLocalState()?.user || {};
      provider.awareness.setLocalStateField('user', {
        ...currentUser,
        color
      });
    }
  }, [provider]);

  const value: YjsContextValue = {
    ydoc,
    provider,
    awareness,
    isConnected,
    activeUsers,
    updateUsername,
    updateUserColor
  };

  return <YjsContext.Provider value={value}>{children}</YjsContext.Provider>;
};