/**
 * Mock WebSocket messages for testing
 */

import type {
    WebSocketMessage,
    AgentUpdateMessage,
    SystemNotificationMessage,
} from '../../src/types/websocket-types.js';

export const mockAgentUpdateMessage: WebSocketMessage<AgentUpdateMessage> = {
    type: 'agent:update',
    payload: {
        id: 'agent-1',
        status: 'online',
        metrics: {
            latency: 30,
            reachability: 99.8,
        },
        lastSeen: Date.now(),
    },
    timestamp: Date.now(),
};

export const mockAgentAddedMessage: WebSocketMessage<any> = {
    type: 'agent:added',
    payload: {
        id: 'agent-new',
        name: 'New Agent',
        hostname: 'new-host',
        ipAddress: '192.168.1.200',
        status: 'online',
        version: '1.0.0',
        lastSeen: Date.now(),
        metrics: {
            latency: 20,
            uptime: 100,
            reachability: 100,
            responseTime: 100,
        },
        tags: [],
    },
    timestamp: Date.now(),
};

export const mockAgentRemovedMessage: WebSocketMessage<any> = {
    type: 'agent:removed',
    payload: {
        id: 'agent-1',
    },
    timestamp: Date.now(),
};

export const mockSystemNotification: WebSocketMessage<SystemNotificationMessage> = {
    type: 'system:notification',
    payload: {
        severity: 'warning',
        title: 'System Alert',
        message: 'Agent connectivity issue detected',
        actions: [
            {
                label: 'View Details',
                action: 'view-agent',
            },
        ],
    },
    timestamp: Date.now(),
};

export const mockConnectionAck: WebSocketMessage<any> = {
    type: 'connection:ack',
    payload: {
        sessionId: 'session-123',
        connectedAt: Date.now(),
    },
    timestamp: Date.now(),
};

export const mockHeartbeat: WebSocketMessage<any> = {
    type: 'connection:heartbeat',
    payload: {
        serverTime: Date.now(),
    },
    timestamp: Date.now(),
};

export class MockWebSocket {
    public onopen: ((event: Event) => void) | null = null;
    public onclose: ((event: CloseEvent) => void) | null = null;
    public onerror: ((event: Event) => void) | null = null;
    public onmessage: ((event: MessageEvent) => void) | null = null;
    public readyState = WebSocket.CONNECTING | WebSocket.OPEN | WebSocket.CLOSING | WebSocket.CLOSED;
    public url: string;

    constructor(url: string) {
        this.url = url;
        // Simulate connection after short delay
        setTimeout(() => {
            this.readyState = WebSocket.OPEN;
            if (this.onopen) {
                this.onopen(new Event('open'));
            }
        }, 10);
    }

    send(data: string): void {
        // Mock send - do nothing
    }

    close(): void {
        (this as any).readyState = WebSocket.CLOSED;
        if (this.onclose) {
            this.onclose(new CloseEvent('close'));
        }
    }

    simulateMessage(message: WebSocketMessage<any>): void {
        if (this.onmessage) {
            this.onmessage(new MessageEvent('message', { data: JSON.stringify(message) }));
        }
    }

    simulateError(): void {
        if (this.onerror) {
            this.onerror(new Event('error'));
        }
    }
}
