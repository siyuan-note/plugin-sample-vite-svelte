# SiYuan Kernel Plugin 开发指南

SiYuan 从 3.7.0 开始支持 kernel plugin。一个插件包可以同时包含运行在 SiYuan 前端的 frontend plugin，以及运行在 SiYuan kernel 进程中的 kernel plugin。

kernel plugin **不是** Node.js plugin，也不会获得 SiYuan 的 Go internals。它运行在受限的 goja JavaScript runtime 中，只能通过全局 `siyuan` 对象使用 SiYuan 显式开放的 kernel capability。

本 Vite + Svelte 模板提供了可执行的最小 kernel plugin。完整官方 API 示例请参阅 [siyuan-note/plugin-sample](https://github.com/siyuan-note/plugin-sample)。

## Kernel Plugin 到底解决什么问题

frontend plugin 用于改变 SiYuan 的用户界面；kernel plugin 用于给正在运行的 SiYuan kernel 增加一个受控服务。

例如，file-management 或 network-drive plugin 可以暴露一个返回文件或媒体响应的 route，player 通过标准 HTTP 请求这个 route；MCP plugin 可以向 SiYuan 的 MCP server 注册 tool。这些任务需要一个不依赖浏览器 tab、并且可以使用 kernel 提供的 HTTP、storage、event 和 lifecycle API 的服务。

kernel plugin 可以：

- 通过 `siyuan.client` 携带 kernel 签发的 plugin credentials，调用 SiYuan 已有的 HTTP、WebSocket 和 Server-Sent Events API。
- 在自己的 storage directory 中存储和监听文件。
- 注册供 frontend 或其他已认证 client 调用的 RPC method。
- 注册 private HTTP、WebSocket 和 Server-Sent Events handler。
- 注册 MCP tool。
- 通过 lifecycle callback 管理资源，即使没有打开任何插件 UI。

kernel plugin 不可以：

- import 或调用 SiYuan 的 Go package、function 或 in-memory object。
- 使用 `require`、`fs`、`child_process`、`net`、`http` 等 Node.js API 或 module。
- 使用 `window`、`document`、编辑器实例、dialog、dock 或 CSS 等 browser/frontend API。
- 创建匿名 public HTTP endpoint。当前生效的 server route 是 private route，受 SiYuan authentication、administrator-role 与 read-only check 保护。

## HTTP Handler 是给外部提供 API 吗？

是，但它是**需要认证的外部 API**，不是 public web API。SiYuan 外部的程序只要能够连接到 SiYuan HTTP server，并提供有效的 administrator credentials，例如 workspace API token，就可以调用：

```text
/plugin/private/<plugin-name>/<path>
```

anonymous caller 和 non-administrator user 不会进入 handler。public route `/plugin/public/<plugin-name>/<path>` 目前在 SiYuan kernel 中处于禁用状态。

private HTTP handler 适合 companion application、local integration、media/file delivery 或 privileged automation client；不适合作为未认证 Internet webhook。

## Glossary

| Term | 含义 |
| --- | --- |
| **kernel plugin（内核插件）** | 插件包中的 `kernel.js`，由 SiYuan kernel 执行。 |
| **frontend plugin（前端插件）** | 插件包中的 `index.js`，在 SiYuan 前端插件环境中执行。 |
| **goja runtime（goja 运行时）** | SiYuan kernel 为每个 kernel plugin 创建的 JavaScript runtime。它不是浏览器、Electron renderer 或 Node.js 进程。 |
| **lifecycle（生命周期）** | kernel plugin 的回调：`onload`、`onrunning`、`onunload`。 |
| **RPC** | frontend plugin 与 kernel plugin 之间的 JSON-RPC 通信。 |
| **private HTTP handler** | kernel plugin 在 `/plugin/private/<plugin-name>/*path` 下的 HTTP handler。 |
| **scoped storage（插件私有存储）** | 一个 kernel plugin 独占的持久化文件空间，通过 `siyuan.storage` 访问。 |
| **MCP tool** | kernel plugin 注册到 SiYuan MCP server 的工具。 |
| **WebSocket / SSE handler** | 用于双向消息或 server-to-client event stream 的私有 server handler。 |

API 名称和协议名称保持英文。代码、文档和 issue 讨论中，一个概念只使用一个术语。

## Runtime Guarantees

以下行为由 SiYuan 3.7.x 提供：

- 只有插件已启用、包中存在 `kernel.js`，且 `plugin.json.kernels` 支持当前 backend 时，kernel plugin 才会启动。
- 缺少 `kernel.js` 或 `kernels` 不会阻止 frontend plugin 运行。
- 每个 kernel plugin 都在独立的 goja runtime 中运行。
- SiYuan 按 `onload`、`onrunning`、停止时 `onunload` 的顺序调用 lifecycle callback。
- SiYuan 会等待 lifecycle callback 返回的 Promise 完成后再推进插件状态。
- private HTTP、WebSocket 和 SSE route 在进入 handler 前需要通过 SiYuan authentication 和 administrator role 检查。
- kernel plugin 与 frontend plugin 的运行时不同。浏览器全局对象和前端 API 不应出现在 `kernel.ts` 中。

因此，依赖 kernel plugin 行为的插件包必须保持 `minAppVersion` 不低于 `3.7.0`。

## 按需求选择能力

| 需求 | 使用 | 原因 |
| --- | --- | --- |
| 工具栏、对话框、dock、tab、编辑器行为或 CSS | frontend plugin | 这些能力依赖 SiYuan UI 与 DOM。 |
| 初始化后台服务，或在关闭时释放资源 | lifecycle | `onload` 注册资源，`onunload` 释放资源。 |
| 保存任务游标、缓存或插件私有文件 | `siyuan.storage` | 存储空间只属于该 kernel plugin。 |
| UI 操作触发后台任务，并取得一个结果 | RPC | 直接的方法调用，适合 request/result 契约。 |
| 向所有已连接 frontend 推送任务进度或完成事件 | RPC broadcast | kernel 发送 notification，不需要 frontend 预先发起请求。 |
| 提供带 URL、method、status code、header 或文件响应的认证 endpoint | private HTTP handler | 使用标准 HTTP 语义，而不是为每个 route 设计一个 RPC method。 |
| 保持双向长期连接 | private WebSocket handler 或 `siyuan.client.socket` | WebSocket 适合交互式、长期的双向消息。 |
| 推送单向更新流 | private SSE handler 或 `siyuan.client.event` | SSE 适合进度与事件流。 |
| 从 kernel code 调用 SiYuan HTTP/WS/SSE API | `siyuan.client` | 使用 kernel API gateway 与 plugin credentials。 |
| 向 AI client 暴露插件能力 | `siyuan.mcp.registerTool` | 注册带命名空间的 MCP tool。 |

### RPC 还是 HTTP？

当功能是少量内部命令时，选择 **RPC**，例如 `startExport`、`getTaskStatus`、`cancelTask`。调用方已经有 `Plugin` 实例时，RPC 是 frontend-to-kernel 最简单的边界。

当功能天然具有 route 或 HTTP 行为时，选择 **private HTTP handler**：多个资源、`GET` 与 `POST`、response status code、header、文件响应，已有使用 `fetch` 的浏览器 client，或同一服务还要扩展 HTTP/WS/SSE。

private handler 不是公开 webhook endpoint。该 route 会被 SiYuan authentication、administrator role 和只读状态检查保护，不应将其设计为匿名第三方访问入口。

## 开始前

需要满足以下条件：

- SiYuan 版本不低于 3.7.0。
- `plugin.json` 中 `"minAppVersion": "3.7.0"` 或更高版本。
- 使用本模板时安装 `siyuan@1.2.2` 或更新版本，以获得 kernel API 的 TypeScript 类型声明。
- 构建产物中存在自包含的 `kernel.js`。

kernel plugin 没有 DOM。不要在 `src/kernel.ts` 中使用 `window`、`document`、编辑器实例、Electron renderer API 或直接的 Node.js filesystem API。文件、网络、日志和通信应使用 `siyuan.storage`、`siyuan.client`、`siyuan.logger` 和 `siyuan.rpc`。

## 添加 Kernel Plugin

### 1. 声明支持的 kernel 平台

在 `plugin.json` 中增加 `kernels`：

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

当前 backend 必须出现在 `kernels` 中，或列表中包含 `all`。省略 `kernels` 或设为空数组时，插件包仍可安装，但 kernel plugin 部分不会启动。

### 2. 创建 kernel entry

创建 `src/kernel.ts`。只导入类型；运行时全局对象 `siyuan` 由 SiYuan kernel 注入：

```ts
import type * as kernel from "siyuan/kernel";

const api: kernel.ISiyuan = siyuan;
```

### 3. 构建两个 entry

本模板会构建两个文件：

| Source | Output | Runtime |
| --- | --- | --- |
| `src/index.ts` | `index.js` | SiYuan frontend plugin environment |
| `src/kernel.ts` | `kernel.js` | SiYuan kernel 中的 goja runtime |

运行 `pnpm run build`。发布包必须同时包含这两个文件。

## Lifecycle、日志与存储

### Lifecycle

```ts
api.plugin.lifecycle.onload = async () => {
  // 注册 RPC method、handler、watcher 与启动资源。
};

api.plugin.lifecycle.onrunning = async () => {
  // 启动需要在插件可被调用后运行的工作。
};

api.plugin.lifecycle.onunload = async () => {
  // 关闭连接、timer，注销 tool，并释放资源。
};
```

lifecycle callback 应尽量短。长时间同步工作会延迟启动或停止。使用 `onload` 注册能力，使用 `onunload` 清理能力。

### 日志

```ts
await siyuan.logger.info("Started background task", { taskId });
await siyuan.logger.warn("Retrying request", { retryCount });
await siyuan.logger.error("Task failed", { error: String(error) });
```

排查 `index.ts` 使用 frontend devtools；排查 `kernel.ts` 使用 `siyuan.logger`。

### Scoped Storage

scoped storage 适合保存 plugin-owned persistent data，例如任务状态、缓存元数据，或由 kernel plugin 生成的配置：

```ts
await siyuan.storage.put("jobs/status.json", JSON.stringify({ running: true }));

const data = await siyuan.storage.get("jobs/status.json");
const status = JSON.parse(await data.text());

await siyuan.storage.remove("jobs/status.json");
```

storage path 相对于该插件由 kernel 管理的 storage directory。`storage.get()` 返回惰性数据对象；根据需要只使用一次解码方法，例如 `text()` 或 `json()`。

## RPC 示例

模板使用 RPC 演示最常见的 UI-to-background 模式。

### 在 Kernel Plugin 中注册方法

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

在 `onload` 中注册 method。kernel plugin 进入 `running` 后，frontend 才能调用它们。

### 在 Frontend Plugin 中调用方法

```ts
try {
  const result = await this.kernel.rpc.call.echo("Hello from frontend");
  console.log(result);
} catch (error) {
  console.error("Kernel RPC failed", error);
}
```

### 由 Kernel 向 Frontend 发送通知

任务完成或状态改变时，可用 notification 替代轮询：

```ts
await siyuan.rpc.broadcast("notify", ["Background task completed"]);
```

```ts
const onKernelNotify = async (message: string) => {
  console.log("Kernel notification", message);
};

this.kernel.rpc.bind("notify", onKernelNotify);
// 在 frontend plugin 卸载时：
this.kernel.rpc.unbind("notify", onKernelNotify);
```

frontend event bus 也会触发 `kernel-plugin-state-change`。state code 为 `2` 表示 kernel plugin 正在运行。

## Private HTTP Handler 示例

模板注册了最小认证 status endpoint：

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

route 为：

```text
GET /plugin/private/<plugin-name>/status
```

`request.context.path` 是 `<plugin-name>` 后面的路径部分。一个 handler 接收该插件的所有 private HTTP route，因此 route dispatch 由 handler 自己处理。

在 frontend plugin 中调用：

```ts
const response = await fetch(`/plugin/private/${this.name}/status`);
if (!response.ok) {
  throw new Error(`HTTP ${response.status}`);
}
const status = await response.json();
```

handler 返回 `IHttpResponse`。HTTP response body 只应使用一种表示：结构化 `data`、`file`、格式化 `string`、raw bytes 或 redirect。需要这些 HTTP response 特性时使用 HTTP handler；只有少量内部命令时优先使用 RPC。

## 构建、开发与调试

### 命令

```bash
pnpm run dev
pnpm run build
```

`pnpm run dev` 以 watch mode 同时构建 frontend 和 kernel entry，输出到 `dev/`。SiYuan 加载链接后的插件目录时，`dev/kernel.js` 变化会触发 kernel plugin 重载。

`pnpm run build` 输出 `dist/` 并生成 `package.zip`。

### 检查发布包

```text
package.zip
  index.js
  index.css
  kernel.js
  plugin.json
  i18n/*.json
  README*.md
```

本模板将 `kernel.js` 构建为自包含 IIFE。它不应保留运行时 `import`，也不应引用浏览器专属全局对象。

### 调试清单

1. 确认插件已启用。
2. 确认 `plugin.json.kernels` 支持当前 backend。
3. 确认已安装插件目录中存在 `kernel.js`。
4. 在 frontend 中观察 `kernel-plugin-state-change`。
5. 在 lifecycle callback 与 handler 中添加 `siyuan.logger.info(...)`。
6. 在 `this.kernel.rpc.call.*(...)` 与 `fetch(...)` 外处理异常。
7. 请求 private HTTP route 时，确认调用方已认证、具有 administrator role，且未被只读状态阻止。

## 打包与发布

kernel plugin 使用普通 SiYuan 集市插件的发布流程：

1. 运行 `pnpm run build`。
2. 检查 `dist/kernel.js` 与 `package.zip`。
3. 检查 zip 中是否包含 `kernel.js`。
4. 为插件版本创建 GitHub release。
5. 上传 `package.zip`。
6. 首次发布时向 `siyuan-note/bazaar` 提交仓库索引。

不要发布 `minAppVersion` 低于 `3.7.0`、但又依赖 kernel plugin 的插件包。

## 进阶能力

| Capability | 典型需求 |
| --- | --- |
| `siyuan.mcp.registerTool` | 向 AI client 暴露边界清晰的插件操作。 |
| `siyuan.server.private.ws` | 交互式双向消息，例如远程控制 channel。 |
| `siyuan.server.private.es` | 向 client 推送单向的实时进度或事件流。 |
| `siyuan.client.fetch/socket/event` | 从 kernel code 调用或订阅 SiYuan HTTP、WebSocket 或 SSE API。 |
| `siyuan.storage.watcher` | 插件私有文件发生变化时作出反应。 |
| `siyuan.event` | 通过 kernel event bridge 接收和发布事件。 |

最小模板有意只覆盖 lifecycle、日志、存储、RPC 和 private HTTP status endpoint。MCP、HTTP、WebSocket、SSE 与 streaming 的完整示例请参阅 [siyuan-note/plugin-sample](https://github.com/siyuan-note/plugin-sample)。

## References

- 完整 API 示例：<https://github.com/siyuan-note/plugin-sample>
- Kernel plugin system：<https://github.com/siyuan-note/siyuan/pull/17487>
- Streaming proxy responses：<https://github.com/siyuan-note/siyuan/pull/17748>
- MCP tool management：<https://github.com/siyuan-note/siyuan/pull/17834>
