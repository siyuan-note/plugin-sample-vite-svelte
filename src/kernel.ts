import type * as kernel from "siyuan/kernel";

const STORAGE_FILE = "kernel-sample.json";
const api: kernel.ISiyuan = siyuan;

api.plugin.lifecycle.onload = async () => {
    await api.logger.info(`[${api.plugin.name}] kernel plugin loading`);

    await api.storage.put(STORAGE_FILE, JSON.stringify({
        message: "Hello from the kernel plugin",
        updatedAt: new Date().toISOString(),
    }, null, 2));

    await api.rpc.bind("echo", async (...args) => {
        await api.logger.info(`[${api.plugin.name}] echo called`, args);
        return {
            plugin: api.plugin.name,
            platform: api.plugin.platform,
            args,
        };
    }, "Return the received arguments with kernel plugin metadata.");

    await api.rpc.bind("readSampleStorage", async () => {
        const data = await api.storage.get(STORAGE_FILE);
        return JSON.parse(await data.text());
    }, "Read the sample file stored by the kernel plugin.");

    api.server.private.http.handler = async (request) => {
        if (request.request.method !== "GET" || request.context.path !== "/status") {
            return {
                statusCode: 404,
                body: {
                    data: {
                        type: "JSON",
                        data: { error: "Not found" },
                    },
                },
            };
        }

        return {
            statusCode: 200,
            body: {
                data: {
                    type: "JSON",
                    data: {
                        name: api.plugin.name,
                        platform: api.plugin.platform,
                        status: "running",
                    },
                },
            },
        };
    };
};

api.plugin.lifecycle.onrunning = async () => {
    await api.logger.info(`[${api.plugin.name}] kernel plugin running`);
    await api.rpc.broadcast("notify", ["Kernel plugin is running"]);
};

api.plugin.lifecycle.onunload = async () => {
    await api.logger.info(`[${api.plugin.name}] kernel plugin unloading`);
    await api.rpc.unbind("echo");
    await api.rpc.unbind("readSampleStorage");
};
