import type z from "zod"
import { ZodRepr } from "../reflection"

export type RequestHeader = {
    name: string,
    description?: string
}

export type TypedRequest = {
    headers: RequestHeader[],
    params: {
        name: string,
        description?: string
    }[],
    query: {
        name: string,
        description?: string
    }[],
    body?: z.ZodType
}

export function Header(name: string, description?: string): RequestHeader {
    return { name, description }
}

export function Param(name: string, description?: string) {
    return { name, description }
}

export function Query(name: string, description?: string) {
    return { name, description }
}

export function Body(schema: z.ZodType) {
    return schema
}

function _TypedRequest(headers?: { name: string, description?: string }[], params?: { name: string, description?: string }[], query?: { name: string, description?: string }[], body?: z.ZodType): TypedRequest {
    return {
        headers: headers || [],
        params: params || [],
        query: query || [],
        body
    }
}
function RepredRequest(request: TypedRequest) {
    return {
        ...request,
        body: request.body ? ZodRepr(request.body) : undefined
    }
}
export type ReprRequest = ReturnType<typeof RepredRequest>

export function TypedRequest(body?: z.ZodType, params?: { name: string, description?: string }[], query?: { name: string, description?: string }[], headers?: { name: string, description?: string }[]): ReprRequest {
    return RepredRequest(_TypedRequest(headers, params, query, body))
}

