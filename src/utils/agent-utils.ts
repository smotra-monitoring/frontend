/**
 * Agent utility functions
 */

import { AGENT_ONLINE_THRESHOLD_MS } from '../config.js';
import type { AgentStatus } from '../types/agent-types.js';

/**
 * Derive agent status from lastSeenAt timestamp
 * 
 * @param lastSeenAt - Last heartbeat timestamp from agent (null if never seen)
 * @returns Derived status: 'online', 'offline', or 'unknown'
 */
export function deriveAgentStatus(lastSeenAt: Date | null | undefined): AgentStatus {
    if (!lastSeenAt) {
        return 'unknown';
    }

    const now = Date.now();
    const lastSeenMs = lastSeenAt.getTime();
    const elapsedMs = now - lastSeenMs;

    return elapsedMs <= AGENT_ONLINE_THRESHOLD_MS ? 'online' : 'offline';
}

/**
 * Format lastSeenAt timestamp for display
 * 
 * @param lastSeenAt - Last heartbeat timestamp
 * @returns Formatted string (e.g., "2 minutes ago", "Just now")
 */
export function formatLastSeen(lastSeenAt: Date | null | undefined): string {
    if (!lastSeenAt) {
        return 'Never';
    }

    const now = Date.now();
    const lastSeenMs = lastSeenAt.getTime();
    const elapsedMs = now - lastSeenMs;
    const elapsedSeconds = Math.floor(elapsedMs / 1000);

    if (elapsedSeconds < 60) {
        return 'Just now';
    }

    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    if (elapsedMinutes < 60) {
        return `${elapsedMinutes} ${elapsedMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }

    const elapsedHours = Math.floor(elapsedMinutes / 60);
    if (elapsedHours < 24) {
        return `${elapsedHours} ${elapsedHours === 1 ? 'hour' : 'hours'} ago`;
    }

    const elapsedDays = Math.floor(elapsedHours / 24);
    return `${elapsedDays} ${elapsedDays === 1 ? 'day' : 'days'} ago`;
}

/**
 * Format absolute timestamp for display
 * 
 * @param date - Date to format
 * @returns Formatted string (e.g., "May 30, 2026 10:00:00")
 */
export function formatAbsoluteDate(date: Date | null | undefined): string {
    if (!date) {
        return 'N/A';
    }

    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).format(date);
}
