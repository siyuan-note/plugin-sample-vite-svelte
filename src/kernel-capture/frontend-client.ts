import type {
    CaptureRequest,
    CaptureResult,
    CaptureServiceConfig,
    CaptureServiceSnapshot,
} from "./contracts";

export class CaptureServiceClient {
    private readonly baseUrl: string;

    constructor(pluginName: string) {
        this.baseUrl = `/plugin/private/${pluginName}`;
    }

    getSnapshot(): Promise<CaptureServiceSnapshot> {
        return this.request("/capture");
    }

    updateConfig(config: CaptureServiceConfig): Promise<CaptureServiceConfig> {
        return this.request("/capture/config", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(config),
        });
    }

    capture(request: CaptureRequest): Promise<CaptureResult> {
        return this.request("/capture", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request),
        });
    }

    private async request<T>(path: string, init?: RequestInit): Promise<T> {
        const response = await fetch(`${this.baseUrl}${path}`, init);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data?.error || `Capture service returned HTTP ${response.status}`);
        }
        return data as T;
    }
}
