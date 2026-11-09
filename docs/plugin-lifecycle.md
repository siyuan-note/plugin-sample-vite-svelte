# Frontend Plugin Lifecycle

SiYuan runs the hooks of one plugin instance in sequence and waits for the Promise each
one returns, so `await` works inside them; a slow hook delays every phase after it. That
waiting gets a five-second cap once the plugin is disabled, reloaded, or uninstalled.

## Hook order

| Hook | Runs |
| --- | --- |
| `onload` | Once, when this frontend loads the plugin |
| `onLayoutReady` | At most once, after `onload` and kernel initialization |
| `onDataChanged` | After data written with `saveData` changes; never before the instance is ready |
| `onunload` | Once, before the plugin is disabled, reloaded, or removed |
| `uninstall` | Only when the plugin leaves the workspace, after `onunload` |

Pending `onDataChanged` calls are folded into one. The `reason` argument is `sync` when
SiYuan merges data from another device and `overwrite` when another frontend writes it.

If the plugin does not override `onDataChanged`, SiYuan reloads it on a data change
instead. Override the hook only when the plugin can apply the change without a reload.

Closing a window or quitting SiYuan does not run these hooks.

## Shutdown

```text
ON disable, reload, or uninstall
  deadline ← now + 5s               # one budget, every step below draws from it

  AWAIT pending onload, kernel init, onLayoutReady   # finished phases cost nothing
  AWAIT running onDataChanged                        # queued calls are dropped
  AWAIT onunload()
  IF the plugin leaves the workspace THEN AWAIT uninstall()

  WHEN the deadline passes:
    CALL each hook that has not run yet, once, without awaiting
    DETACH the kernel connection
```

Only the waiting is capped. Synchronous code in a hook runs until it returns, and the
deadline cannot interrupt it. A hook that timed out keeps running next to the remaining
steps, so `onunload` and `uninstall` may start with state that is only half initialized.

## What this template does

In `src/index.ts`:

- `onload` and `onunload` await the kernel RPC `bind` and `unbind` calls.
- `onLayoutReady` awaits the settings load, so the settings panel never reads a
  half-loaded configuration.
- Configuration is written only when the user confirms the settings dialog.
- `onunload` closes the Svelte dialog and removes the `eventBus` listener.

`siyuan.d.ts` documents the full contract next to the `Plugin` class.
