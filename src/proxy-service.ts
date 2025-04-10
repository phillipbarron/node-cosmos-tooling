const proxyServerEnvironmentKeys = [
    "http_server",
    "https_server",
    "HTTTP_SERVER",
    "HTTTPS_SERVER",
];

export function isProxyServerSet(): boolean {
    return proxyServerEnvironmentKeys.some((key) => process.env[key] !== undefined);
}

export function getProxies(): Record<string, string> {
    const proxies: Record<string, string> = {};
    proxyServerEnvironmentKeys.forEach((key) => {
        if (process.env[key]) {
            proxies[key] = process.env[key] as string;
        }
    });
    return proxies;
}