import { Header, type RequestHeader } from "./RequestTypes";

function prependHeader(defaultHeader: RequestHeader, headers: RequestHeader[]): RequestHeader[] {
    const hasHeader = headers.some((h) => h.name.toLowerCase() === defaultHeader.name.toLowerCase());
    if (hasHeader) {
        return headers;
    }
    return [defaultHeader, ...headers];
}

export function traceHeader(...headers: RequestHeader[]): RequestHeader[] {
    return prependHeader(Header("x-trace-id", "Tracing id for diagnostics"), headers);
}

export function authHeader(...headers: RequestHeader[]): RequestHeader[] {
    return prependHeader(Header("authorization", "Bearer token"), headers);
}
