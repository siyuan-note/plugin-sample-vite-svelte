import { existsSync } from "node:fs";
import { resolve } from "path";
import { defineConfig, type Plugin } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { createServer as createLiveReloadServer } from "livereload";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import zipPack from "vite-plugin-zip-pack";
import fg from "fast-glob";

import vitePluginYamlI18n from "./yaml-plugin.js";
import { createSiYuanLiveReloadScript, readPluginManifest } from "./scripts/siyuan_live_reload.js";

const env = process.env;
const isSrcmap = env.VITE_SOURCEMAP === "inline";
const isDev = env.NODE_ENV === "development";
const buildTarget = env.VITE_BUILD_TARGET === "kernel" ? "kernel" : "app";

const outputDir = isDev ? "dev" : "dist";
const pluginManifest = readPluginManifest();
const packageImageTargets = [
    ["icon", "icon.png"],
    ["preview", "preview.png"],
].flatMap(([field, legacyName]) => {
    const fileName = pluginManifest[field] || (existsSync(legacyName) ? legacyName : "");
    return fileName ? [{ src: `./${fileName}`, dest: "./" }] : [];
});
const liveReloadPort = Number.parseInt(env.SIYUAN_LIVERELOAD_PORT || "35740", 10);
const liveReloadFrontend = env.SIYUAN_LIVERELOAD_FRONTEND || "desktop";
const liveReloadMessage = env.SIYUAN_LIVERELOAD_MESSAGE || `Live reload: ${pluginManifest.name}`;
const liveReloadDebounceMs = Number.parseInt(env.SIYUAN_LIVERELOAD_DEBOUNCE_MS || "300", 10);
const pluginReloadGapMs = Number.parseInt(env.SIYUAN_PLUGIN_RELOAD_GAP_MS || "500", 10);

console.log("isDev=>", isDev);
console.log("isSrcmap=>", isSrcmap);
console.log("outputDir=>", outputDir);
console.log("buildTarget=>", buildTarget);

export default defineConfig(buildTarget === "kernel" ? {
    build: {
        outDir: outputDir,
        emptyOutDir: false,
        minify: true,
        sourcemap: isSrcmap ? "inline" : false,

        lib: {
            entry: resolve(import.meta.dirname, "src/kernel.ts"),
            name: "KernelPluginSample",
            fileName: () => "kernel.js",
            formats: ["iife"],
        },
        rollupOptions: {
            plugins: isDev ? [
                watchExternalFiles(["src/kernel.ts"])
            ] : [
                cleanupDistFiles({
                    patterns: ["i18n/*.yaml", "i18n/*.md"],
                    distDir: outputDir
                }),
                zipPack({
                    inDir: "./dist",
                    outDir: "./",
                    outFileName: "package.zip"
                })
            ],

            external: [],

            output: {
                entryFileNames: "kernel.js",
            },
        },
    }
} : {
    resolve: {
        alias: {
            "@": resolve(import.meta.dirname, "src"),
        }
    },

    plugins: [
        svelte(),

        vitePluginYamlI18n({
            inDir: "public/i18n",
            outDir: `${outputDir}/i18n`
        }),

        viteStaticCopy({
            targets: [
                ...packageImageTargets,
                { src: "./README*.md", dest: "./" },
                { src: "./docs/*.md", dest: "./docs", rename: { stripBase: true } },
                { src: "./asset/*", dest: "./asset", rename: { stripBase: true } },
                { src: "./plugin.json", dest: "./" },
            ],
        }),
    ],

    define: {
        "process.env.DEV_MODE": JSON.stringify(isDev),
        "process.env.NODE_ENV": JSON.stringify(env.NODE_ENV)
    },

    build: {
        outDir: outputDir,
        emptyOutDir: false,
        minify: true,
        sourcemap: isSrcmap ? "inline" : false,

        lib: {
            entry: resolve(import.meta.dirname, "src/index.ts"),
            fileName: () => "index.js",
            cssFileName: "index",
            formats: ["cjs"],
        },
        rollupOptions: {
            plugins: isDev ? [
                liveReloadServer(),
                siYuanPluginReload(),
                watchExternalFiles([
                    "public/i18n/**",
                    "./README*.md",
                    "./docs/*.md",
                    "./plugin.json"
                ])
            ] : [],

            external: ["siyuan", "process"],

            output: {
                entryFileNames: "[name].js",
                assetFileNames: (assetInfo) => assetInfo.name ?? "asset",
            },
        },
    }
});

function liveReloadServer(): Plugin {
    let server: ReturnType<typeof createLiveReloadServer> | undefined;

    return {
        name: "siyuan-live-reload-server",
        buildStart() {
            if (server) {
                return;
            }

            server = createLiveReloadServer({
                port: liveReloadPort,
                delay: liveReloadDebounceMs
            });
            server.on("error", (error) => {
                console.error(`[live-reload] unable to listen on port ${liveReloadPort}:`, error);
                throw error;
            });
            server.watch(resolve(import.meta.dirname, outputDir));
        },
        closeWatcher() {
            server?.close();
            server = undefined;
        }
    };
}

function siYuanPluginReload(): Plugin {
    return {
        name: "siyuan-plugin-reload",
        banner: () => createSiYuanLiveReloadScript({
            port: liveReloadPort,
            pluginName: pluginManifest.name,
            frontend: liveReloadFrontend,
            message: liveReloadMessage,
            debounceMs: liveReloadDebounceMs,
            reloadGapMs: pluginReloadGapMs
        })
    };
}

function watchExternalFiles(patterns: string[]): Plugin {
    return {
        name: "watch-external",
        async buildStart() {
            const files = await fg(patterns);
            for (const file of files) {
                this.addWatchFile(file);
            }
        }
    };
}

/**
 * Clean up some dist files after compiled
 * @author frostime
 * @param options:
 * @returns
 */
function cleanupDistFiles(options: { patterns: string[], distDir: string }): Plugin {
    const {
        patterns,
        distDir
    } = options;

    return {
        name: "rollup-plugin-cleanup",
        enforce: "post",
        writeBundle: {
            sequential: true,
            order: "post" as "post",
            async handler() {
                const fg = await import("fast-glob");
                const fs = await import("fs");
                // const path = await import('path');

                // 使用 glob 语法，确保能匹配到文件
                const distPatterns = patterns.map(pat => `${distDir}/${pat}`);
                console.debug("Cleanup searching patterns:", distPatterns);

                const files = await fg.default(distPatterns, {
                    dot: true,
                    absolute: true,
                    onlyFiles: false
                });

                // console.info('Files to be cleaned up:', files);

                for (const file of files) {
                    try {
                        if (fs.default.existsSync(file)) {
                            const stat = fs.default.statSync(file);
                            if (stat.isDirectory()) {
                                fs.default.rmSync(file, { recursive: true });
                            } else {
                                fs.default.unlinkSync(file);
                            }
                            console.log(`Cleaned up: ${file}`);
                        }
                    } catch (error) {
                        console.error(`Failed to clean up ${file}:`, error);
                    }
                }
            }
        }
    };
}
