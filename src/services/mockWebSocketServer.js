// Mock WebSocket Server for Demo Purposes
// This simulates a real WebSocket server to demonstrate real-time collaboration

class MockWebSocketServer {
  constructor() {
    this.connections = new Map();
    this.projectRooms = new Map();
    this.mockUsers = [
      { id: 'csm-1', name: 'Sarah Johnson', role: 'CSM', status: 'online' },
      { id: 'pm-1', name: 'Mike Chen', role: 'PM', status: 'online' },
      { id: 'dev-1', name: 'Alex Rodriguez', role: 'Expert', status: 'online' },
      { id: 'david', name: 'David Hamilton', role: 'Customer', status: 'online' }
    ];
    
    this.startMockActivity();
  }

  // Simulate user joining/leaving projects
  startMockActivity() {
    setInterval(() => {
      this.simulateUserActivity();
    }, 8000); // Every 8 seconds
  }

  simulateUserActivity() {
    const activities = [
      {
        type: 'project_update',
        data: {
          updateType: 'status_change',
          oldStatus: 'In Progress',
          newStatus: 'Review',
          description: 'Project moved to review phase'
        }
      },
      {
        type: 'file_upload',
        data: {
          fileName: 'requirements-v2.pdf',
          fileSize: '2.4 MB',
          uploadedBy: 'PM'
        }
      },
      {
        type: 'chat_message',
        data: {
          message: 'I\'ve reviewed the latest changes. Everything looks great!',
          role: 'CSM'
        }
      }
    ];

    const randomActivity = activities[Math.floor(Math.random() * activities.length)];
    this.broadcastToAllProjects(randomActivity.type, randomActivity.data);
  }

  // Handle new WebSocket connection
  handleConnection(ws, projectId) {
    const connectionId = Date.now().toString();
    this.connections.set(connectionId, { ws, projectId });
    
    // Join project room
    if (!this.projectRooms.has(projectId)) {
      this.projectRooms.set(projectId, new Set());
    }
    this.projectRooms.get(projectId).add(connectionId);

    // Send welcome message
    this.sendToConnection(connectionId, 'connected', {
      message: 'Connected to project room',
      projectId,
      timestamp: new Date().toISOString()
    });

    // Simulate other users joining
    setTimeout(() => {
      this.simulateUserJoining(projectId);
    }, 2000);

    return connectionId;
  }

  // Simulate user joining project
  simulateUserJoining(projectId) {
    const randomUser = this.mockUsers[Math.floor(Math.random() * this.mockUsers.length)];
    this.broadcastToProject(projectId, 'user_joined', {
      userId: randomUser.id,
      projectId,
      userInfo: randomUser
    });
  }

  // Handle incoming message
  handleMessage(connectionId, message) {
    try {
      const data = JSON.parse(message);
      const connection = this.connections.get(connectionId);
      
      if (!connection) return;

      switch (data.type) {
        case 'chat_message':
          this.handleChatMessage(connectionId, data.payload);
          break;
        case 'typing_indicator':
          this.handleTypingIndicator(connectionId, data.payload);
          break;
        case 'join_project':
          this.handleJoinProject(connectionId, data.payload);
          break;
        case 'leave_project':
          this.handleLeaveProject(connectionId, data.payload);
          break;
        case 'ping':
          this.sendToConnection(connectionId, 'pong', { timestamp: Date.now() });
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  // Handle chat message
  handleChatMessage(connectionId, payload) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Broadcast to all users in the project
    this.broadcastToProject(connection.projectId, 'chat_message', {
      ...payload,
      timestamp: new Date().toISOString()
    });

    // Simulate team member response after a delay
    setTimeout(() => {
      this.simulateTeamResponse(connection.projectId, payload);
    }, 3000 + Math.random() * 4000);
  }

  // Simulate team member response
  simulateTeamResponse(projectId, userMessage) {
    const responses = [
      {
        role: 'CSM',
        message: 'Thanks for the update! I\'ll review this and get back to you shortly.'
      },
      {
        role: 'PM',
        message: 'Great question! Let me check our project timeline and provide you with an update.'
      },
      {
        role: 'Expert',
        message: 'I can help with that technical question. Let me prepare a detailed response.'
      }
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    this.broadcastToProject(projectId, 'chat_message', {
      projectId,
      message: randomResponse.message,
      userId: `${randomResponse.role.toLowerCase()}-1`,
      role: randomResponse.role,
      timestamp: new Date().toISOString()
    });
  }

  // Handle typing indicator
  handleTypingIndicator(connectionId, payload) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    this.broadcastToProject(connection.projectId, 'typing_indicator', {
      ...payload,
      timestamp: new Date().toISOString()
    });
  }

  // Handle project join
  handleJoinProject(connectionId, payload) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Update project room
    if (!this.projectRooms.has(payload.projectId)) {
      this.projectRooms.set(payload.projectId, new Set());
    }
    this.projectRooms.get(payload.projectId).add(connectionId);
    connection.projectId = payload.projectId;

    // Notify other users
    this.broadcastToProject(payload.projectId, 'user_joined', {
      userId: 'david',
      projectId: payload.projectId,
      userInfo: { id: 'david', name: 'David Hamilton', role: 'Customer' }
    });
  }

  // Handle project leave
  handleLeaveProject(connectionId, payload) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Remove from project room
    if (this.projectRooms.has(payload.projectId)) {
      this.projectRooms.get(payload.projectId).delete(connectionId);
    }

    // Notify other users
    this.broadcastToProject(payload.projectId, 'user_left', {
      userId: 'david',
      projectId: payload.projectId
    });
  }

  // Send message to specific connection
  sendToConnection(connectionId, type, payload) {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.ws) return;

    const message = {
      type,
      payload,
      timestamp: new Date().toISOString(),
      messageId: Date.now().toString()
    };

    try {
      connection.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending to connection:', error);
      this.removeConnection(connectionId);
    }
  }

  // Broadcast to all connections in a project
  broadcastToProject(projectId, type, payload) {
    const room = this.projectRooms.get(projectId);
    if (!room) return;

    room.forEach(connectionId => {
      this.sendToConnection(connectionId, type, payload);
    });
  }

  // Broadcast to all projects
  broadcastToAllProjects(type, payload) {
    this.projectRooms.forEach((room, projectId) => {
      this.broadcastToProject(projectId, type, payload);
    });
  }

  // Remove connection
  removeConnection(connectionId) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      // Remove from project room
      if (connection.projectId && this.projectRooms.has(connection.projectId)) {
        this.projectRooms.get(connection.projectId).delete(connectionId);
      }
      
      this.connections.delete(connectionId);
    }
  }

  // Get connection count
  getConnectionCount() {
    return this.connections.size;
  }

  // Get project room count
  getProjectRoomCount() {
    return this.projectRooms.size;
  }
}

export default MockWebSocketServer;
