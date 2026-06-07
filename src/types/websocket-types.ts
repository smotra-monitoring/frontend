/**
 * WebSocket communication type definitions
 */

import type { AgentPartialUpdate } from './agent-types.js';

// Re-export AgentPartialUpdate for convenience
export type { AgentPartialUpdate };

export interface WebSocketMessage<T = any> {
  type: WebSocketMessageType;
  payload: T;
  timestamp: number;
}

export type WebSocketMessageType =
  | 'agent:update'
  | 'agent:status'
  | 'agent:metrics'
  | 'agent:added'
  | 'agent:removed'
  | 'system:notification'
  | 'connection:ack'
  | 'connection:heartbeat';

export interface SystemNotificationMessage {
  severity: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: string;
}

export interface WebSocketState {
  connected: boolean;
  reconnecting: boolean;
  lastHeartbeat: number | null;
  error: string | null;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval: number; // milliseconds
  heartbeatInterval: number; // milliseconds
  maxReconnectAttempts: number;
}

export interface WebSocketEventHandler<T = any> {
  (message: WebSocketMessage<T>): void;
}
