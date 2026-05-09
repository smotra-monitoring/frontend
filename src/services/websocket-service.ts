/**
 * WebSocket service for real-time agent updates
 */

import type {
    WebSocketMessage,
    WebSocketState,
    WebSocketConfig,
    WebSocketEventHandler,
    AgentUpdateMessage,
    SystemNotificationMessage,
} from '../types/websocket-types.js';
import { createState, type Subscriber, type UnsubscribeFn } from '../state/global-state.js';
import { updateAgent, addAgent, removeAgent } from '../state/agent-state.js';
import { getValidAccessToken } from '../auth/token-manager.js';

// WebSocket connection state
const initialWSState: WebSocketState = {
    connected: false,
    reconnecting: false,
    lastHeartbeat: null,
    error: null,
};

const wsState = createState<WebSocketState>(initialWSState);

// WebSocket connection
let ws: WebSocket | null = null;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
let reconnectAttempts = 0;

// Event handlers for different message types
const eventHandlers = new Map<string, Set<WebSocketEventHandler>>();

// Default configuration
const defaultConfig: WebSocketConfig = {
    url: 'ws://localhost:8080/ws',
    reconnectInterval: 5000,
    heartbeatInterval: 30000,
    maxReconnectAttempts: 10,
};

let config: WebSocketConfig = defaultConfig;

/**
 * Initialize WebSocket connection
 */
export async function connect(customConfig?: Partial<WebSocketConfig>): Promise<boolean> {
    if (ws && ws.readyState === WebSocket.OPEN) {
        console.warn('WebSocket already connected');
        return true;
    }

    // Merge configuration
    config = { ...defaultConfig, ...customConfig };

    try {
        // Get authentication token
        const token = await getValidAccessToken();

        if (!token) {
            wsState.setState({ error: 'Not authenticated' });
            return false;
        }

        // Build WebSocket URL with token
        const url = new URL(config.url);
        url.searchParams.set('token', token);

        // Create WebSocket connection
        ws = new WebSocket(url.toString());

        // Set up event handlers
        ws.onopen = handleOpen;
        ws.onclose = handleClose;
        ws.onerror = handleError;
        ws.onmessage = handleMessage;

        return true;
    } catch (error) {
        console.error('WebSocket connection error:', error);
        wsState.setState({ error: error instanceof Error ? error.message : 'Connection failed' });
        return false;
    }
}

/**
 * Disconnect WebSocket
 */
export function disconnect(): void {
    // Clear intervals and timeouts
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }

    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }

    // Close WebSocket
    if (ws) {
        ws.close();
        ws = null;
    }

    wsState.setState({
        connected: false,
        reconnecting: false,
        lastHeartbeat: null,
        error: null,
    });

    reconnectAttempts = 0;
}

/**
 * Handle WebSocket open event
 */
function handleOpen(): void {
    console.log('WebSocket connected');

    wsState.setState({
        connected: true,
        reconnecting: false,
        error: null,
    });

    reconnectAttempts = 0;

    // Start heartbeat
    startHeartbeat();
}

/**
 * Handle WebSocket close event
 */
function handleClose(event: CloseEvent): void {
    console.log('WebSocket closed:', event.code, event.reason);

    wsState.setState({
        connected: false,
        error: event.reason || 'Connection closed',
    });

    // Stop heartbeat
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }

    // Attempt reconnection
    attemptReconnect();
}

/**
 * Handle WebSocket error event
 */
function handleError(event: Event): void {
    console.error('WebSocket error:', event);
    wsState.setState({ error: 'Connection error' });
}

/**
 * Handle incoming WebSocket message
 */
function handleMessage(event: MessageEvent): void {
    try {
        const message: WebSocketMessage = JSON.parse(event.data);

        // Update last heartbeat timestamp
        if (message.type === 'connection:heartbeat') {
            wsState.setState({ lastHeartbeat: Date.now() });
            return;
        }

        // Handle different message types
        switch (message.type) {
            case 'agent:update':
            case 'agent:metrics':
                handleAgentUpdate(message.payload);
                break;

            case 'agent:added':
                handleAgentAdded(message.payload);
                break;

            case 'agent:removed':
                handleAgentRemoved(message.payload);
                break;

            case 'system:notification':
                handleSystemNotification(message.payload);
                break;
        }

        // Notify registered handlers
        notifyHandlers(message.type, message);
    } catch (error) {
        console.error('Error handling WebSocket message:', error);
    }
}

/**
 * Handle agent update message
 */
function handleAgentUpdate(data: AgentUpdateMessage): void {
    updateAgent(data);
}

/**
 * Handle agent added message
 */
function handleAgentAdded(agent: any): void {
    addAgent(agent);
}

/**
 * Handle agent removed message
 */
function handleAgentRemoved(data: { id: string }): void {
    removeAgent(data.id);
}

/**
 * Handle system notification message
 */
function handleSystemNotification(data: SystemNotificationMessage): void {
    // Dispatch event for toast notifications
    const event = new CustomEvent('system:notification', { detail: data });
    window.dispatchEvent(event);
}

/**
 * Attempt to reconnect WebSocket
 */
function attemptReconnect(): void {
    if (reconnectAttempts >= config.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        wsState.setState({ error: 'Connection failed after maximum retries' });
        return;
    }

    wsState.setState({ reconnecting: true });
    reconnectAttempts++;

    console.log(`Attempting to reconnect (${reconnectAttempts}/${config.maxReconnectAttempts})...`);

    reconnectTimeout = setTimeout(() => {
        connect();
    }, config.reconnectInterval);
}

/**
 * Start heartbeat interval
 */
function startHeartbeat(): void {
    if (heartbeatInterval) {
        return;
    }

    heartbeatInterval = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            send({ type: 'connection:heartbeat', payload: {}, timestamp: Date.now() });
        }
    }, config.heartbeatInterval);
}

/**
 * Send message through WebSocket
 */
export function send(message: WebSocketMessage): boolean {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.warn('WebSocket not connected');
        return false;
    }

    try {
        ws.send(JSON.stringify(message));
        return true;
    } catch (error) {
        console.error('Error sending WebSocket message:', error);
        return false;
    }
}

/**
 * Subscribe to specific message type
 */
export function on<T = any>(type: string, handler: WebSocketEventHandler<T>): () => void {
    if (!eventHandlers.has(type)) {
        eventHandlers.set(type, new Set());
    }

    eventHandlers.get(type)!.add(handler as WebSocketEventHandler);

    // Return unsubscribe function
    return () => {
        const handlers = eventHandlers.get(type);
        if (handlers) {
            handlers.delete(handler as WebSocketEventHandler);
        }
    };
}

/**
 * Notify registered handlers of message
 */
function notifyHandlers(type: string, message: WebSocketMessage): void {
    const handlers = eventHandlers.get(type);

    if (handlers) {
        handlers.forEach(handler => {
            try {
                handler(message);
            } catch (error) {
                console.error(`Error in WebSocket handler for ${type}:`, error);
            }
        });
    }
}

/**
 * Get current WebSocket state
 */
export function getWebSocketState(): WebSocketState {
    return wsState.getState();
}

/**
 * Subscribe to WebSocket state changes
 */
export function subscribeToState(callback: Subscriber<WebSocketState>): UnsubscribeFn {
    return wsState.subscribe(callback);
}

/**
 * Check if WebSocket is connected
 */
export function isConnected(): boolean {
    return wsState.getState().connected;
}
