import MockWebSocketServer from './mockWebSocketServer';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.messageQueue = [];
    this.eventListeners = new Map();
    this.heartbeatInterval = null;
    this.connectionTimeout = null;
    
    // For demo purposes, we'll simulate WebSocket behavior
    this.mockServer = new MockWebSocketServer();
    this.connectionId = null;
  }

  // Connect to WebSocket server (simulated for demo)
  connect(url = 'wss://echo.websocket.org') {
    try {
      // Simulate connection delay
      setTimeout(() => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.flushMessageQueue();
        this.emit('connected');
        console.log('WebSocket connected! (Demo Mode)');
      }, 1000);
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.handleReconnect();
    }
  }

  // Setup WebSocket event handlers (simulated)
  setupEventHandlers() {
    // This is handled by the mock server in demo mode
  }

  // Handle incoming messages (simulated)
  handleMessage(data) {
    const { type, payload, timestamp, userId } = data;
    
    // Add timestamp if not present
    if (!timestamp) {
      data.timestamp = new Date().toISOString();
    }

    // Emit event for this message type
    this.emit(type, payload, data);
    
    // Also emit a generic message event
    this.emit('message', data);
  }

  // Send message to server (simulated)
  send(type, payload) {
    const message = {
      type,
      payload,
      timestamp: new Date().toISOString(),
      messageId: this.generateMessageId()
    };

    if (this.isConnected) {
      // Simulate message being sent to mock server
      this.mockServer.handleMessage(this.connectionId, JSON.stringify(message));
      
      // Simulate response delay for certain message types
      if (type === 'chat_message') {
        setTimeout(() => {
          this.handleMessage({
            type: 'chat_message',
            payload: {
              ...payload,
              timestamp: new Date().toISOString()
            }
          });
        }, 500);
      }
    } else {
      // Queue message if not connected
      this.messageQueue.push(message);
    }
  }

  // Send chat message
  sendChatMessage(projectId, message, userId) {
    this.send('chat_message', {
      projectId,
      message,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  // Send typing indicator
  sendTypingIndicator(projectId, userId, isTyping) {
    this.send('typing_indicator', {
      projectId,
      userId,
      isTyping
    });
  }

  // Send project update
  sendProjectUpdate(projectId, updateType, data) {
    this.send('project_update', {
      projectId,
      updateType,
      data,
      timestamp: new Date().toISOString()
    });
  }

  // Send presence update
  sendPresenceUpdate(userId, status) {
    this.send('presence_update', {
      userId,
      status,
      timestamp: new Date().toISOString()
    });
  }

  // Join project room
  joinProject(projectId) {
    this.send('join_project', { projectId });
    
    // Simulate other users joining
    setTimeout(() => {
      this.emit('user_joined', {
        userId: 'csm-1',
        projectId,
        userInfo: { id: 'csm-1', name: 'Sarah Johnson', role: 'CSM' }
      });
    }, 2000);
  }

  // Leave project room
  leaveProject(projectId) {
    this.send('leave_project', { projectId });
  }

  // Event listener management
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const callbacks = this.eventListeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, ...args) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Heartbeat to keep connection alive (simulated)
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.send('ping', { timestamp: Date.now() });
      }
    }, 30000); // Send ping every 30 seconds
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Connection timeout (simulated)
  startConnectionTimeout() {
    this.connectionTimeout = setTimeout(() => {
      if (!this.isConnected) {
        console.log('Connection timeout, attempting reconnect...');
        this.handleReconnect();
      }
    }, 10000); // 10 second timeout
  }

  // Reconnection logic (simulated)
  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        if (!this.isConnected) {
          this.connect();
        }
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('reconnect_failed');
    }
  }

  // Flush queued messages
  flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (this.isConnected) {
        this.send(message.type, message.payload);
      }
    }
  }

  // Generate unique message ID
  generateMessageId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Disconnect
  disconnect() {
    this.isConnected = false;
    this.stopHeartbeat();
    this.emit('disconnected', { code: 1000, reason: 'User initiated disconnect' });
  }

  // Get connection status
  getStatus() {
    return {
      isConnected: this.isConnected,
      readyState: this.isConnected ? 1 : 3, // 1 = OPEN, 3 = CLOSED
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;
