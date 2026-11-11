# Running a Plugin on Published Pages

The publishing service serves a read-only copy of a workspace to visitors. A published
page still loads the plugin's frontend code, but in the visitor's browser: no kernel
plugin, no private storage. A plugin with nothing to show visitors can keep this
template's default and stay out.

## The visitor runtime

- `index.js`, `index.css`, the JSON files directly under `i18n/`, and the files listed in
  `publish.resources` load in the visitor's browser.
- `kernel.js` never loads, so features behind a kernel service are unavailable.
- The page must not call `loadData` or `saveData`, not even as a fallback when the public
  snapshot is missing.

## Two data channels

| | Private | Public |
| --- | --- | --- |
| API | `loadData` / `saveData` | `loadPublishData` / `savePublishData` |
| Stored in | `data/storage/petal/` on the administrator's devices | A snapshot the administrator generates |
| Read by | The administrator | Any visitor, including other code on the page |

`savePublishData` replaces the whole snapshot: omitted fields are removed, and each value
must be a string, number, boolean, or `null`. If a read fails, the page shows a safe
default.

## Three independent steps

1. The administrator enables the publishing service.
2. The administrator grants the fields declared in `publish.data`. Granting clears the
   previous snapshot.
3. The plugin writes the snapshot with `savePublishData`. Saving private settings does
   not write it.

## Opting in

Set `"disabledInPublish": false` and declare what may become public:

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

- `publish.resources` holds paths relative to the plugin package root: exact files, or
  directories ending in `/`. A directory entry also covers files added later, so keep
  private files outside it.
- `publish.data` accepts scalar values only, listed one field at a time. Never publish a
  whole settings object.
- The snapshot API requires SiYuan 3.8.4; a directory entry in `publish.resources`
  requires 3.8.6.
- `plugin.json` and `kernel.js` cannot be published.

## Reference

- Working example: [plugin-sample v0.5.2](https://github.com/siyuan-note/plugin-sample/tree/v0.5.2)
  implements `loadPublishData`, `savePublishData`, `onDataChanged`, and a published
  custom block.
- Permission model and HTTP contract: [Plugin publishing](https://github.com/siyuan-note/siyuan/blob/master/docs/PLUGIN-PUBLISH.md).
