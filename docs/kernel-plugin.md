# SiYuan Kernel Plugin Guide

SiYuan 3.7.0 introduced kernel plugins. A plugin package can now contain frontend code for the SiYuan UI and kernel code that runs inside the SiYuan kernel process.

A kernel plugin is **not** a Node.js plugin and it does not receive SiYuan's Go internals. It runs in a sandboxed goja JavaScript runtime and receives only the kernel capabilities that SiYuan exposes through the global `siyuan` object.

This Vite + Svelte template contains a small executable kernel plugin. The complete official API sample is [siyuan-note/plugin-sample](https://github.com/siyuan-note/plugin-sample).

## What a Kernel Plugin Is For

A frontend plugin changes the SiYuan user interface. A kernel plugin adds a controlled service to the running SiYuan kernel.

For example, a file-management or network-drive plugin can expose a route that returns a file or media response; a player can request that route through standard HTTP; an MCP plugin can register a tool for SiYuan's MCP server. These tasks need a service that is independent of a browser tab and can use kernel-provided HTTP, storage, event, and lifecycle APIs.

A kernel plugin can:

- Call SiYuan's existing HTTP, WebSocket, and Server-Sent Events APIs through `siyuan.client`, using the plugin's kernel-issued credentials.
- Store and watch files in its own storage directory.
- Register RPC methods for frontend or other authenticated clients.
- Register private HTTP, WebSocket, and Server-Sent Events handlers.
- Register MCP tools.
- Start and stop resources through lifecycle callbacks, even when no plugin UI is open.

A kernel plugin cannot:

- Import or call SiYuan's Go packages, functions, or in-memory objects.
- Use Node.js APIs or modules such as `require`, `fs`, `child_process`, `net`, or `http`.
- Use browser and frontend APIs such as `window`, `document`, editor instances, dialogs, docks, or CSS.
- Create an anonymous public HTTP endpoint. The active server route is private and protected by SiYuan authentication, administrator-role, and read-only checks.

## Is the HTTP Handler an External API?

Yes, but it is an **authenticated external API**, not a public web API. A program outside SiYuan can call:

```text
/plugin/private/<plugin-name>/<path>
```

when it can reach the SiYuan HTTP server and provides valid administrator credentials, such as the workspace API token. Anonymous callers and non-administrator users do not reach the handler. The public route `/plugin/public/<plugin-name>/<path>` is currently disabled in the SiYuan kernel.

Use a private HTTP handler for a companion application, a local integration, media/file delivery, or a privileged automation client. Do not use it for an unauthenticated Internet webhook.

## Glossary

| Term | Meaning |
| --- | --- |
| **kernel plugin** | The `kernel.js` part of a package, executed by the SiYuan kernel. |
| **frontend plugin** | The `index.js` part of a package, executed in the SiYuan frontend plugin environment. |
| **goja runtime** | The JavaScript runtime embedded in the SiYuan kernel for one kernel plugin. It is not a browser, Electron renderer, or Node.js process. |
| **lifecycle** | Kernel plugin callbacks: `onload`, `onrunning`, and `onunload`. |
| **RPC** | JSON-RPC communication between the frontend plugin and kernel plugin. |
| **private HTTP handler** | A kernel plugin HTTP handler at `/plugin/private/<plugin-name>/*path`. |
| **scoped storage** | Persistent files owned by one kernel plugin and accessed through `siyuan.storage`. |
| **MCP tool** | A tool registered by a kernel plugin and exposed through SiYuan's MCP server. |
| **WebSocket / SSE handler** | A private server handler for bidirectional messages or server-to-client event streams. |

API and protocol names stay in English. Use one term for one concept in code, documentation, and issue discussions.

## Runtime Guarantees

The following behavior is provided by SiYuan 3.7.x:

- A kernel plugin starts only when the package is enabled, contains `kernel.js`, and `plugin.json.kernels` supports the current backend.
- Missing `kernel.js` or `kernels` does not prevent the frontend plugin from running.
- Each kernel plugin runs in its own goja runtime.
- SiYuan calls the lifecycle callbacks in this order: `onload`, `onrunning`, then `onunload` when stopping.
- SiYuan waits for a lifecycle callback Promise before advancing the plugin state.
- The private HTTP, WebSocket, and SSE routes require SiYuan authentication and an administrator role before the handler runs.
- Kernel plugin source and frontend plugin source have different runtimes. Browser globals and frontend APIs do not belong in `kernel.ts`.

These runtime guarantees are why `minAppVersion` must remain at least `3.7.0` for a package that depends on kernel plugin behavior.

## Choose the Right Capability

| Need | Use | Why |
| --- | --- | --- |
| Add a menu, dialog, toolbar, dock, tab, editor behavior, or CSS | frontend plugin | These require the SiYuan UI and DOM. |
| Initialize a background service or release resources on shutdown | lifecycle | `onload` registers resources; `onunload` releases them. |
| Store a task cursor, cache, or plugin-owned file | `siyuan.storage` | Storage is scoped to the kernel plugin. |
| Let a UI action start background work and return a result | RPC | Direct method call with a request/result contract. |
| Push task progress or completion to every connected frontend | RPC broadcast | Kernel sends a notification without a pending frontend request. |
| Offer an authenticated endpoint with URLs, methods, status codes, headers, or files | private HTTP handler | Use standard HTTP semantics rather than inventing an RPC method for every route. |
| Keep a bidirectional connection open | private WebSocket handler or `siyuan.client.socket` | WebSocket fits interactive, long-lived two-way messaging. |
| Push a one-way stream of updates | private SSE handler or `siyuan.client.event` | SSE fits progress feeds and event streams. |
| Call a SiYuan HTTP/WS/SSE API from kernel code | `siyuan.client` | Uses the kernel's API gateway and plugin credentials. |
| Expose a capability to an AI client | `siyuan.mcp.registerTool` | Registers a namespaced MCP tool. |

### RPC or HTTP?

Choose **RPC** for a small set of internal commands such as `startExport`, `getTaskStatus`, or `cancelTask`. It is the simplest frontend-to-kernel boundary when the caller already has a `Plugin` instance.

Choose a **private HTTP handler** when your feature naturally has routes or HTTP behavior: multiple resources, `GET` and `POST`, response status codes, headers, files, a browser client that already uses `fetch`, or an HTTP/WS/SSE extension of the same service.

A private handler is not a public webhook endpoint. The route is protected by SiYuan authentication, administrator-role, and read-only checks. Do not design it as anonymous third-party access.

## Before You Start

You need:

- SiYuan 3.7.0 or later.
- `"minAppVersion": "3.7.0"` or later in `plugin.json`.
- `siyuan@1.2.2` or later for the kernel TypeScript declarations used by this template.
- A build that emits a self-contained `kernel.js` file.

A kernel plugin has no DOM. Do not use `window`, `document`, editor instances, Electron renderer APIs, or direct Node.js filesystem APIs in `src/kernel.ts`. Use `siyuan.storage`, `siyuan.client`, `siyuan.logger`, and `siyuan.rpc` instead.

## Add Kernel Support

### 1. Declare supported kernel platforms

Add `kernels` to `plugin.json`:

```json
{
  "minAppVersion": "3.7.0",
  "kernels": [
    "windows",
    "linux",
    "darwin",
    "ios",
    "android",
    "harmony",
    "docker",
    "all"
  ]
}
```

The current backend must appear in `kernels`, or the list must contain `all`. Omitting or emptying `kernels` allows installation but disables the kernel plugin portion of the package.

### 2. Create the kernel entry

Create `src/kernel.ts`. Import types only because the kernel provides the runtime global `siyuan`:

```ts
import type * as kernel from "siyuan/kernel";

const api: kernel.ISiyuan = siyuan;
```

### 3. Build both entries

This template builds two files:

| Source | Output | Runtime |
| --- | --- | --- |
| `src/index.ts` | `index.js` | SiYuan frontend plugin environment |
| `src/kernel.ts` | `kernel.js` | goja runtime in the SiYuan kernel |

Run `pnpm run build`. The release package must contain both files.

## Lifecycle, Logging, and Storage

### Lifecycle

```ts
api.plugin.lifecycle.onload = async () => {
  // Register RPC methods, handlers, watchers, and startup resources.
};

api.plugin.lifecycle.onrunning = async () => {
  // Start work that requires the plugin to be callable.
};

api.plugin.lifecycle.onunload = async () => {
  // Close connections, stop timers, unregister tools, and release resources.
};
```

Keep lifecycle callbacks short. Long synchronous work delays startup or shutdown. Use `onload` to register capabilities and `onunload` to clean them up.

### Logging

```ts
await siyuan.logger.info("Started background task", { taskId });
await siyuan.logger.warn("Retrying request", { retryCount });
await siyuan.logger.error("Task failed", { error: String(error) });
```

Use frontend devtools for `index.ts`. Use `siyuan.logger` for `kernel.ts`.

### Scoped storage

Use scoped storage for plugin-owned persistent data such as task state, cached metadata, or configuration generated by the kernel plugin:

```ts
await siyuan.storage.put("jobs/status.json", JSON.stringify({ running: true }));

const data = await siyuan.storage.get("jobs/status.json");
const status = JSON.parse(await data.text());

await siyuan.storage.remove("jobs/status.json");
```

Paths are relative to the kernel-managed storage directory for this plugin. `storage.get()` returns a lazy data object. Consume it once with the decoder you need, such as `text()` or `json()`.

## RPC Example

The template uses RPC for the most common UI-to-background pattern.

### Register methods in the kernel plugin

```ts
await siyuan.rpc.bind("echo", async (...args) => {
  return {
    plugin: siyuan.plugin.name,
    platform: siyuan.plugin.platform,
    args,
  };
}, "Return the received arguments.");

await siyuan.rpc.bind("readSampleStorage", async () => {
  const data = await siyuan.storage.get("kernel-sample.json");
  return JSON.parse(await data.text());
});
```

Register methods in `onload`. A frontend call succeeds after the kernel plugin reaches `running`.

### Call methods from the frontend plugin

```ts
try {
  const result = await this.kernel.rpc.call.echo("Hello from frontend");
  console.log(result);
} catch (error) {
  console.error("Kernel RPC failed", error);
}
```

### Send a notification from kernel to frontend

Use this for state changes and task completion rather than polling:

```ts
await siyuan.rpc.broadcast("notify", ["Background task completed"]);
```

```ts
const onKernelNotify = async (message: string) => {
  console.log("Kernel notification", message);
};

this.kernel.rpc.bind("notify", onKernelNotify);
// Later, during frontend plugin unload:
this.kernel.rpc.unbind("notify", onKernelNotify);
```

The frontend event bus also emits `kernel-plugin-state-change`. State code `2` means the kernel plugin is running.

## Private HTTP Handler Example

The template registers a small authenticated status endpoint:

```ts
api.server.private.http.handler = async (request) => {
  if (request.request.method !== "GET" || request.context.path !== "/status") {
    return {
      statusCode: 404,
      body: {
        data: {
          type: "JSON",
          data: { error: "Not found" },
        },
      },
    };
  }

  return {
    statusCode: 200,
    body: {
      data: {
        type: "JSON",
        data: {
          name: siyuan.plugin.name,
          platform: siyuan.plugin.platform,
          status: "running",
        },
      },
    },
  };
};
```

The route is:

```text
GET /plugin/private/<plugin-name>/status
```

`request.context.path` is the part after `<plugin-name>`. One handler receives all private HTTP routes for the plugin, so route dispatch belongs in the handler.

Call it from the frontend plugin:

```ts
const response = await fetch(`/plugin/private/${this.name}/status`);
if (!response.ok) {
  throw new Error(`HTTP ${response.status}`);
}
const status = await response.json();
```

A handler returns an `IHttpResponse`. For an HTTP response body, use one representation: structured `data`, a `file`, formatted `string`, raw bytes, or a redirect. Use HTTP handlers when these HTTP response features matter; prefer RPC for a small internal command surface.

## Build, Develop, and Debug

### Commands

```bash
pnpm run dev
pnpm run build
```

`pnpm run dev` watches and builds frontend and kernel entries into `dev/`. When SiYuan loads the linked plugin directory, changes to `dev/kernel.js` trigger kernel plugin reload.

`pnpm run build` writes `dist/` and creates `package.zip`.

### Verify a release package

```text
package.zip
  index.js
  index.css
  kernel.js
  plugin.json
  i18n/*.json
  README*.md
```

This template builds `kernel.js` as a self-contained IIFE. It must not retain a runtime `import` or reference browser-only globals.

### Debug checklist

1. Confirm the plugin is enabled.
2. Confirm `plugin.json.kernels` supports the current backend.
3. Confirm the installed plugin directory contains `kernel.js`.
4. Observe `kernel-plugin-state-change` in the frontend.
5. Add `siyuan.logger.info(...)` in lifecycle callbacks and handlers.
6. Catch errors around `this.kernel.rpc.call.*(...)` and `fetch(...)`.
7. For private HTTP requests, confirm the caller is authenticated, has administrator role, and is not blocked by read-only mode.

## Publish to the Marketplace

Kernel plugins use the normal SiYuan marketplace workflow:

1. Run `pnpm run build`.
2. Confirm `dist/kernel.js` and `package.zip` exist.
3. Inspect the zip for `kernel.js`.
4. Create a GitHub release for the plugin version.
5. Upload `package.zip`.
6. For the first release, submit the repository to `siyuan-note/bazaar`.

Do not publish a kernel-dependent package with `minAppVersion` below `3.7.0`.

## Advanced Capabilities

| Capability | Typical requirement |
| --- | --- |
| `siyuan.mcp.registerTool` | Expose a well-defined plugin action to an AI client. |
| `siyuan.server.private.ws` | Interactive two-way messages, such as a remote control channel. |
| `siyuan.server.private.es` | One-way live progress or event feed to a client. |
| `siyuan.client.fetch/socket/event` | Call or subscribe to SiYuan HTTP, WebSocket, or SSE APIs from kernel code. |
| `siyuan.storage.watcher` | React when plugin-owned files change. |
| `siyuan.event` | Receive and publish events through the kernel event bridge. |

The minimal template intentionally stops at lifecycle, logging, storage, RPC, and a private HTTP status endpoint. For complete MCP, HTTP, WebSocket, SSE, and streaming examples, see [siyuan-note/plugin-sample](https://github.com/siyuan-note/plugin-sample).

## References

- Complete API sample: <https://github.com/siyuan-note/plugin-sample>
- Kernel plugin system: <https://github.com/siyuan-note/siyuan/pull/17487>
- Streaming proxy responses: <https://github.com/siyuan-note/siyuan/pull/17748>
- MCP tool management: <https://github.com/siyuan-note/siyuan/pull/17834>
