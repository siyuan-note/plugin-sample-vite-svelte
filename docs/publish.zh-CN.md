# 在发布页面运行插件

发布服务把工作空间的只读副本提供给访问者。发布页面照样加载插件的前端代码，但它跑在访问者浏览器里：没有内核插件，也没有私有存储。插件如果没有要给访问者看的内容，可以保持本模板的默认设置，不参与发布。

## 访问者端的运行环境

- `index.js`、`index.css`、`i18n/` 直属的 JSON 文件，以及 `publish.resources` 声明的文件会在访问者浏览器里加载。
- `kernel.js` 不加载，依赖内核服务的功能不可用。
- 发布页面不得调用 `loadData` 或 `saveData`，公开快照缺失时也不拿它们兜底。

## 两条数据通道

| | 私有 | 公开 |
| --- | --- | --- |
| API | `loadData` / `saveData` | `loadPublishData` / `savePublishData` |
| 存放位置 | 管理员设备上的 `data/storage/petal/` | 管理员生成的快照 |
| 谁可以读 | 管理员 | 任何访问者，包括页面上的其他代码 |

`savePublishData` 整份替换快照：省略的字段会被移除，每个值只能是字符串、数字、布尔值或 `null`。读取失败时，页面显示安全的默认内容。

## 三步互不触发

1. 管理员开启发布服务。
2. 管理员授权 `publish.data` 中声明的字段。授权会清空上一份快照。
3. 插件调用 `savePublishData` 写入快照。保存私有设置不会写入快照。

## 如何接入

把 `"disabledInPublish"` 设为 `false`，并声明哪些内容可以公开：

```json
{
  "minAppVersion": "3.8.6",
  "disabledInPublish": false,
  "publish": {
    "resources": ["asset/logo.png", "fonts/"],
    "data": ["themeMode"]
  }
}
```

- `publish.resources` 里是相对插件包根目录的路径：精确文件，或以 `/` 结尾的目录。目录声明还会覆盖之后新增的文件，所以私有文件不要放在这些目录里。
- `publish.data` 只接受标量值，字段要逐个列出。不要把整份设置对象公开出去。
- 快照接口要求思源 3.8.4；`publish.resources` 里写了目录时，要求 3.8.6。
- `plugin.json` 与 `kernel.js` 不可公开。

## 参考

- 可运行的示例：[plugin-sample v0.5.2](https://github.com/siyuan-note/plugin-sample/tree/v0.5.2) 实现了 `loadPublishData`、`savePublishData`、`onDataChanged` 和一个发布端的自定义块。
- 权限模型与 HTTP 契约：[插件发布](https://github.com/siyuan-note/siyuan/blob/master/docs/PLUGIN-PUBLISH.zh-CN.md)。
