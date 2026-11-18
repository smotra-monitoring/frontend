# Agent Config Preview

Shows the stored configuration patch of an agent (`GET /agent/{agentId}/configuration`, operation `getAgentConfiguration`, response `AgentConfigPatch`).

**Status:** foundation only. The right-hand side panel and the "Desired" trigger in the Agent States Widget are not built yet.

## Design decisions

- **Fetch on open and on swap only.** There is no automatic refetch (not on the refresh tick either), so the view never changes while the user reads it.
- **Single entry.** State holds the configuration of the one agent being inspected; every load replaces it.
- **Stale indicator.** The agent list keeps refreshing. If its `config_version_desired` differs from the fetched version (in either direction), the preview shows a banner with a Reload button.
- **Race-safe.** A response that arrives after a newer load or a reset is discarded.
- **Server errors as-is.** The `message` returned by the server is shown unchanged (it carries more context than a local mapping could). If the server sent no error body, or the request threw, the thrown error's message or `Failed to load agent configuration` is used. The Retry button is always shown on error.

## API

```ts
import { loadAgentConfig, resetAgentConfig, getAgentConfigState, subscribeToAgentConfig } from '../state/agent-config-state.js';
import { isConfigStale } from '../utils/agent-config-utils.js';
import { renderAgentConfig } from '../utils/agent-config-render.js';

await loadAgentConfig(agentId);           // never throws; failures are stored in `error`
const html = renderAgentConfig(getAgentConfigState(), getAgentById(agentId));
```

`renderAgentConfig` is pure and attaches no listeners. The host wires `data-action="retry-config"` and `data-action="reload-config"` to `loadAgentConfig`.

## Rendered content

Desired version, tags, endpoints (address, port, enabled, tags) and `base_config` as pretty-printed JSON. All server-provided values are escaped.

## Tests

- `tests/unit/state/agent-config-state.test.ts`
- `tests/unit/utils/agent-config-render.test.ts`

The integration test (click Desired, fetch, render in the panel) is added with the side panel.
