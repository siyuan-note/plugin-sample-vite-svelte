
# SiYuan plugin sample with vite and svelte

[中文版](./README_zh_CN.md)

1. Using vite for packaging
2. Use symbolic linking instead of putting the project into the plugins directory program development
3. Built-in support for the svelte framework
4. Provides a github action template to automatically generate package.zip and upload to new release


## Get started

1. Make a copy of this repo as a template with the `Use this template` button, please note that the repo name must be the same as the plugin name, the default branch must be `main`

2. Clone your repo to a local development folder at any place
    - Notice: we **don't recommand** you to place the folder under your `{workspace}/data/plugins/` folder.

3. Create development symbolic links

    - It is recommended to create a symbolic link between your development directory and the plugins directory.
    - If you have python environment in you device, run the command `python scripts/make_dev_link.py`, input the `<plugin_dir>` i.e. the absolute path to the plugins directory, e.g.

        ```powershell
        >>> python make_dev_link.py
        Please input the directory of siyuan/data/plugins: H:\SiYuanDevSpace\data\plugins
        Symlink created: H:\SiYuanDevSpace\data\plugins\plugin-sample
        ```
    - If you haven't intalled python, while you are an unix user, you can use `ln` command
        ```sh
        ln -s ./dev "<plugin_dir>/<plugin_name>"
        ```
        - Notice: make sure that the name of symbolic link is same as the name in your plugin.json
    - If you haven't intalled python, while you are a windows user, you can download the `make_dev_link.exe` in release and run it in your workspace (as administrator)
    - If you haven't intalled python, while you are a windows user, and you don't trust any other exe file, you can make the symlink by your self
        1. Create a dev folder in your worksapce
        2. Using use [mklink](https://learn.microsoft.com/windows-server/administration/windows-commands/mklink) command to create symlink
            ```cmd
            mklink /d "<plugin_dir>\<plugin_name>" "<project_dir>\dev"
            ```
    - You may need to run it as administration.
    - As the generated softlink is the same as the plugin name, **do not put the project directory under plugins** (this is contrary to the webpack version)

4. Install NodeJS and pnpm, then run pnpm i in the command line under your repo folder
5. Execute pnpm run dev for real-time compilation
6. Open SiYuan marketplace and enable plugin in downloaded tab

## I18n

In terms of internationalization, our main consideration is to support multiple languages. Specifically, we need to
complete the following tasks:

* Meta information about the plugin itself, such as plugin description and readme
    * `description` and `readme` fields in plugin.json, and the corresponding README*.md file
* Text used in the plugin, such as button text and tooltips
    * src/i18n/*.json language configuration files
    * Use `this.i18.key` to get the text in the code
* Finally, declare the language supported by the plugin in the `i18n` field in plugin.json

It is recommended that the plugin supports at least English and Simplified Chinese, so that more people can use it more
conveniently.

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

* `name`: Plugin name, must be the same as the repo name, and must be unique globally (no duplicate plugin names in the
  marketplace)
* `author`: Plugin author name
* `url`: Plugin repo URL
* `version`: Plugin version number, it is recommended to follow the [semver](https://semver.org/) specification
* `displayName`: Template display name, mainly used for display in the marketplace list, supports multiple languages
    * `default`: Default language, must exist
    * `zh_CN`, `en_US` and other languages: optional, it is recommended to provide at least Chinese and English
* `description`: Plugin description, mainly used for display in the marketplace list, supports multiple languages
    * `default`: Default language, must exist
    * `zh_CN`, `en_US` and other languages: optional, it is recommended to provide at least Chinese and English
* `readme`: readme file name, mainly used to display in the marketplace details page, supports multiple languages
    * `default`: Default language, must exist
    * `zh_CN`, `en_US` and other languages: optional, it is recommended to provide at least Chinese and English
* `i18n`: Plugin supported language list
* `funding`: Plugin sponsorship information
    * `openCollective`: Open Collective name
    * `patreon`: Patreon name
    * `github`: GitHub login name
    * `custom`: Custom sponsorship link list

## Package

No matter which method is used to compile and package, we finally need to generate a package.zip, which contains at
least the following files:

* icon.png
* index.js
* plugin.json
* preview.png
* README*.md
* index.css (optional)
* i18n/* (optional)

## List on the marketplace

* `pnpm run build` to generate package.zip
* Create a new GitHub release using your new version number as the "Tag version". See here for an
  example: https://github.com/siyuan-note/plugin-sample/releases
* Upload the file package.zip as binary attachments
* Publish the release

If it is the first release, please create a pull request to
the [Community Bazaar](https://github.com/siyuan-note/bazaar) repository and modify the plugins.json file in it. This
file is the index of all community plugin repositories, the format is:

```json
{
  "repos": [
    "username/reponame"
  ]
}
```

After the PR is merged, the bazaar will automatically update the index and deploy through GitHub Actions. When releasing
a new version of the plugin in the future, you only need to follow the above steps to create a new release, and you
don't need to PR the community bazaar repo.

Under normal circumstances, the community bazaar repo will automatically update the index and deploy every hour,
and you can check the deployment status at https://github.com/siyuan-note/bazaar/actions.

## Use Github Action

The github action is included in this sample, you can use it to publish your new realse to marketplace automatically:

1. In your repo setting page `https://github.com/OWNER/REPO/settings/actions`, down to **Workflow Permissions** and open the configuration like this:

    ![](asset/action.png)

2. Push a tag in the format `v*` and github will automatically create a new release with new bulit package.zip

3. By default, it will only publish a pre-release, if you don't think this is necessary, change the settings in release.yml

    ```yaml
    - name: Release
        uses: ncipollo/release-action@v1
        with.
            allowUpdates: true
            artifactErrorsFailBuild: true
            artifacts: 'package.zip'
            token: ${{ secrets.GITHUB_TOKEN }}
            prerelease: true # change this to false
    ```

