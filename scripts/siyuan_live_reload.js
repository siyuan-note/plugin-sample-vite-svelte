import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Generates the development-only client embedded in the app bundle.
 * The client translates standard LiveReload messages into SiYuan's
 * single-plugin reload API, which works inside the current workspace.
 * @param {{ port: number, pluginName: string, frontend: string, message: string, debounceMs: number, reloadGapMs: number }} options
 */
export function createSiYuanLiveReloadScript({ port, pluginName, frontend, message, debounceMs, reloadGapMs }) {
    const values = JSON.stringify({ frontend, message, pluginName, port, debounceMs, reloadGapMs });

    return `(function () {
    const options = ${values};
    const socketKey = "__siYuanPluginLiveReload";
    const previousSocket = globalThis[socketKey];
    previousSocket?.close?.();

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

    const socket = new WebSocket("ws://127.0.0.1:" + options.port + "/livereload");
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
        if (payload.command === "reload") {
            scheduleReload();
        }
    });

    socket.addEventListener("error", () => {
        console.warn("SiYuan plugin live reload could not connect to port " + options.port);
    });
})();`;
}

export function readPluginManifest() {
    return JSON.parse(readFileSync(resolve(import.meta.dirname, "../plugin.json"), "utf8"));
}
