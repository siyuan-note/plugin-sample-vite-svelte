import type * as kernel from "siyuan/kernel";
import type {
    AppendBlockResult,
    CaptureBroadcast,
    CaptureRecord,
    CaptureRequest,
    CaptureResult,
    CaptureServiceConfig,
    CaptureServiceSnapshot,
    KernelApiResponse,
} from "./contracts";

const CONFIG_FILE = "capture-service/config.json";
const HISTORY_FILE = "capture-service/history.json";
const MAX_CAPTURE_TEXT_LENGTH = 100_000;
const MAX_HISTORY_LENGTH = 20;

export class CaptureService {
    private readonly startedAt = new Date().toISOString();
    private config: CaptureServiceConfig = { notebookId: "", notebookName: "" };
    private recentCaptures: CaptureRecord[] = [];

    constructor(private readonly api: kernel.ISiyuan) {}

    async start(): Promise<void> {
        this.config = await this.readJson(CONFIG_FILE, this.config);
        this.recentCaptures = await this.readJson(HISTORY_FILE, []);
        this.api.server.private.http.handler = (request) => this.handleHttpRequest(request);
    }

    async stop(): Promise<void> {
        this.api.server.private.http.handler = null;
    }

    private async handleHttpRequest(request: kernel.IServerRequest): Promise<kernel.IHttpResponse> {
        const { method } = request.request;
        const { path } = request.context;

        try {
            if (method === "GET" && path === "/status") {
                return jsonResponse(200, this.snapshot());
            }
            if (method === "GET" && path === "/capture") {
                return jsonResponse(200, this.snapshot());
            }
            if (method === "PUT" && path === "/capture/config") {
                return jsonResponse(200, await this.updateConfig(await readJsonBody(request)));
            }
            if (method === "POST" && path === "/capture") {
                return jsonResponse(200, await this.capture(await readJsonBody(request)));
            }
            return jsonResponse(404, { error: "Capture service route not found" });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            await this.api.logger.warn("Capture service request rejected", { method, path, message });
            return jsonResponse(400, { error: message });
        }
    }

    private snapshot(): CaptureServiceSnapshot {
        return {
            status: "running",
            pluginName: this.api.plugin.name,
            platform: this.api.plugin.platform,
            startedAt: this.startedAt,
            config: this.config,
            recentCaptures: this.recentCaptures,
        };
    }

    private async updateConfig(input: unknown): Promise<CaptureServiceConfig> {
        if (!isRecord(input)) {
            throw new Error("Configuration must be a JSON object");
        }

        const notebookId = readOptionalString(input.notebookId);
        const notebookName = readOptionalString(input.notebookName);
        this.config = { notebookId, notebookName };
        await this.api.storage.put(CONFIG_FILE, JSON.stringify(this.config, null, 2));
        return this.config;
    }

    private async capture(input: unknown): Promise<CaptureResult> {
        const request = parseCaptureRequest(input);
        const capturedAt = new Date().toISOString();
        const result: CaptureResult = {
            mode: request.commit ? "committed" : "preview",
            markdown: formatCaptureMarkdown(request),
            capturedAt,
            source: request.source || "External capture",
            title: request.title || "",
        };

        if (request.commit) {
            if (!this.config.notebookId) {
                throw new Error("Choose a target notebook in the Capture Service GUI before writing");
            }

            const dailyNote = await this.callKernelApi<{ id: string }>("/api/filetree/createDailyNote", {
                notebook: this.config.notebookId,
            });
            const appended = await this.callKernelApi<AppendBlockResult[]>("/api/block/appendBlock", {
                dataType: "markdown",
                data: result.markdown,
                parentID: dailyNote.id,
            });
            const blockId = appended[0]?.doOperations?.[0]?.id || "";

            result.documentId = dailyNote.id;
            result.blockId = blockId;
            await this.recordCapture(result);
        }

        const event: CaptureBroadcast = { openUi: request.openUi === true, result };
        await this.api.rpc.broadcast("capture-received", [event]);
        return result;
    }

    private async recordCapture(result: CaptureResult): Promise<void> {
        const record: CaptureRecord = {
            id: result.blockId || `${Date.now()}`,
            capturedAt: result.capturedAt,
            source: result.source,
            title: result.title,
            markdown: result.markdown,
            notebookId: this.config.notebookId,
            documentId: result.documentId || "",
            blockId: result.blockId || "",
        };

        this.recentCaptures = [record, ...this.recentCaptures].slice(0, MAX_HISTORY_LENGTH);
        await this.api.storage.put(HISTORY_FILE, JSON.stringify(this.recentCaptures, null, 2));
    }

    private async callKernelApi<T>(path: `/${string}`, body: unknown): Promise<T> {
        const response = await this.api.client.fetch(path, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            throw new Error(`SiYuan API ${path} returned HTTP ${response.status}`);
        }

        const payload = await response.json() as KernelApiResponse<T>;
        if (payload.code !== 0) {
            throw new Error(payload.msg || `SiYuan API ${path} failed with code ${payload.code}`);
        }
        return payload.data;
    }

    private async readJson<T>(path: string, fallback: T): Promise<T> {
        try {
            const data = await this.api.storage.get(path);
            return await data.json() as T;
        } catch {
            return fallback;
        }
    }
}

function parseCaptureRequest(input: unknown): CaptureRequest {
    if (!isRecord(input)) {
        throw new Error("Capture request must be a JSON object");
    }

    const text = readOptionalString(input.text).trim();
    if (!text) {
        throw new Error("Capture text is required");
    }
    if (text.length > MAX_CAPTURE_TEXT_LENGTH) {
        throw new Error(`Capture text exceeds ${MAX_CAPTURE_TEXT_LENGTH} characters`);
    }

    return {
        text,
        source: readOptionalString(input.source).trim(),
        title: readOptionalString(input.title).trim(),
        url: readOptionalString(input.url).trim(),
        commit: input.commit === true,
        openUi: input.openUi === true,
    };
}

function formatCaptureMarkdown(request: CaptureRequest): string {
    const quote = request.text
        .split(/\r?\n/)
        .map((line) => `> ${line}`)
        .join("\n");
    const attribution = [
        request.title && request.url ? `[${request.title}](${request.url})` : request.title,
        request.source,
    ].filter(Boolean).join(" · ");

    return attribution ? `${quote}\n\n— ${attribution}` : quote;
}

async function readJsonBody(request: kernel.IServerRequest): Promise<unknown> {
    const data = request.request.body.data;
    if (!data) {
        throw new Error("A JSON request body is required");
    }
    return data.json();
}

function jsonResponse(statusCode: number, data: unknown): kernel.IHttpResponse {
    return {
        statusCode,
        body: {
            data: {
                type: "JSON",
                data,
            },
        },
    };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readOptionalString(value: unknown): string {
    if (value === undefined || value === null) {
        return "";
    }
    if (typeof value !== "string") {
        throw new Error("Capture fields must be strings");
    }
    return value;
}
