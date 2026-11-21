/**
 * Pure HTML rendering of the General and Network sections of the agent details panel
 */

import type { Agent, AgentStatus } from '../types/agent-types.js';
import { deriveAgentStatus, formatAbsoluteDate } from './agent-utils.js';
import { escapeHtml } from './dom-helpers.js';

const STATUS_LABELS: Record<AgentStatus, string> = {
  online: 'Online',
  offline: 'Offline',
  unknown: 'Unknown',
};

function item(label: string, valueHtml: string): string {
  return `
    <div class="agent-details__item">
      <dt>${label}</dt>
      <dd>${valueHtml}</dd>
    </div>
  `;
}

export function renderAgentGeneral(agent: Agent): string {
  const status = deriveAgentStatus(agent.last_seen_at);

  return `
    <dl class="agent-details__grid">
      ${item('Status', `
        <span class="agent-status-badge agent-status-badge--${status}">
          <span class="status-pulse status-pulse--${status}" aria-hidden="true"></span>
          <span class="status-label">${STATUS_LABELS[status]}</span>
        </span>
      `)}
      ${item('Agent ID', `<code>${escapeHtml(agent.id)}</code>`)}
      ${item('Workspace ID', `<code>${escapeHtml(agent.workspace_id)}</code>`)}
      ${item('Agent version', agent.agent_version ? escapeHtml(agent.agent_version) : 'Unknown')}
      ${item(
        'Config version (current / desired)',
        `${agent.config_version_current ?? 'Not reported'} / ${agent.config_version_desired}`
      )}
      ${item('Last seen', formatAbsoluteDate(agent.last_seen_at))}
      ${item(
        'Last result submitted',
        agent.last_result_submitted_at ? formatAbsoluteDate(agent.last_result_submitted_at) : 'Not reported'
      )}
      ${item('Created', formatAbsoluteDate(agent.created_at))}
      ${item('Updated', formatAbsoluteDate(agent.updated_at))}
    </dl>
  `;
}

export function renderAgentNetwork(agent: Agent): string {
  const ips = agent.ip_addresses ?? [];
  if (ips.length === 0) {
    return '<p class="has-text-grey">No IP addresses reported</p>';
  }

  return `
    <ul class="agent-details__ip-list">
      ${ips.map(ip => `
        <li>
          <code>${escapeHtml(ip.ip)}</code>
          <span class="has-text-grey"> (${escapeHtml(ip.iface || 'unknown')}${ip.recommended ? ', recommended' : ''})</span>
        </li>
      `).join('')}
    </ul>
  `;
}
