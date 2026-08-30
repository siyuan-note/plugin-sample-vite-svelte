export interface IntegrationCommandContext {
    os: string;
    serverAddrs: string[];
    currentOrigin: string;
    token: string;
}

export interface IntegrationCommand {
    shell: "PowerShell" | "curl";
    serverAddress: string;
    display: string;
    runnable: string;
}

export function createIntegrationCommand(
    pluginName: string,
    context: IntegrationCommandContext,
): IntegrationCommand {
    const serverAddress = chooseServerAddress(context.serverAddrs, context.currentOrigin);
    const endpoint = `${serverAddress}/plugin/private/${pluginName}/capture`;
    const tokenPlaceholder = "<SIYUAN_API_TOKEN>";

    if (context.os === "windows") {
        return {
            shell: "PowerShell",
            serverAddress,
            display: createPowerShellCommand(endpoint, tokenPlaceholder),
            runnable: createPowerShellCommand(endpoint, context.token),
        };
    }

    return {
        shell: "curl",
        serverAddress,
        display: createCurlCommand(endpoint, tokenPlaceholder),
        runnable: createCurlCommand(endpoint, context.token),
    };
}

function chooseServerAddress(serverAddrs: string[], currentOrigin: string): string {
    const localHttpAddress = serverAddrs.find((address) => /^http:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(address));
    if (localHttpAddress) {
        return localHttpAddress.replace(/\/$/, "");
    }

    const localAddress = serverAddrs.find((address) => /:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(address));
    const fallback = localAddress
        || (/^https?:\/\//.test(currentOrigin) ? currentOrigin : "")
        || serverAddrs[0]
        || "http://127.0.0.1:6806";
    return fallback.replace(/\/$/, "");
}

function createPowerShellCommand(endpoint: string, token: string): string {
    const certificateOption = endpoint.startsWith("https://") ? " -SkipCertificateCheck" : "";
    return `$headers = @{ Authorization = "Token ${escapePowerShell(token)}" }
$body = @{
    text = "A captured idea"
    source = "PowerShell Demo"
    commit = $true
    openUi = $true
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "${escapePowerShell(endpoint)}" -Headers $headers -ContentType "application/json" -Body $body${certificateOption}`;
}

function createCurlCommand(endpoint: string, token: string): string {
    return `curl -X POST \\
  -H 'Authorization: Token ${escapeShellSingleQuoted(token)}' \\
  -H 'Content-Type: application/json' \\
  -d '{"text":"A captured idea","source":"CLI Demo","commit":true,"openUi":true}' \\
  '${escapeShellSingleQuoted(endpoint)}'`;
}

function escapePowerShell(value: string): string {
    return value.replace(/`/g, "``").replace(/"/g, "`\"");
}

function escapeShellSingleQuoted(value: string): string {
    return value.replace(/'/g, `'"'"'`);
}
