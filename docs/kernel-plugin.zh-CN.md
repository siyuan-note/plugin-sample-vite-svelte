# 为什么 Kernel Plugin 是一项服务

Frontend plugin 属于思源用户界面。Kernel Plugin 属于正在运行的思源 Kernel。

当一项功能需要独立于 Dialog、Dock、编辑器或浏览器 tab 持有状态和生命周期时，这个区别很重要。Kernel Plugin 以服务的形式持有该功能。Frontend 和可信外部程序是这项服务的 client。

要运行本模板的具体案例，请阅读[在没有 UI 时运行摘录服务](./kernel-capture-demo.zh-CN.md)。完整 API 请查看官方 [plugin-sample v0.5.0](https://github.com/siyuan-note/plugin-sample/tree/v0.5.0)。

## 服务持有不属于 UI 的工作

以外部摘录为例。阅读工具向思源发送文本。该功能需要选择笔记本、取得今天的日记、格式化文本、追加块并记录结果。

如果每个 client 都实现这些步骤，每个 client 都必须理解思源内部 API 和用户的归档规则。Kernel Plugin 可以只暴露一个领域操作：

```text
capture(text, source, metadata)
```

具体实现留在思源中：

```text
CLI、阅读工具或 frontend
            │
            │ 经过认证的 HTTP 请求
            ▼
       Kernel 摘录服务
            │
            ├─ 验证请求
            ├─ 应用目标笔记本配置
            ├─ 创建或取得今天的日记
            ├─ 追加格式化后的块
            ├─ 记录真实写入的摘录
            └─ 通知已连接的 frontend
```

关闭 Svelte 面板不会停止这项服务。停止思源 Kernel 会停止它。Kernel Plugin 不是操作系统 daemon。

## Frontend 和 Kernel 的生命周期相互独立

思源在 frontend plugin 环境中加载 `index.js`。思源在 Kernel 进程内的独立 goja runtime 中加载 `kernel.js`。

两部分分别进入 ready 状态。Frontend 必须观察 `kernel-plugin-state-change`，不能假设 Kernel RPC method 已经可用。

本模板直接展示两个生命周期：

- 摘录服务面板显示 Kernel 服务的启动时间。
- 面板同时显示当前 Svelte component 的打开时间。
- 外部请求可以在面板关闭期间到达。
- Kernel 服务可以 broadcast 结果，并请求每个可见的 frontend 重新打开面板。

Kernel lifecycle 持有长期资源。在 `onload` 中注册 handler、RPC method、watcher 和 Agent capability。在 `onunload` 中释放它们。

## 把状态放在所有者所在的 runtime

Frontend `saveData/loadData` 与 Kernel `siyuan.storage` 都使用插件包的持久化区域：

```text
data/storage/petal/<plugin-name>/
```

Kernel storage 不是同步能力更强的第二套数据库。两者真正的区别是状态归属。

Frontend 应持有面板布局、主题选择等 UI 偏好。Kernel 服务应持有任务 checkpoint、归档规则、queue、index 和服务历史。当多个 client 可以使用同一服务时，这些 client 应查询 Kernel 服务，不能分别维护互相竞争的状态副本。

连接到同一个思源 Kernel 的不同 frontend 可以使用同一个服务实例。不同设备运行不同的 Kernel 实例。思源可以同步插件的持久化文件，但不会把多个设备变成一个实时 Kernel Plugin 实例。

## 把 runtime 当作受控服务环境

Kernel Plugin 运行在隔离的 goja JavaScript runtime 中。它不是 Node.js、Electron renderer，也不能直接访问思源 Go object。

思源注入受控的 `siyuan.*` API。当前 runtime 还通过有限的 `require` registry 提供少量 Node-compatible module。不要假设 `fs`、`child_process`、`net`、`http` 等通用 Node builtin 存在。

Kernel code 没有 DOM。编辑器访问、Dialog、Dock、CSS 和其他 UI 行为应留在 frontend plugin。

服务需要某项能力时，再使用对应的 Kernel API：

| 服务需求 | Kernel capability |
| --- | --- |
| 接收命令并返回结果 | RPC call |
| 向可信外部 client 提供 route | Private HTTP handler |
| 向已连接 frontend 推送事件 | RPC broadcast |
| 保存服务持有的持久化状态 | `siyuan.storage` |
| 调用已有思源 HTTP API | `siyuan.client.fetch` |
| 保持双向连接 | WebSocket |
| 推送单向事件流 | Server-Sent Events |
| 向思源 Agent 增加领域操作 | `siyuan.agent.registerCapability` |

API 列表不能决定架构。只有当功能需要 Kernel 持有的状态、Kernel 持有的生命周期、多个 client、入站服务接口或 Agent 集成时，才应把服务部分放进 Kernel Plugin。

## 摘录端点是 private API，不是 public API

模板注册以下 route：

```text
GET  /plugin/private/<plugin-name>/capture
PUT  /plugin/private/<plugin-name>/capture/config
POST /plugin/private/<plugin-name>/capture
```

思源在调用 private handler 前检查认证、administrator role 和只读状态。外部调用方通过以下 header 提供 workspace API token：

```text
Authorization: Token <SIYUAN_API_TOKEN>
```

Workspace API token 是管理员凭据。它的权限不限于摘录端点。该端点适合你自己的本机脚本和可信伴随程序。不要把 token 交给不可信软件，也不要把端点直接暴露到互联网。

Svelte 面板从 `window.siyuan.config` 读取当前 server address、操作系统和 API token。页面只显示脱敏命令。只有用户明确点击 **复制包含 token 的可运行命令** 时，页面才把真实 token 写入剪贴板。

## 模板把协议细节藏在一个功能后面

摘录案例使用多个 Kernel API，但 GUI 不是 API playground。

`src/kernel-capture/kernel-service.ts` 持有以下职责：

- 分派 route
- 验证请求
- 保存目标笔记本配置
- 调用 Daily Note API
- 保存真实写入历史
- 通知 frontend

`src/kernel-capture/capture-console.svelte` 持有以下职责：

- 接收用户输入
- 显示服务状态
- 触发预览和真实写入
- 显示和复制终端命令
- 显示可见结果

`src/kernel-capture/integration-command.ts` 选择 PowerShell 或 `curl`，并安全地格式化命令。`src/kernel-capture/contracts.ts` 定义跨 runtime 传输的数据。`src/kernel-capture/frontend-client.ts` 向 Svelte component 隐藏 private HTTP 请求细节。

这样的分工只展示一条产品链路：

```text
请求 → Kernel 持有的服务 → 持久化结果 → frontend notification
```

官方 [plugin-sample v0.5.0](https://github.com/siyuan-note/plugin-sample/tree/v0.5.0) 继续覆盖 RPC batch、原始 WebSocket 和 SSE handler、storage watcher、Agent capability 及其余 Kernel API。

## 判断一项功能属于哪个 runtime

按顺序判断：

1. 功能是否需要当前编辑器、DOM 或其他 UI object？如果需要，把它留在 frontend。
2. 用户操作是否只调用一个已有思源 API 并显示结果？如果是，通常把它留在 frontend。
3. 面板关闭后功能是否仍要继续？功能是否服务多个 client、提供入站接口或注册 Agent capability？如果是，把服务部分放进 Kernel Plugin。
4. 功能是否同时包含服务和 UI？如果是，让 Kernel Plugin 持有状态和业务规则，让 frontend 持有展示和编辑器交互。

## 来源

- [思源 Kernel Plugin 实现](https://github.com/siyuan-note/siyuan/tree/master/kernel/plugin)
- [Kernel Plugin TypeScript 类型声明](https://github.com/siyuan-note/petal/blob/main/kernel.d.ts)
- [官方 plugin-sample v0.5.0](https://github.com/siyuan-note/plugin-sample/tree/v0.5.0)
- [Agent capability 访问控制场景](https://github.com/siyuan-note/siyuan/issues/18638)
