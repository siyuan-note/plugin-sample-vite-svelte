declare module "livereload" {
    interface LiveReloadServer {
        watch(paths: string | string[]): void;
        close(): void;
        on(event: "error", listener: (error: Error) => void): LiveReloadServer;
    }

    export function createServer(options?: {
        port?: number;
        delay?: number;
        host?: string;
    }): LiveReloadServer;
}
