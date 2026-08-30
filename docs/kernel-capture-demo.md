# Run the capture service without its UI

This tutorial proves that the External Capture Service belongs to the SiYuan kernel, not to its Svelte panel.

You configure the service in the GUI, close the GUI, and call the service from a terminal. The Kernel Plugin writes the capture while the GUI is absent. It then asks each visible frontend to open the panel with the result.

## Before you run the command

The runnable command writes a real block to today's Daily Note. Use **Copy redacted template** if you only want to inspect the command.

The runnable command also contains your SiYuan workspace API token. The token grants administrator access. Do not paste the command into chat, logs, issue reports, or an untrusted application.

## Configure the target notebook

1. Open the plugin's top-bar menu.
2. Click **Kernel Plugin Example: External Capture Service**.
3. Select an open notebook under **Target notebook**.
4. Click **Save target**.

The panel shows the selected notebook as the current target.

## Preview a capture

1. Enter text under **Captured text**.
2. Optionally enter a source, a title, and a source URL.
3. Click **Preview Markdown**.

The panel shows the generated Markdown. The service does not create a Daily Note or a block during preview.

## Compare the two lifecycles

Find **The service does not belong to this panel** near the top of the panel.

The section shows two timestamps:

- **Kernel service started** records when `kernel.js` started.
- **This panel opened** records when the current Svelte component opened.

The Kernel timestamp normally comes first. Closing and reopening the panel changes only the panel timestamp.

## Call the service after you close the panel

1. Find **Prove that the service runs without the UI**.
2. Check the detected command type and Kernel server address.
3. Click **Copy runnable command with token**.
4. Close the Capture Service panel.
5. Open a terminal.
6. Paste and run the command.

On Windows, the panel generates a PowerShell `Invoke-RestMethod` command. On other systems, it generates a `curl` command.

The command sends `commit: true`, so the Kernel Plugin writes a block to today's Daily Note. It also sends `openUi: true`.

### If PowerShell reports `PartialChain`

The command generator prefers the localhost HTTP address from `window.siyuan.config.serverAddrs`. This avoids a self-signed HTTPS certificate for a local terminal call. If SiYuan exposes only HTTPS, the PowerShell 7 command includes `-SkipCertificateCheck`.

After you update the template, rebuild and reload the plugin before you copy the command again. For an existing command, replace `https://127.0.0.1:<port>` with the matching `http://127.0.0.1:<port>` address from `serverAddrs`.

After the request succeeds, each visible SiYuan frontend can open the Capture Service panel. The result shows the Daily Note ID and the new block ID. **Recent committed captures** also contains the new entry.

This sequence proves the runtime boundary:

```text
Svelte panel closes
        │
        │ no Capture Service UI exists
        ▼
Terminal sends an authenticated request
        │
        ▼
Kernel Plugin validates and writes the capture
        │
        ▼
Kernel broadcasts capture-received
        │
        ▼
Each visible frontend can open a new Svelte panel
```

## Keep the UI closed

To run the service without reopening the panel, change this field in the copied request:

```json
"openUi": false
```

Run the command again. The Kernel Plugin writes the capture, but the frontend does not open the panel.

## Send a preview from the terminal

To test the external endpoint without writing a block, change this field:

```json
"commit": false
```

You can keep `openUi: true`. The Kernel Plugin validates and formats the capture, then opens the panel with a preview result.

## Understand the security boundary

The private endpoint accepts authenticated administrator requests. It does not issue a token limited to `capture`.

Use the runnable command only on a trusted machine. Store long-lived tokens in the operating system's credential store or another protected local secret store. Do not expose the endpoint directly to the Internet.

For the architecture behind this tutorial, read [Why a Kernel Plugin is a service](./kernel-plugin.md). For other Kernel APIs, use the official [plugin-sample v0.5.0](https://github.com/siyuan-note/plugin-sample/tree/v0.5.0).
