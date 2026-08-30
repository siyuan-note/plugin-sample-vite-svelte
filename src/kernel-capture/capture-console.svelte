<script lang="ts">
    import { onMount } from "svelte";
    import { lsNotebooks } from "../api";
    import { CaptureServiceClient } from "./frontend-client";
    import { createIntegrationCommand, type IntegrationCommandContext } from "./integration-command";
    import type { CaptureResult, CaptureServiceSnapshot } from "./contracts";

    interface Props {
        pluginName: string;
        labels: Record<string, string>;
        initialResult?: CaptureResult;
    }

    let { pluginName, labels, initialResult }: Props = $props();
    const client = $derived(new CaptureServiceClient(pluginName));
    const panelOpenedAt = new Date().toISOString();

    let snapshot: CaptureServiceSnapshot | null = $state(null);
    let notebooks: Notebook[] = $state([]);
    let selectedNotebookId = $state("");
    let text = $state("");
    let source = $state("CLI Demo");
    let title = $state("");
    let url = $state("");
    let result: CaptureResult | null = $state(null);
    let error = $state("");
    let busy = $state(false);
    let copiedCommand: "template" | "runnable" | null = $state(null);

    const endpoint = $derived(`/plugin/private/${pluginName}/capture`);
    const integrationCommand = $derived(createIntegrationCommand(pluginName, readIntegrationContext()));

    onMount(() => {
        result = initialResult || null;
        void refresh();
    });

    export async function refresh(): Promise<void> {
        error = "";
        try {
            const [serviceSnapshot, notebookResponse] = await Promise.all([
                client.getSnapshot(),
                lsNotebooks(),
            ]);
            snapshot = serviceSnapshot;
            notebooks = (notebookResponse.data?.notebooks || []).filter((notebook) => !notebook.closed);
            selectedNotebookId = serviceSnapshot.config.notebookId;
        } catch (reason) {
            error = messageFrom(reason);
        }
    }

    export function showCapture(captureResult: CaptureResult): void {
        result = captureResult;
        void refresh();
    }

    async function saveNotebook(): Promise<void> {
        const notebook = notebooks.find((item) => item.id === selectedNotebookId);
        if (!notebook) {
            error = labels.chooseNotebook;
            return;
        }

        await run(async () => {
            await client.updateConfig({ notebookId: notebook.id, notebookName: notebook.name });
            await refresh();
        });
    }

    async function submit(commit: boolean): Promise<void> {
        await run(async () => {
            result = await client.capture({ text, source, title, url, commit });
            if (commit) {
                text = "";
                await refresh();
            }
        });
    }

    async function copyCommand(kind: "template" | "runnable"): Promise<void> {
        const command = kind === "runnable"
            ? createIntegrationCommand(pluginName, readIntegrationContext(window.siyuan.config.api.token)).runnable
            : integrationCommand.display;
        await navigator.clipboard.writeText(command);
        copiedCommand = kind;
        window.setTimeout(() => copiedCommand = null, 1500);
    }

    async function run(operation: () => Promise<void>): Promise<void> {
        busy = true;
        error = "";
        try {
            await operation();
        } catch (reason) {
            error = messageFrom(reason);
        } finally {
            busy = false;
        }
    }

    function readIntegrationContext(token = ""): IntegrationCommandContext {
        return {
            os: window.siyuan.config.system.os,
            serverAddrs: window.siyuan.config.serverAddrs || [],
            currentOrigin: window.location.origin,
            token,
        };
    }

    function messageFrom(reason: unknown): string {
        return reason instanceof Error ? reason.message : String(reason);
    }
</script>

<div class="capture-console b3-dialog__content">
    <section class="intro">
        <div>
            <h2>{labels.title}</h2>
            <p>{labels.intro}</p>
        </div>
        <span class:running={snapshot?.status === "running"} class="service-status">
            {snapshot?.status === "running" ? labels.running : labels.connecting}
        </span>
    </section>

    <div class="flow" aria-label={labels.flowLabel}>
        <span>{labels.externalClient}</span><b>→</b><span>{labels.kernelService}</span><b>→</b><span>{labels.dailyNote}</span>
    </div>

    <section class="card lifetime">
        <div>
            <h3>{labels.serviceLifetime}</h3>
            <p>{labels.serviceLifetimeHelp}</p>
        </div>
        <dl>
            <div><dt>{labels.kernelStarted}</dt><dd>{snapshot ? new Date(snapshot.startedAt).toLocaleString() : labels.connecting}</dd></div>
            <div><dt>{labels.panelOpened}</dt><dd>{new Date(panelOpenedAt).toLocaleString()}</dd></div>
        </dl>
    </section>

    {#if error}
        <div class="error">{error}</div>
    {/if}

    <section class="card">
        <h3>{labels.targetNotebook}</h3>
        <p>{labels.targetNotebookHelp}</p>
        <div class="row">
            <select class="b3-select fn__flex-1" bind:value={selectedNotebookId} disabled={busy}>
                <option value="">{labels.chooseNotebook}</option>
                {#each notebooks as notebook (notebook.id)}
                    <option value={notebook.id}>{notebook.name}</option>
                {/each}
            </select>
            <button class="b3-button" onclick={saveNotebook} disabled={busy || !selectedNotebookId}>{labels.saveTarget}</button>
        </div>
        {#if snapshot?.config.notebookName}
            <small>{labels.currentTarget}: {snapshot.config.notebookName}</small>
        {/if}
    </section>

    <section class="card">
        <h3>{labels.testCapture}</h3>
        <div class="fields">
            <label>{labels.source}<input class="b3-text-field" bind:value={source} /></label>
            <label>{labels.captureTitle}<input class="b3-text-field" bind:value={title} /></label>
            <label>{labels.url}<input class="b3-text-field" bind:value={url} /></label>
            <label class="wide">{labels.text}<textarea class="b3-text-field" bind:value={text} placeholder={labels.textPlaceholder}></textarea></label>
        </div>
        <div class="actions">
            <button class="b3-button b3-button--outline" onclick={() => submit(false)} disabled={busy || !text.trim()}>{labels.preview}</button>
            <button class="b3-button b3-button--text" onclick={() => submit(true)} disabled={busy || !text.trim() || !snapshot?.config.notebookId}>{labels.writeDailyNote}</button>
        </div>
    </section>

    {#if result}
        <section class="card result">
            <h3>{result.mode === "committed" ? labels.written : labels.previewResult}</h3>
            <pre>{result.markdown}</pre>
            {#if result.documentId}
                <small>{labels.documentId}: {result.documentId}{result.blockId ? ` · ${labels.blockId}: ${result.blockId}` : ""}</small>
            {/if}
        </section>
    {/if}

    <section class="card separation-demo">
        <h3>{labels.separationTitle}</h3>
        <p>{labels.separationHelp}</p>
        <ol>
            <li>{labels.separationStep1}</li>
            <li>{labels.separationStep2}</li>
            <li>{labels.separationStep3}</li>
        </ol>
        <div class="runtime-details">
            <span>{labels.detectedShell}: <strong>{integrationCommand.shell}</strong></span>
            <span>{labels.serverAddress}: <code>{integrationCommand.serverAddress}</code></span>
        </div>
        <code>{endpoint}</code>
        <div class="code-block">
            <pre>{integrationCommand.display}</pre>
        </div>
        <div class="actions">
            <button class="b3-button b3-button--outline" onclick={() => copyCommand("template")}>{copiedCommand === "template" ? labels.copied : labels.copyTemplate}</button>
            <button class="b3-button b3-button--text" onclick={() => copyCommand("runnable")} disabled={!snapshot?.config.notebookId}>{copiedCommand === "runnable" ? labels.copied : labels.copyRunnable}</button>
        </div>
        <p class="warning">{labels.tokenWarning}</p>
    </section>

    <section class="card">
        <h3>{labels.recentCaptures}</h3>
        {#if snapshot?.recentCaptures.length}
            <ul class="history">
                {#each snapshot.recentCaptures as capture (capture.id)}
                    <li><time>{new Date(capture.capturedAt).toLocaleString()}</time><strong>{capture.source}</strong><span>{capture.title || capture.markdown.split("\n")[0]}</span></li>
                {/each}
            </ul>
        {:else}
            <p>{labels.noCaptures}</p>
        {/if}
    </section>

    <footer>
        {labels.advancedIntro}
        <a href="https://github.com/siyuan-note/plugin-sample/tree/v0.5.0" target="_blank" rel="noreferrer">plugin-sample</a>
    </footer>
</div>

<style>
    .capture-console { display: grid; gap: 16px; overflow: auto; max-height: 78vh; }
    .intro { display: flex; align-items: start; justify-content: space-between; gap: 16px; }
    h2, h3, p { margin: 0; }
    h2 { margin-bottom: 6px; }
    h3 { margin-bottom: 8px; font-size: 15px; }
    .service-status { flex: none; padding: 4px 10px; border-radius: 999px; background: var(--b3-theme-surface-lighter); }
    .service-status.running { color: var(--b3-card-success-color); background: var(--b3-card-success-background); }
    .flow { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 14px; border-radius: var(--b3-border-radius); background: var(--b3-theme-surface); }
    .flow span { padding: 6px 10px; border: 1px solid var(--b3-border-color); border-radius: var(--b3-border-radius); }
    .card { display: grid; gap: 10px; padding: 16px; border: 1px solid var(--b3-border-color); border-radius: var(--b3-border-radius); }
    .row, .actions, .runtime-details { display: flex; align-items: center; gap: 8px; }
    .lifetime { grid-template-columns: minmax(0, 1fr) auto; }
    dl { display: grid; gap: 6px; margin: 0; }
    dl div { display: grid; grid-template-columns: auto auto; gap: 10px; }
    dt { color: var(--b3-theme-on-surface-light); }
    dd { margin: 0; }
    .separation-demo ol { display: grid; gap: 6px; margin: 0; padding-left: 22px; }
    .runtime-details { flex-wrap: wrap; justify-content: space-between; }
    .fields { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
    label { display: grid; gap: 5px; color: var(--b3-theme-on-surface); }
    label.wide { grid-column: 1 / -1; }
    textarea { min-height: 110px; resize: vertical; }
    .actions { justify-content: flex-end; }
    .error { padding: 10px 12px; color: var(--b3-card-error-color); background: var(--b3-card-error-background); border-radius: var(--b3-border-radius); }
    pre { margin: 0; padding: 12px; overflow: auto; white-space: pre-wrap; background: var(--b3-theme-surface); border-radius: var(--b3-border-radius); }
    code { overflow-wrap: anywhere; }
    .code-block { position: relative; }
    .warning { color: var(--b3-theme-error); }
    .history { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
    .history li { display: grid; grid-template-columns: auto auto 1fr; gap: 10px; align-items: baseline; }
    .history time { color: var(--b3-theme-on-surface-light); font-size: 12px; }
    .history span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    footer { padding-bottom: 8px; color: var(--b3-theme-on-surface-light); }
    footer a { margin-left: 4px; }
    @media (max-width: 700px) {
        .intro, .row, .flow, .runtime-details { align-items: stretch; flex-direction: column; }
        .lifetime { grid-template-columns: 1fr; }
        .flow b { display: none; }
        .fields { grid-template-columns: 1fr; }
        .history li { grid-template-columns: 1fr; gap: 2px; }
    }
</style>
