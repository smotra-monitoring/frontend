/**
 * Tests for the WebSocket service
 */

import { vi, type Mock } from 'vitest';

vi.mock('../../../src/auth/token-manager.js', () => ({ getValidAccessToken: vi.fn() }));
vi.mock('../../../src/state/agent-state.js', () => ({
    updateAgent: vi.fn(),
    addAgent: vi.fn(),
    removeAgent: vi.fn(),
}));

class FakeWebSocket {
    static OPEN = 1;
    static CLOSED = 3;
    static instances: FakeWebSocket[] = [];

    readyState = 0;
    sent: string[] = [];
    onopen: (() => void) | null = null;
    onclose: ((e: Partial<CloseEvent>) => void) | null = null;
    onerror: ((e: Event) => void) | null = null;
    onmessage: ((e: MessageEvent) => void) | null = null;

    constructor(public url: string) {
        FakeWebSocket.instances.push(this);
    }

    send(data: string) { this.sent.push(data); }
    close() { this.readyState = FakeWebSocket.CLOSED; }

    open() {
        this.readyState = FakeWebSocket.OPEN;
        this.onopen?.();
    }
    drop() {
        this.readyState = FakeWebSocket.CLOSED;
        this.onclose?.({ code: 1006, reason: '' });
    }
    receive(message: unknown) {
        this.onmessage?.({ data: JSON.stringify(message) } as MessageEvent);
    }
}

type WsModule = typeof import('../../../src/services/websocket-service.js');

describe('websocket-service', () => {
    let ws: WsModule;
    let getValidAccessToken: Mock;
    let agentState: { updateAgent: Mock; addAgent: Mock; removeAgent: Mock };

    const lastSocket = () => FakeWebSocket.instances[FakeWebSocket.instances.length - 1];

    beforeEach(async () => {
        vi.useFakeTimers();
        vi.resetModules();
        FakeWebSocket.instances = [];
        vi.stubGlobal('WebSocket', FakeWebSocket);
        vi.spyOn(console, 'log').mockImplementation(() => { });
        vi.spyOn(console, 'warn').mockImplementation(() => { });
        vi.spyOn(console, 'error').mockImplementation(() => { });

        ws = await import('../../../src/services/websocket-service.js');
        ({ getValidAccessToken } = (await import('../../../src/auth/token-manager.js')) as any);
        agentState = (await import('../../../src/state/agent-state.js')) as any;
        getValidAccessToken.mockResolvedValue('tok');
    });

    afterEach(() => {
        ws.disconnect();
        vi.useRealTimers();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    describe('connect', () => {
        it('opens a socket with the token in the query string', async () => {
            expect(await ws.connect_for_tests({ url: 'ws://host/ws' })).toBe(true);

            expect(new URL(lastSocket().url).searchParams.get('token')).toBe('tok');
        });

        it('fails without opening a socket when not authenticated', async () => {
            getValidAccessToken.mockResolvedValue(null);

            expect(await ws.connect_for_tests()).toBe(false);
            expect(FakeWebSocket.instances).toHaveLength(0);
            expect(ws.getWebSocketState().error).toBe('Not authenticated');
        });

        it('does not open a second socket while already connected', async () => {
            await ws.connect_for_tests();
            lastSocket().open();

            expect(await ws.connect_for_tests()).toBe(true);
            expect(FakeWebSocket.instances).toHaveLength(1);
        });

        it('marks the state as connected once the socket opens', async () => {
            await ws.connect_for_tests();
            lastSocket().open();

            expect(ws.isConnected()).toBe(true);
        });
    });

    describe('messages', () => {
        beforeEach(async () => {
            await ws.connect_for_tests();
            lastSocket().open();
        });

        it('routes agent messages to agent state', () => {
            lastSocket().receive({ type: 'agent:update', payload: { id: 'a1' } });
            lastSocket().receive({ type: 'agent:added', payload: { id: 'a2' } });
            lastSocket().receive({ type: 'agent:removed', payload: { id: 'a3' } });

            expect(agentState.updateAgent).toHaveBeenCalledWith({ id: 'a1' });
            expect(agentState.addAgent).toHaveBeenCalledWith({ id: 'a2' });
            expect(agentState.removeAgent).toHaveBeenCalledWith('a3');
        });

        it('dispatches system notifications as a window event', () => {
            const listener = vi.fn();
            window.addEventListener('system:notification', listener);

            lastSocket().receive({ type: 'system:notification', payload: { message: 'hi', severity: 'info' } });

            window.removeEventListener('system:notification', listener);
            expect(listener).toHaveBeenCalledTimes(1);
            expect((listener.mock.calls[0][0] as CustomEvent).detail.message).toBe('hi');
        });

        it('records heartbeat time without notifying handlers', () => {
            const handler = vi.fn();
            ws.on('connection:heartbeat', handler);

            lastSocket().receive({ type: 'connection:heartbeat', payload: {} });

            expect(ws.getWebSocketState().lastHeartbeat).not.toBeNull();
            expect(handler).not.toHaveBeenCalled();
        });

        it('notifies registered handlers until they unsubscribe', () => {
            const handler = vi.fn();
            const off = ws.on('agent:update', handler);

            lastSocket().receive({ type: 'agent:update', payload: { id: 'a1' } });
            off();
            lastSocket().receive({ type: 'agent:update', payload: { id: 'a1' } });

            expect(handler).toHaveBeenCalledTimes(1);
        });

        it('keeps processing when a handler throws', () => {
            const good = vi.fn();
            ws.on('agent:update', () => { throw new Error('bad handler'); });
            ws.on('agent:update', good);

            lastSocket().receive({ type: 'agent:update', payload: { id: 'a1' } });

            expect(good).toHaveBeenCalled();
        });

        it('ignores malformed JSON', () => {
            expect(() => lastSocket().onmessage?.({ data: '{not json' } as MessageEvent)).not.toThrow();
        });
    });

    describe('send', () => {
        it('returns false when not connected', () => {
            expect(ws.send({ type: 'x', payload: {}, timestamp: 1 } as any)).toBe(false);
        });

        it('serializes the message when connected', async () => {
            await ws.connect_for_tests();
            lastSocket().open();

            expect(ws.send({ type: 'x', payload: { a: 1 }, timestamp: 1 } as any)).toBe(true);
            expect(JSON.parse(lastSocket().sent[0]).type).toBe('x');
        });

        it('sends heartbeats on the configured interval', async () => {
            await ws.connect_for_tests({ heartbeatInterval: 1000 });
            lastSocket().open();

            vi.advanceTimersByTime(2000);

            expect(lastSocket().sent.length).toBe(2);
        });
    });

    describe('reconnect', () => {
        it('reconnects with backoff after the socket closes', async () => {
            await ws.connect_for_tests({ reconnectInterval: 1000 });
            lastSocket().open();

            lastSocket().drop();
            expect(ws.isConnected()).toBe(false);
            expect(ws.getWebSocketState().reconnecting).toBe(true);

            await vi.advanceTimersByTimeAsync(1000);

            expect(FakeWebSocket.instances).toHaveLength(2);
        });

        it('keeps the custom URL when reconnecting', async () => {
            await ws.connect_for_tests({ url: 'ws://custom/ws', reconnectInterval: 1000 });
            lastSocket().open();

            lastSocket().drop();
            await vi.advanceTimersByTimeAsync(1000);

            expect(lastSocket().url.startsWith('ws://custom/ws')).toBe(true);
        });

        it('stops after the maximum number of attempts', async () => {
            await ws.connect_for_tests({ reconnectInterval: 10, maxReconnectAttempts: 1 });
            lastSocket().open();

            lastSocket().drop();
            await vi.advanceTimersByTimeAsync(10);
            lastSocket().drop();

            expect(ws.getWebSocketState().error).toBe('Connection failed after maximum retries');
        });

        it('does not reconnect after an explicit disconnect', async () => {
            await ws.connect_for_tests({ reconnectInterval: 1000 });
            lastSocket().open();
            lastSocket().drop();

            ws.disconnect();
            await vi.advanceTimersByTimeAsync(5000);

            expect(FakeWebSocket.instances).toHaveLength(1);
            expect(ws.getWebSocketState().reconnecting).toBe(false);
        });
    });
});
