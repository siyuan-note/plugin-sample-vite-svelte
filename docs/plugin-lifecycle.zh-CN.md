# 前端插件生命周期

思源按顺序执行同一个插件实例的生命周期钩子，等每个钩子返回的 Promise 结束后才开始下一个；钩子拖多久，后面的阶段就推迟多久。插件被禁用、重载或卸载时，这份等待限死在五秒。

## 钩子顺序

| 钩子 | 触发时机 |
| --- | --- |
| `onload` | 该前端加载插件时执行一次 |
| `onLayoutReady` | 在 `onload` 与内核初始化完成后最多执行一次 |
| `onDataChanged` | `saveData` 写入的数据变化后执行，实例就绪前不会触发 |
| `onunload` | 插件被禁用、重载或移除前执行一次 |
| `uninstall` | 仅当插件从工作空间移除时，在 `onunload` 之后执行 |

挂起的 `onDataChanged` 会合并成一次调用。`reason` 为 `sync` 表示思源刚做过多端同步合并，为 `overwrite` 表示其他前端写入了数据。

插件不覆盖 `onDataChanged` 时，思源改为重载整个插件。只有当插件能在不重载的前提下应用变更，才需要覆盖它。

关闭窗口或退出思源时，这些钩子不执行。

## 关停流程

```text
收到 禁用 / 重载 / 卸载
  deadline ← 当前时间 + 5 秒          # 一份预算，下面每步都从同一份里扣

  AWAIT 尚未结束的 onload、内核初始化、onLayoutReady   # 已经跑完的不计入
  AWAIT 正在执行的 onDataChanged                      # 排队未开始的直接丢弃
  AWAIT onunload()
  IF 插件从工作空间移除 THEN AWAIT uninstall()

  五秒到期后：
    CALL 每个尚未执行的钩子一次，但不 AWAIT
    DETACH 内核连接
```

被截断的只是等待。钩子里的同步代码会一直执行到返回，到期也打断不了。超时的钩子会继续跑，与剩下的步骤并行，所以 `onunload` 和 `uninstall` 可能面对只初始化了一半的状态。

## 本模板的做法

`src/index.ts` 中：

- `onload` 与 `onunload` 都等待内核 RPC 的 `bind` 与 `unbind` 调用。
- `onLayoutReady` 等待设置加载完成，设置面板不会读到只加载了一半的配置。
- 用户在设置对话框里确认时，配置才写入。
- `onunload` 关闭 Svelte 对话框并移除 `eventBus` 监听。

完整契约写在 `siyuan.d.ts` 的 `Plugin` 注释里。
