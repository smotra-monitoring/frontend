/**
 * Mock WebSocket messages for testing
 */

import type {
    WebSocketMessage,
    Agent,
    SystemNotificationMessage,
} from '../../src/types/websocket-types.js';

export const mockAgentUpdateMessage: WebSocketMessage<Agent> = {
    type: 'agent:update',
    payload: {
        id: '01930000-0000-7000-a001-000000000001', // Matches mockAgent.id
        workspace_id: '01930000-0000-7000-0000-000000000001',
        name: 'Test Agent 1',
        config_version_desired: 4,
        config_version_current: 4,
        agent_version: '1.0.1',
        ip_addresses: [
            { ip: '192.168.1.100', iface: 'eth0', family: 'ipv4', recommended: true },
        ],
        last_seen_at: new Date(),
        last_result_submitted_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
    },
    timestamp: Date.now(),
};

export const mockAgentAddedMessage: WebSocketMessage<any> = {
    type: 'agent:added',
    payload: {
        id: 'agent-new',
        workspaceId: '01930000-0000-7000-0000-000000000001',
        name: 'New Agent',
        agentVersion: '1.0.0',
        configVersionDesired: 2,
        configVersionCurrent: null,
        lastSeenAt: new Date(),
        ipAddresses: [
            {
                ip: '192.168.1.200',
                interface: 'eth0',
            }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    timestamp: Date.now(),
};

export const mockAgentRemovedMessage: WebSocketMessage<any> = {
    type: 'agent:removed',
    payload: {
        id: '01930000-0000-7000-a001-000000000001', // Matches mockAgent.id
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
