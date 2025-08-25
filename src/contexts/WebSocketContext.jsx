import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import webSocketService from '../services/websocket';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Map());
  const [projectUpdates, setProjectUpdates] = useState([]);
  const [lastActivity, setLastActivity] = useState(null);

  // Initialize WebSocket connection
  useEffect(() => {
    // Connect to WebSocket server
    webSocketService.connect();

    // Listen for connection events
    const handleConnected = () => {
      setIsConnected(true);
      setConnectionStatus('connected');
      console.log('WebSocket connected successfully!');
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      setConnectionStatus('disconnected');
      console.log('WebSocket disconnected');
    };

    const handleError = (error) => {
      setConnectionStatus('error');
      console.error('WebSocket error:', error);
    };

    const handleReconnectFailed = () => {
      setConnectionStatus('failed');
      console.error('WebSocket reconnection failed');
    };

    // Listen for real-time events
    const handleChatMessage = (payload, data) => {
      setLastActivity({
        type: 'chat_message',
        data: payload,
        timestamp: data.timestamp
      });
    };

    const handleTypingIndicator = (payload) => {
      const { projectId, userId, isTyping } = payload;
      
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        if (isTyping) {
          if (!newMap.has(projectId)) {
            newMap.set(projectId, new Set());
          }
          newMap.get(projectId).add(userId);
        } else {
          if (newMap.has(projectId)) {
            newMap.get(projectId).delete(userId);
            if (newMap.get(projectId).size === 0) {
              newMap.delete(projectId);
            }
          }
        }
        return newMap;
      });
    };

    const handleProjectUpdate = (payload, data) => {
      setProjectUpdates(prev => [{
        ...payload,
        timestamp: data.timestamp,
        id: data.messageId
      }, ...prev.slice(0, 9)]); // Keep last 10 updates

      setLastActivity({
        type: 'project_update',
        data: payload,
        timestamp: data.timestamp
      });
    };

    const handlePresenceUpdate = (payload) => {
      const { userId, status } = payload;
      
      setOnlineUsers(prev => {
        if (status === 'online') {
          if (!prev.find(user => user.id === userId)) {
            return [...prev, { id: userId, status, lastSeen: new Date().toISOString() }];
          }
        } else if (status === 'offline') {
          return prev.map(user => 
            user.id === userId 
              ? { ...user, status: 'offline', lastSeen: new Date().toISOString() }
              : user
          );
        }
        return prev;
      });
    };

    const handleUserJoined = (payload) => {
      const { userId, projectId, userInfo } = payload;
      console.log(`User ${userId} joined project ${projectId}`);
    };

    const handleUserLeft = (payload) => {
      const { userId, projectId } = payload;
      console.log(`User ${userId} left project ${projectId}`);
    };

    // Register event listeners
    webSocketService.on('connected', handleConnected);
    webSocketService.on('disconnected', handleDisconnected);
    webSocketService.on('error', handleError);
    webSocketService.on('reconnect_failed', handleReconnectFailed);
    webSocketService.on('chat_message', handleChatMessage);
    webSocketService.on('typing_indicator', handleTypingIndicator);
    webSocketService.on('project_update', handleProjectUpdate);
    webSocketService.on('presence_update', handlePresenceUpdate);
    webSocketService.on('user_joined', handleUserJoined);
    webSocketService.on('user_left', handleUserLeft);

    // Cleanup on unmount
    return () => {
      webSocketService.off('connected', handleConnected);
      webSocketService.off('disconnected', handleDisconnected);
      webSocketService.off('error', handleError);
      webSocketService.off('reconnect_failed', handleReconnectFailed);
      webSocketService.off('chat_message', handleChatMessage);
      webSocketService.off('typing_indicator', handleTypingIndicator);
      webSocketService.off('project_update', handleProjectUpdate);
      webSocketService.off('presence_update', handlePresenceUpdate);
      webSocketService.off('user_joined', handleUserJoined);
      webSocketService.off('user_left', handleUserLeft);
      webSocketService.disconnect();
    };
  }, []);

  // Send chat message
  const sendChatMessage = useCallback((projectId, message, userId) => {
    webSocketService.sendChatMessage(projectId, message, userId);
  }, []);

  // Send typing indicator
  const sendTypingIndicator = useCallback((projectId, userId, isTyping) => {
    webSocketService.sendTypingIndicator(projectId, userId, isTyping);
  }, []);

  // Send project update
  const sendProjectUpdate = useCallback((projectId, updateType, data) => {
    webSocketService.sendProjectUpdate(projectId, updateType, data);
  }, []);

  // Join project room
  const joinProject = useCallback((projectId) => {
    webSocketService.joinProject(projectId);
  }, []);

  // Leave project room
  const leaveProject = useCallback((projectId) => {
    webSocketService.leaveProject(projectId);
  }, []);

  // Update presence
  const updatePresence = useCallback((userId, status) => {
    webSocketService.sendPresenceUpdate(userId, status);
  }, []);

  // Get typing users for a specific project
  const getTypingUsers = useCallback((projectId) => {
    return Array.from(typingUsers.get(projectId) || []);
  }, [typingUsers]);

  // Check if user is typing in a project
  const isUserTyping = useCallback((projectId, userId) => {
    return typingUsers.get(projectId)?.has(userId) || false;
  }, [typingUsers]);

  const value = {
    // Connection state
    isConnected,
    connectionStatus,
    
    // Real-time data
    onlineUsers,
    typingUsers,
    projectUpdates,
    lastActivity,
    
    // Methods
    sendChatMessage,
    sendTypingIndicator,
    sendProjectUpdate,
    joinProject,
    leaveProject,
    updatePresence,
    getTypingUsers,
    isUserTyping,
    
    // Service access
    webSocketService
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
