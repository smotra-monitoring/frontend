# Agent Config Preview

Shows the stored configuration patch of an agent (`GET /agent/{agentId}/configuration`, operation `getAgentConfiguration`, response `AgentConfigPatch`).

**Status:** wired. It is shown in the "Config patch preview" section of the [Agent Details Panel](agent-details-panel.md), opened from the Desired config version button in the Agent States table.

## Design decisions

- **Fetch on open and on swap only.** There is no automatic refetch (not on the refresh tick either), so the view never changes while the user reads it.
- **Single entry.** State holds the configuration of the one agent being inspected; every load replaces it.
- **Race-safe.** A response that arrives after a newer load or a reset is discarded.
- **Server errors as-is.** The `message` returned by the server is shown unchanged (it carries more context than a local mapping could). If the server sent no error body, or the request threw, the thrown error's message or `Failed to load agent configuration` is used. The Retry button is always shown on error.

## API

```ts
import { loadAgentConfig, resetAgentConfig, getAgentConfigState, subscribeToAgentConfig } from '../state/agent-config-state.js';
import { renderAgentConfig } from '../utils/agent-config-render.js';

await loadAgentConfig(agentId);           // never throws; failures are stored in `error`
const html = renderAgentConfig(getAgentConfigState());
```

`renderAgentConfig` is pure and attaches no listeners. `AgentDetailsPanel` wires `data-action="retry-config"` to `loadAgentConfig`.

## Rendered content

Desired version, tags, endpoints (address, port, enabled, tags) and `base_config` as pretty-printed JSON. All server-provided values are escaped.

## Tests

- `tests/unit/state/agent-config-state.test.ts`
- `tests/unit/utils/agent-config-render.test.ts`
- `tests/unit/widgets/agent-details.test.ts` (panel wiring)
- `tests/integration/agent-config-panel.test.ts` (click Desired, fetch, render)
