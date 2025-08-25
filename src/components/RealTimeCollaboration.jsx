import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';

const RealTimeCollaboration = ({ projectId }) => {
  const {
    isConnected,
    connectionStatus,
    onlineUsers,
    typingUsers,
    projectUpdates,
    lastActivity,
    joinProject,
    leaveProject,
    updatePresence
  } = useWebSocket();

  const [currentUser] = useState({
    id: 'david',
    name: 'David',
    role: 'Customer',
    avatar: '👤'
  });

  // Join project room when component mounts
  useEffect(() => {
    if (isConnected && projectId) {
      joinProject(projectId);
      updatePresence(currentUser.id, 'online');
      
      return () => {
        leaveProject(projectId);
        updatePresence(currentUser.id, 'offline');
      };
    }
  }, [isConnected, projectId, joinProject, leaveProject, updatePresence, currentUser.id]);

  const getConnectionStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20';
      case 'connecting': return 'text-amber-600 bg-amber-100 dark:bg-amber-900/20';
      case 'disconnected': return 'text-slate-600 bg-slate-100 dark:bg-slate-900/20';
      case 'error': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'failed': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default: return 'text-slate-600 bg-slate-100 dark:bg-slate-900/20';
    }
  };

  const getConnectionStatusIcon = (status) => {
    switch (status) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'disconnected': return '⚪';
      case 'error': return '🔴';
      case 'failed': return '🔴';
      default: return '⚪';
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'chat_message': return '💬';
      case 'project_update': return '📝';
      case 'file_upload': return '📁';
      case 'status_change': return '🔄';
      default: return '📢';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${getConnectionStatusColor(connectionStatus)}`}>
        <span>{getConnectionStatusIcon(connectionStatus)}</span>
        <span className="capitalize">{connectionStatus}</span>
        {connectionStatus === 'connected' && (
          <span className="text-xs opacity-75">Real-time</span>
        )}
      </div>

      {/* Online Users */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border dark:border-slate-700">
        <h4 className="font-semibold text-sm mb-3 dark:text-white">Online Team Members</h4>
        <div className="space-y-2">
          {onlineUsers.length > 0 ? (
            onlineUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-700">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium dark:text-white">{user.name || user.id}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {formatTime(user.lastSeen)}
                </span>
              </div>
            ))
          ) : (
            <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-2">
              No other users online
            </div>
          )}
        </div>
      </div>

      {/* Typing Indicators */}
      {typingUsers.has(projectId) && typingUsers.get(projectId).size > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border dark:border-slate-700">
          <h4 className="font-semibold text-sm mb-3 dark:text-white">Currently Typing</h4>
          <div className="space-y-2">
            {Array.from(typingUsers.get(projectId)).map((userId) => (
              <div key={userId} className="flex items-center gap-3 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  {userId === currentUser.id ? 'You' : userId} is typing...
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {projectUpdates.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border dark:border-slate-700">
          <h4 className="font-semibold text-sm mb-3 dark:text-white">Recent Activity</h4>
          <div className="space-y-2">
            {projectUpdates.slice(0, 5).map((update) => (
              <div key={update.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200">
                <span className="text-lg">{getActivityIcon(update.updateType)}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium dark:text-white">
                    {update.updateType === 'status_change' && `${update.data.oldStatus} → ${update.data.newStatus}`}
                    {update.updateType === 'file_upload' && `File uploaded: ${update.data.fileName}`}
                    {update.updateType === 'chat_message' && `New message in chat`}
                    {update.updateType === 'project_update' && update.data.description}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {formatTime(update.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Activity */}
      {lastActivity && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border dark:border-slate-700">
          <h4 className="font-semibold text-sm mb-3 dark:text-white">Latest Update</h4>
          <div className="flex items-start gap-3 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
            <span className="text-lg">{getActivityIcon(lastActivity.type)}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                {lastActivity.type === 'chat_message' && 'New message received'}
                {lastActivity.type === 'project_update' && 'Project updated'}
              </div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                {formatTime(lastActivity.timestamp)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection Info */}
      <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
        {isConnected ? (
          <span>Connected to real-time server • Updates every few seconds</span>
        ) : (
          <span>Connecting to real-time server...</span>
        )}
      </div>
    </div>
  );
};

export default RealTimeCollaboration;
