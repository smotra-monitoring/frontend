# Agent Config Preview

Shows the stored configuration patch of an agent (`GET /agent/{agentId}/configuration`, operation `getAgentConfiguration`, response `AgentConfigPatch`).

**Status:** foundation only. The right-hand side panel and the "Desired" trigger in the Agent States Widget are not built yet.

## Design decisions

- **Fetch on open and on swap only.** There is no automatic refetch (not on the refresh tick either), so the view never changes while the user reads it.
- **Single entry.** State holds the configuration of the one agent being inspected; every load replaces it.
- **Stale indicator.** The agent list keeps refreshing. If its `config_version_desired` differs from the fetched version (in either direction), the preview shows a banner with a Reload button.
- **Race-safe.** A response that arrives after a newer load or a reset is discarded.
- **Distinct errors.** One message per cause, so the user is never left guessing.

## API

```ts
import { loadAgentConfig, resetAgentConfig, getAgentConfigState, subscribeToAgentConfig } from '../state/agent-config-state.js';
import { isConfigStale } from '../utils/agent-config-utils.js';
import { renderAgentConfig } from '../utils/agent-config-render.js';

await loadAgentConfig(agentId);           // never throws; failures are stored in `error`
const html = renderAgentConfig(getAgentConfigState(), getAgentById(agentId));
```

`renderAgentConfig` is pure and attaches no listeners. The host wires `data-action="retry-config"` and `data-action="reload-config"` to `loadAgentConfig`.

## Error messages

| Cause | Message | Retry |
|-------|---------|-------|
| 401 | Your session has expired. Sign in again. | no |
| 403 | You don't have permission to view this agent's configuration. | no |
| 404 | No configuration found. The agent may have been deleted. | no |
| 501 | This server version doesn't support configuration retrieval. | no |
| 503 | The configuration service is temporarily unavailable. | yes |
| network | Can't reach the server. Check your connection. | yes |
| other | Unexpected error (HTTP n). | yes |

## Rendered content

Desired version, tags, endpoints (address, port, enabled, tags) and `base_config` as pretty-printed JSON. All server-provided values are escaped.

## Tests

- `tests/unit/state/agent-config-state.test.ts`
- `tests/unit/utils/agent-config-errors.test.ts`
- `tests/unit/utils/agent-config-render.test.ts`

The integration test (click Desired, fetch, render in the panel) is added with the side panel.
