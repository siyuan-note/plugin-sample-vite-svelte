export interface CaptureServiceConfig {
    notebookId: string;
    notebookName: string;
}

export interface CaptureRequest {
    text: string;
    source?: string;
    title?: string;
    url?: string;
    commit?: boolean;
    openUi?: boolean;
}

export interface CaptureRecord {
    id: string;
    capturedAt: string;
    source: string;
    title: string;
    markdown: string;
    notebookId: string;
    documentId: string;
    blockId: string;
}

export interface CaptureResult {
    mode: "preview" | "committed";
    markdown: string;
    capturedAt: string;
    source: string;
    title: string;
    documentId?: string;
    blockId?: string;
}

export interface CaptureServiceSnapshot {
    status: "running";
    pluginName: string;
    platform: string;
    startedAt: string;
    config: CaptureServiceConfig;
    recentCaptures: CaptureRecord[];
}

export interface CaptureBroadcast {
    openUi: boolean;
    result: CaptureResult;
}

export interface KernelApiResponse<T> {
    code: number;
    msg: string;
    data: T;
}

export interface AppendBlockResult {
    doOperations?: Array<{ id?: string }>;
}
