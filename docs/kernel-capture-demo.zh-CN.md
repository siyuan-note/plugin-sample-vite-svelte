# 在没有 UI 时运行摘录服务

本教程用于验证外部摘录服务属于思源 Kernel，而不属于它的 Svelte 面板。

你先在 GUI 中配置服务，然后关闭 GUI 并从终端调用服务。Kernel Plugin 在没有 GUI 的情况下写入摘录。完成后，它请求每个可见的 frontend 带着结果重新打开面板。

## 运行命令前

可运行命令会向今天的日记写入真实块。如果你只想检查命令，请点击 **复制脱敏模板**。

可运行命令还包含思源 workspace API token。该 token 具有管理员权限。不要把命令粘贴到聊天、日志、Issue 或不可信应用中。

## 配置目标笔记本

1. 打开插件的顶栏菜单。
2. 点击 **Kernel Plugin 示例：外部摘录服务**。
3. 在 **目标笔记本** 下选择一个已打开的笔记本。
4. 点击 **保存目标**。

面板将选中的笔记本显示为当前目标。

## 预览摘录

1. 在 **摘录内容** 中输入文本。
2. 根据需要填写来源、标题和来源网址。
3. 点击 **预览 Markdown**。

面板显示生成的 Markdown。预览期间，服务不会创建日记或块。

## 对比两个生命周期

在面板顶部找到 **服务不属于这个面板**。

该区域显示两个时间：

- **Kernel 服务启动时间**记录 `kernel.js` 的启动时间。
- **本面板打开时间**记录当前 Svelte component 的打开时间。

通常 Kernel 时间更早。关闭并重新打开面板只会改变面板时间。

## 关闭面板后调用服务

1. 找到 **验证服务脱离 UI 仍然运行**。
2. 检查页面检测到的命令类型和 Kernel server address。
3. 点击 **复制包含 token 的可运行命令**。
4. 关闭摘录服务面板。
5. 打开终端。
6. 粘贴并运行命令。

Windows 系统生成 PowerShell `Invoke-RestMethod` 命令。其他系统生成 `curl` 命令。

命令传入 `commit: true`，因此 Kernel Plugin 会向今天的日记写入一个块。命令同时传入 `openUi: true`。

### PowerShell 报告 `PartialChain` 时

命令生成器优先使用 `window.siyuan.config.serverAddrs` 中的 localhost HTTP 地址。本机终端调用因此不会经过自签名 HTTPS 证书。如果思源只提供 HTTPS，PowerShell 7 命令会包含 `-SkipCertificateCheck`。

更新模板后，请重新构建并加载插件，再复制一次命令。对于已经复制的命令，可以把 `https://127.0.0.1:<port>` 替换为 `serverAddrs` 中对应的 `http://127.0.0.1:<port>` 地址。

请求成功后，每个可见的思源 frontend 都可以打开摘录服务面板。结果区域显示日记文档 ID 和新增块 ID。**最近真实写入的摘录**也包含该记录。

该过程直接展示 runtime 边界：

```text
Svelte 面板关闭
      │
      │ 摘录服务 GUI 不存在
      ▼
终端发送经过认证的请求
      │
      ▼
Kernel Plugin 验证并写入摘录
      │
      ▼
Kernel broadcast capture-received
      │
      ▼
每个可见 frontend 都可以打开新的 Svelte 面板
```

## 保持 UI 关闭

如果你不希望请求重新打开面板，请修改复制命令中的字段：

```json
"openUi": false
```

再次运行命令。Kernel Plugin 仍然写入摘录，但 frontend 不会打开面板。

## 从终端发送预览

如果你要测试外部端点但不写入块，请修改以下字段：

```json
"commit": false
```

你可以保留 `openUi: true`。Kernel Plugin 验证并格式化摘录，然后打开面板显示预览结果。

## 理解安全边界

Private endpoint 接收经过认证的管理员请求。它不会签发一个权限仅限 `capture` 的 token。

只在可信设备上使用可运行命令。把长期使用的 token 保存在操作系统 credential store 或其他受保护的本机 secret store 中。不要把该端点直接暴露到互联网。

架构说明请阅读[为什么 Kernel Plugin 是一项服务](./kernel-plugin.zh-CN.md)。其他 Kernel API 请查看官方 [plugin-sample v0.5.0](https://github.com/siyuan-note/plugin-sample/tree/v0.5.0)。
