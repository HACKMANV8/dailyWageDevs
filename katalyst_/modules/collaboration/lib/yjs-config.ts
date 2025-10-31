// modules/collaboration/lib/yjs-config.ts
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { Awareness } from 'y-protocols/awareness';

export interface YjsConfig {
  roomName: string;
  username?: string;
  userColor?: string;
}

/**
 * Generate a random user color
 */
export const generateUserColor = (): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
    '#F8B500', '#6C5CE7', '#00B894', '#FD79A8'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Generate a random username
 */
export const generateUsername = (): string => {
  const adjectives = ['Happy', 'Swift', 'Clever', 'Bright', 'Bold', 'Quick'];
  const nouns = ['Coder', 'Dev', 'Hacker', 'Builder', 'Maker', 'Creator'];
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
};

/**
 * Initialize Yjs document with WebRTC provider
 */
export const initializeYjsDocument = (config: YjsConfig) => {
  // Create Yjs document
  const ydoc = new Y.Doc();
  
  // Use public signaling servers (free, no setup required)
  const signalingServers = [
    'wss://signaling.yjs.dev',
    'wss://y-webrtc-signaling-eu.herokuapp.com',
    'wss://y-webrtc-signaling-us.herokuapp.com'
  ];

  // Create WebRTC provider (peer-to-peer, no central server needed)
  const provider = new WebrtcProvider(config.roomName, ydoc, {
    signaling: signalingServers,
    password: null, // Optional: add password protection
    awareness: new Awareness(ydoc),
    maxConns: 20 + Math.floor(Math.random() * 15), // Random connection limit
    filterBcConns: true, // Filter broadcast channel connections
    peerOpts: {} // Additional WebRTC peer options
  });

  // Set user information in awareness
  const username = config.username || generateUsername();
  const userColor = config.userColor || generateUserColor();
  
  provider.awareness.setLocalStateField('user', {
    name: username,
    color: userColor,
  });

  return { ydoc, provider };
};

/**
 * Get awareness users
 */
export const getAwarenessUsers = (awareness: Awareness) => {
  const users: Array<{ clientId: number; name: string; color: string }> = [];
  
  awareness.getStates().forEach((state, clientId) => {
    if (state.user) {
      users.push({
        clientId,
        name: state.user.name || 'Anonymous',
        color: state.user.color || '#888888'
      });
    }
  });
  
  return users;
};