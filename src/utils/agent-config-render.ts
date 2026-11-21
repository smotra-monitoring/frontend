/**
 * Pure HTML rendering of the agent configuration patch preview.
 * Attaches no listeners; the host wires `data-action="retry-config"` and `data-action="reload-config"`.
 */

import type { AgentConfigState } from '../types/agent-config-types.js';
import type { Agent } from '../types/agent-types.js';
import { escapeHtml } from './dom-helpers.js';
import { isConfigStale } from './agent-config-utils.js';

/**
 * @param agent The agent's current row in the list; used to flag a stale view
 */
export function renderAgentConfig(state: AgentConfigState, agent: Agent | null = null): string {
  switch (state.status) {
    case 'loading':
      return `
        <div class="agent-config agent-config--loading" role="status" aria-live="polite">
          <p>Loading configuration...</p>
        </div>
      `;
    case 'error':
      return renderError(state);
    case 'loaded':
      return renderLoaded(state, agent);
    default:
      return '';
  }
}

function renderError(state: AgentConfigState): string {
  const error = state.error;
  if (!error) return '';

  return `
    <div class="agent-config agent-config--error" role="alert">
      <p class="agent-config__error">${escapeHtml(error.message)}</p>
      <button type="button" class="button agent-config__action" data-action="retry-config">Retry</button>
    </div>
  `;
}

function renderLoaded(state: AgentConfigState, agent: Agent | null): string {
  const data = state.data;
  if (!data) return '';

  const stale = isConfigStale(state, agent) && agent
    ? `
      <div class="agent-config__stale notification is-warning is-light" role="status">
        <p>Agent list shows version ${escapeHtml(String(agent.config_version_desired))}, this view shows ${escapeHtml(String(data.config_version_desired))}.</p>
        <button type="button" class="button agent-config__action" data-action="reload-config">Reload</button>
      </div>
    `
    : '';

  const tags = data.tags.length > 0
    ? `<ul class="agent-config__tags">${data.tags.map(tag => `<li><code>${escapeHtml(tag)}</code></li>`).join('')}</ul>`
    : '<p class="has-text-grey">No tags</p>';

  const endpoints = data.endpoints.length > 0
    ? `<ul class="agent-config__endpoints">${data.endpoints.map(endpoint => {
      const address = endpoint.port === undefined ? endpoint.address : `${endpoint.address}:${endpoint.port}`;
      const endpointTags = endpoint.tags.length > 0 ? ` (${endpoint.tags.map(escapeHtml).join(', ')})` : '';
      return `<li><code>${escapeHtml(address)}</code> ${endpoint.enabled ? 'enabled' : 'disabled'}${endpointTags}</li>`;
    }).join('')}</ul>`
    : '<p class="has-text-grey">No endpoints</p>';

  const patch = Object.keys(data.base_config).length > 0
    ? `<pre class="agent-config__patch"><code>${escapeHtml(JSON.stringify(data.base_config, null, 2))}</code></pre>`
    : '<p class="has-text-grey">Empty patch (agent defaults apply)</p>';

  return `
    <div class="agent-config agent-config--loaded">
      ${stale}
      <dl class="agent-config__grid">
        <div class="agent-config__item">
          <dt>Desired version</dt>
          <dd>${escapeHtml(String(data.config_version_desired))}</dd>
        </div>
        <div class="agent-config__item">
          <dt>Tags</dt>
          <dd>${tags}</dd>
        </div>
        <div class="agent-config__item">
          <dt>Endpoints</dt>
          <dd>${endpoints}</dd>
        </div>
        <div class="agent-config__item">
          <dt>Base config</dt>
          <dd>${patch}</dd>
        </div>
      </dl>
    </div>
  `;
}
