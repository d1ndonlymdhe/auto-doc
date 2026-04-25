import z from "zod"
import { ZodRepr } from "../reflection"

type DescribedResponse = {
    description?: string
    headers: string[]
}

type StaticRedirectResponse = {
    type: "STATIC_REDIRECT",
    location: string,
} & DescribedResponse

type DynamicRedirectResponse = {
    type: "DYNAMIC_REDIRECT",
} & DescribedResponse

type DataResponse = {
    type: "DATA",
    data: z.ZodType
} & DescribedResponse

export type Response = (StaticRedirectResponse | DynamicRedirectResponse | DataResponse)

export function StaticRedirectResponse(location: string, headers?: string[], description?: string): StaticRedirectResponse {
    return {
        type: "STATIC_REDIRECT",
        location,
        description,
        headers: headers || []
    }
}

export function DynamicRedirectResponse(headers?: string[], description?: string): DynamicRedirectResponse {
    return {
        type: "DYNAMIC_REDIRECT",
        description,
        headers: headers || []
    }
}
export function DataResponse(data: z.ZodType, headers?: string[], description?: string): DataResponse {
    return {
        type: "DATA",
        data,
        description,
        headers: headers || []
    }
}
export function RepredResponse(response: Response) {
    if (response.type === "DATA") {
        return {
            ...response,
            data: ZodRepr(response.data)
        }
    }
    return response
}
export type ReprResponse = ReturnType<typeof RepredResponse>