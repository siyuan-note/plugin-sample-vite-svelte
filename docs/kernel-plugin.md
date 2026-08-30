# Why a Kernel Plugin is a service

A frontend plugin belongs to the SiYuan user interface. A Kernel Plugin belongs to the running SiYuan kernel.

This difference matters when a feature must keep one state and one lifecycle without depending on a dialog, dock, editor, or browser tab. The Kernel Plugin owns that feature as a service. Frontends and trusted external programs become clients of the service.

To run the template's concrete example, follow [Run the capture service without its UI](./kernel-capture-demo.md). For complete API coverage, use the official [plugin-sample v0.5.0](https://github.com/siyuan-note/plugin-sample/tree/v0.5.0).

## The service owns work that does not belong to a UI

Consider an external capture feature. A reader application sends text to SiYuan. The feature selects a notebook, resolves today's Daily Note, formats the text, appends a block, and records the result.

If every client implements those steps, each client must know SiYuan's internal APIs and the user's routing rules. A Kernel Plugin exposes one domain operation instead:

```text
capture(text, source, metadata)
```

The implementation stays in SiYuan:

```text
CLI, reader integration, or frontend
                  │
                  │ authenticated HTTP request
                  ▼
          Kernel Capture Service
                  │
                  ├─ validate the request
                  ├─ apply the notebook configuration
                  ├─ create or find today's Daily Note
                  ├─ append the formatted block
                  ├─ record committed captures
                  └─ notify connected frontends
```

Closing the Svelte panel does not stop this service. Stopping the SiYuan kernel does stop it. A Kernel Plugin is not an operating-system daemon.

## Frontend and Kernel lifecycles are independent

SiYuan loads `index.js` in the frontend plugin environment. It loads `kernel.js` in a separate goja runtime inside the kernel process.

The two parts become ready independently. A frontend must observe `kernel-plugin-state-change` before it assumes that Kernel RPC methods are available.

The template makes the two lifecycles visible:

- The Capture Service panel shows when the Kernel service started.
- The panel also shows when the current Svelte component opened.
- An external request can arrive while the panel is closed.
- The Kernel service can broadcast the result and ask each visible frontend to open the panel again.

The Kernel lifecycle owns long-lived resources. Register handlers, RPC methods, watchers, and Agent capabilities during `onload`. Release them during `onunload`.

## Put state where its owner runs

Frontend `saveData/loadData` and Kernel `siyuan.storage` both use the plugin package's persistent area under:

```text
data/storage/petal/<plugin-name>/
```

Kernel storage is not a second database with stronger synchronization. The difference is ownership.

A frontend should own UI preferences such as panel layout or theme choices. A Kernel service should own job checkpoints, routing rules, queues, indexes, and service history. If several clients can use one service, those clients must query the Kernel service instead of keeping competing copies of its state.

Different frontends connected to the same SiYuan kernel can use the same service instance. Different devices run different kernel instances. SiYuan can synchronize persistent plugin files, but it does not turn several devices into one live Kernel Plugin instance.

## Use the runtime as a controlled service environment

A Kernel Plugin runs in an isolated goja JavaScript runtime. It is not Node.js, an Electron renderer, or direct access to SiYuan's Go objects.

SiYuan injects the controlled `siyuan.*` APIs. The current runtime also provides a limited `require` registry with selected Node-compatible modules. Do not assume that general Node built-ins such as `fs`, `child_process`, `net`, or `http` exist.

Kernel code has no DOM. Keep editor access, dialogs, docks, CSS, and other UI behavior in the frontend plugin.

Use Kernel capabilities when the service needs them:

| Service need | Kernel capability |
| --- | --- |
| Accept a command and return a result | RPC call |
| Expose a route to trusted external clients | Private HTTP handler |
| Push an event to connected frontends | RPC broadcast |
| Keep service-owned persistent state | `siyuan.storage` |
| Call an existing SiYuan HTTP API | `siyuan.client.fetch` |
| Keep a bidirectional connection | WebSocket |
| Stream one-way events | Server-Sent Events |
| Add a domain action to SiYuan Agent | `siyuan.agent.registerCapability` |

The capability list does not decide the architecture. Put a feature in the Kernel Plugin only when the feature needs Kernel-owned state, a Kernel-owned lifecycle, several clients, an inbound service interface, or Agent integration.

## The capture endpoint is private, not public

The template registers these routes:

```text
GET  /plugin/private/<plugin-name>/capture
PUT  /plugin/private/<plugin-name>/capture/config
POST /plugin/private/<plugin-name>/capture
```

SiYuan checks authentication, the administrator role, and read-only state before it invokes the private handler. External callers send the workspace API token in this header:

```text
Authorization: Token <SIYUAN_API_TOKEN>
```

The workspace API token is an administrator credential. It is not limited to the capture endpoint. Use the endpoint for your own local scripts and trusted companion programs. Do not give the token to untrusted software or expose the endpoint directly to the Internet.

The Svelte panel reads the current server address, operating system, and API token from `window.siyuan.config`. It displays a redacted command. Only the explicit **Copy runnable command with token** action writes the real token to the clipboard.

## The template keeps protocol details behind one feature

The capture example uses several Kernel APIs, but the GUI does not present an API playground.

`src/kernel-capture/kernel-service.ts` owns:

- route dispatch
- request validation
- target-notebook configuration
- Daily Note API calls
- committed-capture history
- frontend notifications

`src/kernel-capture/capture-console.svelte` owns:

- user input
- service status
- preview and commit actions
- command display and copy actions
- visible results

`src/kernel-capture/integration-command.ts` selects PowerShell or `curl` and formats the command safely. `src/kernel-capture/contracts.ts` defines the data that crosses the runtime boundary. `src/kernel-capture/frontend-client.ts` hides the private HTTP request details from the Svelte component.

This split lets a reader follow one product flow:

```text
request → Kernel-owned service → persistent result → frontend notification
```

The official [plugin-sample v0.5.0](https://github.com/siyuan-note/plugin-sample/tree/v0.5.0) covers RPC batch, raw WebSocket and SSE handlers, storage watchers, Agent capabilities, and the rest of the Kernel API surface.

## Decide which runtime owns a feature

Use these questions in order:

1. Does the feature need the current editor, DOM, or another UI object? Keep it in the frontend.
2. Does a user action only call one existing SiYuan API and show the result? Keep it in the frontend unless another requirement creates a service boundary.
3. Must the feature continue while its panel is closed, serve several clients, expose an inbound interface, or register an Agent capability? Put the service part in the Kernel Plugin.
4. Does the feature have both a service and a UI? Keep the state and business rules in the Kernel Plugin. Keep presentation and editor interaction in the frontend.

## Sources

- [SiYuan Kernel Plugin implementation](https://github.com/siyuan-note/siyuan/tree/master/kernel/plugin)
- [Kernel Plugin TypeScript declarations](https://github.com/siyuan-note/petal/blob/main/kernel.d.ts)
- [Official plugin-sample v0.5.0](https://github.com/siyuan-note/plugin-sample/tree/v0.5.0)
- [Agent capability access-control scenario](https://github.com/siyuan-note/siyuan/issues/18638)
