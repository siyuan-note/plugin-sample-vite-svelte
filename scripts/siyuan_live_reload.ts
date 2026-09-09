/*
 * Development-only live reload for SiYuan plugins:
 * - The useLiveReload server watches the build output and broadcasts changes over WebSocket.
 * - The client injected into the bundle reloads the plugin through /api/petal/setPetalEnabled.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createServer as createLiveReloadServer } from "livereload";
import type { Plugin } from "vite";

export interface LiveReloadOptions {
    /** Build output directory relative to the project root. */
    outputDir: string;
    /**
     * LiveReload server port embedded into the client bundle. By default, a stable
     * port is derived from the plugin name. Set this when two plugins collide.
     */
    port?: number;
    /** Frontend value passed to /api/petal/setPetalEnabled. */
    frontend?: string;
    /** Reload notification. Defaults to "Live reload: <plugin name>". */
    message?: string;
    /**
     * Delay before the server broadcasts and the client processes changes.
     * A build may update the output directory in several passes, so the default
     * deliberately groups changes over a longer interval.
     */
    debounceMs?: number;
    /** Delay between disabling and re-enabling the plugin. */
    reloadGapMs?: number;
}

/**
 * Starts the LiveReload server and injects its client into development bundles.
 */
export function useLiveReload({
    outputDir,
    port,
    frontend = "desktop",
    message,
    debounceMs = 1000 * 5,
    reloadGapMs = 500,
}: LiveReloadOptions): Plugin {
    const projectRoot = findPluginRoot();
    const manifest = readPluginManifest(projectRoot);
    const liveReloadPort = port ?? deriveLiveReloadPort(manifest.name);
    const reloadMessage = message ?? `Live reload: ${manifest.name}`;
    console.log(`[live-reload] port: ${liveReloadPort}`);

    let server: ReturnType<typeof createLiveReloadServer> | undefined;

    return {
        name: "siyuan-live-reload",
        buildStart() {
            if (server) {
                return;
            }
            server = createLiveReloadServer({ port: liveReloadPort, delay: debounceMs });
            server.on("error", (error: NodeJS.ErrnoException) => {
                if (error.code === "EADDRINUSE") {
                    console.error(
                        `[live-reload] port ${liveReloadPort} is already in use, possibly by another plugin's dev watcher.\n` +
                        `  - Inspect the port: netstat -ano | findstr ${liveReloadPort}\n` +
                        `  - Choose another port: set useLiveReload({ port }) in vite.config.ts and restart the build.`
                    );
                } else {
                    console.error(`[live-reload] unable to listen on port ${liveReloadPort}:`, error);
                }
                throw error;
            });
            // LiveReload's hello response has a fixed serverName, so send a separate
            // identity message that prevents clients from connecting to another plugin's server.
            server.server.on("connection", (socket) => {
                socket.send(JSON.stringify({ command: "plugin-identity", plugin: manifest.name }));
            });
            server.watch(resolve(projectRoot, outputDir));
        },
        closeWatcher() {
            server?.close();
            server = undefined;
        },
        closeBundle() {
            // closeBundle runs after every rebuild in watch mode, where the server must stay alive.
            if (!this.meta.watchMode) {
                server?.close();
                server = undefined;
            }
        },
        banner: () => createClientScript({
            port: liveReloadPort,
            pluginName: manifest.name,
            frontend,
            message: reloadMessage,
            debounceMs,
            reloadGapMs
        })
    };
}

function findPluginRoot(): string {
    // Bundled Vite configs resolve this module from the project root, while the
    // native config loader resolves it from scripts/. Support both locations.
    for (const directory of [import.meta.dirname, resolve(import.meta.dirname, "..")]) {
        if (existsSync(resolve(directory, "plugin.json"))) {
            return directory;
        }
    }
    throw new Error("plugin.json not found (expected at project root)");
}

function readPluginManifest(projectRoot: string): { name: string } {
    return JSON.parse(readFileSync(resolve(projectRoot, "plugin.json"), "utf8"));
}

function deriveLiveReloadPort(pluginName: string): number {
    const portRangeStart = 35740;
    const portRangeSize = 1000;
    let hash = 2166136261;

    for (let index = 0; index < pluginName.length; index += 1) {
        hash ^= pluginName.charCodeAt(index);
        hash = Math.imul(hash, 16777619) >>> 0;
    }

    return portRangeStart + (hash % portRangeSize);
}

interface ClientOptions {
    /** LiveReload WebSocket port paired with the server started by useLiveReload. */
    port: number;
    pluginName: string;
    frontend: string;
    message: string;
    debounceMs: number;
    reloadGapMs: number;
}

/**
 * Generates the client injected into the bundle. The client reloads only after
 * the LiveReload server identifies itself as belonging to this plugin.
 */
function createClientScript({ port, pluginName, frontend, message, debounceMs, reloadGapMs }: ClientOptions): string {
    const values = JSON.stringify({ frontend, message, pluginName, port, debounceMs, reloadGapMs });

    return `(function () {
    const options = ${values};
    const socketKey = "__siYuanPluginLiveReload";
    // livereload server binds to whatever "localhost" resolves to (::1 on IPv6-preferring
    // systems, 127.0.0.1 otherwise); try both loopback forms to survive the mismatch.
    const hosts = ["localhost", "127.0.0.1"];
    let hostIndex = 0;
    // Handshake guard: only act on reload after the server has identified itself as
    // the livereload server of THIS plugin (avoids cross-plugin crosstalk when two
    // plugin projects' dev watches share a port).
    let ownerVerified = false;
    let warnedUnverified = false;
    const previousSocket = globalThis[socketKey];
    previousSocket?.close();

    const showMessage = (text) => {
        try {
            if (typeof require === "function") {
                require("siyuan").showMessage(text);
            }
        } catch (error) {
            console.warn("Unable to show SiYuan live reload message", error);
        }
    };

    const request = async (enabled) => {
        const response = await fetch("/api/petal/setPetalEnabled", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                packageName: options.pluginName,
                enabled,
                frontend: options.frontend
            })
        });
        const result = await response.json();
        if (result.code !== 0) {
            throw new Error(result.msg || "SiYuan rejected the plugin reload request");
        }
    };

    let reloadTimer;
    let reloadInFlight = false;
    let reloadPending = false;

    const runReload = async () => {
        if (reloadInFlight) {
            reloadPending = true;
            return;
        }

        reloadInFlight = true;
        showMessage(options.message);
        try {
            await request(false);
            await new Promise((resolve) => setTimeout(resolve, options.reloadGapMs));
            await request(true);
        } catch (error) {
            console.error("SiYuan plugin live reload failed", error);
            showMessage("Live reload failed: " + (error?.message || error));
        } finally {
            reloadInFlight = false;
            if (reloadPending) {
                reloadPending = false;
                scheduleReload();
            }
        }
    };

    const scheduleReload = () => {
        clearTimeout(reloadTimer);
        reloadTimer = setTimeout(runReload, options.debounceMs);
    };

    const connect = () => {
        const socket = new WebSocket("ws://" + hosts[hostIndex] + ":" + options.port + "/livereload");
        globalThis[socketKey] = socket;

        socket.addEventListener("open", () => {
            socket.send(JSON.stringify({
                command: "hello",
                protocols: ["http://livereload.com/protocols/official-7"],
                ver: "4.0.0"
            }));
        });

        socket.addEventListener("message", async (event) => {
            const payload = JSON.parse(event.data);
            if (payload.command === "plugin-identity") {
                if (payload.plugin === options.pluginName) {
                    ownerVerified = true;
                } else {
                    console.warn("[live-reload] livereload server on port " + options.port + " belongs to plugin '" + payload.plugin + "', not '" + options.pluginName + "'. Disconnecting; configure a different port for each plugin project.");
                    socket.close();
                }
                return;
            }
            if (payload.command === "reload") {
                if (!ownerVerified) {
                    if (!warnedUnverified) {
                        warnedUnverified = true;
                        console.warn("[live-reload] Ignoring reload: livereload server on port " + options.port + " did not identify itself as '" + options.pluginName + "'.");
                    }
                    return;
                }
                scheduleReload();
            }
        });

        socket.addEventListener("error", () => {
            hostIndex += 1;
            if (hostIndex < hosts.length) {
                setTimeout(connect, 200);
            } else {
                console.warn("SiYuan plugin live reload could not connect to port " + options.port + " (tried: " + hosts.join(", ") + ")");
            }
        });
    };

    connect();
})();`;
}
