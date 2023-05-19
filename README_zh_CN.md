[English](./README.md)

# 使用 vite + svelte 的思源笔记插件示例

1. 使用 vite 打包
2. 使用符号链接、而不是把项目放到插件目录下的模式进行开发
3. 内置对 svelte 框架的支持
4. 提供一个github action 模板，能自动生成package.zip并上传到新版本中

## 开始

1. 通过 <kbd>Use this template</kbd> 按钮将该库文件复制到你自己的库中，请注意库名必须和插件名称一致，默认分支必须为 `main`
2. 将你的库克隆到本地开发文件夹中
    * 注意: 同 `plugin-sample` 不同, 本样例并不推荐直接把代码下载到 `{workspace}/data/plugins/`
3. 创建开发需要的符号链接
    - 推荐使用符号链接来链接你的工作目录和插件目录
    - 如果你的设备安装了 python 环境，运行 `python scripts/make_dev_link.py` 命令，然后输入插件目录的绝对路径，示例:
         ```powershell
        >>> python make_dev_link.py
        Please input the directory of siyuan/data/plugins: H:\临时文件夹\SiYuanDevSpace\data\plugins
        Symlink created: H:\临时文件夹\SiYuanDevSpace\data\plugins\plugin-sample-vite-svelte
        ```
    - 如果您没有安装 python 环境但是是 unix 用户，可以直接使用 ln 命令创建符号链接
        ```sh
        ln -s ./dev "<plugin_dir>/<plugin_name>"
        ```
        - 注意：要确保符号链接的名称 `plugin_name` 和 plugin.json 中的 name 字段保持一致
    - 如果您没有安装 python 环境，而且是 windows 用户, 您可以直接下载我们提供的 `make_dev_link.exe` 放在根目录下, 以管理员方式运行
    - 如果您没有安装 python 环境，而且是 windows 用户, 而且对外来的 exe 不信任，你也可以手动创建符号链接
        1. 首先手动在工作目录下创建 dev 目录
        2. windows 用户请在**管理员** cmd 环境下 使用 [mklink](https://learn.microsoft.com/windows-server/administration/windows-commands/mklink) 命令, 注意要使用绝对路径
            ```cmd
            mklink /d "<plugin_dir>\<plugin_name>" "<project_dir>\dev"
            ```
    - 可能需要使用**管理员身份**来运行上面的命令
    - 注意: 由于生成的符号链接和 plugin name 相同，所以不要把工程目录放在 plugins 下（这一点和 plugin-sample 模板相反）

4. 安装 [NodeJS](https://nodejs.org/en/download) 和 [pnpm](https://pnpm.io/installation)，然后在开发文件夹下执行 `pnpm i`
5. 执行 `pnpm run dev` 进行实时编译
6. 在思源中打开集市并在下载选项卡中启用插件


## 国际化

国际化方面我们主要考虑的是支持多语言，具体需要完成以下工作：

* 插件自身的元信息，比如插件描述和自述文件
    * plugin.json 中的 `description` 和 `readme` 字段，以及对应的 README*.md 文件
* 插件中使用的文本，比如按钮文字和提示信息
    * src/i18n/*.json 语言配置文件
    * 代码中使用 `this.i18.key` 获取文本
* 最后在 plugin.json 中的 `i18n` 字段中声明该插件支持的语言

建议插件至少支持英文和简体中文，这样可以方便更多人使用。

## plugin.json

```json
{
  "name": "plugin-sample-vite-svelte",
  "author": "frostime",
  "url": "https://github.com/siyuan-note/plugin-sample-vite-svelte",
  "version": "1.0.0",
  "displayName": {
    "en_US": "Plugin sample with vite and svelte",
    "zh_CN": "插件样例 vite + svelte 版"
  },
  "description": {
    "en_US": "SiYuan plugin sample with vite and svelte",
    "zh_CN": "使用 vite 和 svelte 开发的思源插件样例"
  },
  "readme": {
    "en_US": "README_en_US.md",
    "zh_CN": "README.md"
  },
  "i18n": [
    "en_US",
    "zh_CN"
  ],
  "funding": {
    "custom": [
      "https://afdian.net/a/frostime"
    ]
  }
}
```

* `name`：插件名称，必须和库名一致，且全局唯一（集市中不能有重名插件）
* `author`：插件作者名
* `url`：插件仓库地址
* `version`：插件版本号，建议遵循 [semver](https://semver.org/lang/zh-CN/) 规范
* `displayName`：模板显示名称，主要用于模板集市列表中显示，支持多语言
    * `default`：默认语言，必须存在
    * `zh_CN`、`en_US` 等其他语言：可选，建议至少提供中文和英文
* `description`：插件描述，主要用于插件集市列表中显示，支持多语言
    * `default`：默认语言，必须存在
    * `zh_CN`、`en_US` 等其他语言：可选，建议至少提供中文和英文
* `readme`：自述文件名，主要用于插件集市详情页中显示，支持多语言
    * `default`：默认语言，必须存在
    * `zh_CN`、`en_US` 等其他语言：可选，建议至少提供中文和英文
* `i18n`：插件支持的语言列表
* `funding`：插件赞助信息
    * `openCollective`：Open Collective 名称
    * `patreon`：Patreon 名称
    * `github`：GitHub 登录名
    * `custom`：自定义赞助链接列表

## 打包

无论使用何种方式编译打包，我们最终需要生成一个 package.zip，它至少包含如下文件：

* icon.png
* index.js
* plugin.json
* preview.png
* README*.md
* index.css (optional)
* i18n/* (optional)

## 上架集市

* 执行 `pnpm run build` 生成 package.zip
* 在 GitHub 上创建一个新的发布，使用插件版本号作为 “Tag
  version”，示例 https://github.com/siyuan-note/plugin-sample/releases
* 上传 package.zip 作为二进制附件
* 提交发布

如果是第一次发布版本，还需要创建一个 PR 到 [Community Bazaar](https://github.com/siyuan-note/bazaar) 社区集市仓库，修改该库的
plugins.json。该文件是所有社区插件库的索引，格式为：

```json
{
  "repos": [
    "username/reponame"
  ]
}
```

PR 被合并以后集市会通过 GitHub Actions 自动更新索引并部署。后续发布新版本插件时只需要按照上述步骤创建新的发布即可，不需要再
PR 社区集市仓库。

正常情况下，社区集市仓库每隔 1 小时会自动更新索引并部署，可在 https://github.com/siyuan-note/bazaar/actions 查看部署状态。

## 使用 Github action 自动发布

样例中自带了 github action，可以自动打包发布，请遵循以下操作：

1. 设置项目 `https://github.com/OWNER/REPO/settings/actions` 页面向下划到 **Workflow Permissions**，打开配置

    ![](asset/action.png)

2. 需要发布版本的时候，push 一个格式为 `v*` 的 tag，github 就会自动打包发布 release（包括 package.zip）

3. 默认使用保守策略进行 pre-release 发布，如果觉得没有必要，可以更改 release.yml 中的设置：

    ```yaml
    - name: Release
        uses: ncipollo/release-action@v1
        with:
            allowUpdates: true
            artifactErrorsFailBuild: true
            artifacts: 'package.zip'
            token: ${{ secrets.GITHUB_TOKEN }}
            prerelease: true # 把这个改为 false
    ```


