import express, { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { METHODS } from 'node:http'
import { Result } from './Result';
import type { Request, Response } from 'express';
import z from 'zod';


const methods = METHODS.map(m => m.toLowerCase())

export enum SuccessCode {
    OK = 200,
    CREATED = 201,
    ACCEPTED = 202,
    NO_CONTENT = 204
}

function SuccessCodeToZod(successCode: SuccessCode) {
    switch (successCode) {
        case SuccessCode.ACCEPTED:
            return z.literal(200)
        case SuccessCode.CREATED:
            return z.literal(201)
        case SuccessCode.OK:
            return z.literal(200)
        case SuccessCode.NO_CONTENT:
            return z.literal(204)
    }
}



const SuccessCodeZod = z.enum([
    "OK",
    "CREATED",
    "ACCEPTED",
    "NO_CONTENT"
])


function CreateSuccessZod(status: SuccessCode, data: z.ZodType) {
    return {
        type: "SuccessZod",
        schema: z.object({
            data,
            status: SuccessCodeToZod(status)
        }),
        headers: z.object({})
    }
}

let x = CreateSuccessZod(SuccessCode.OK, z.object({
    a: z.string()
}))

let schema = x.schema;



interface SuccessResponse<T> {
    status: SuccessCode,
    message?: string,
    data: T
}

export enum ErrorCode {
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    CONFLICT = 409,
    UNPROCESSABLE_ENTITY = 422,
    TOO_MANY_REQUESTS = 429,
    INTERNAL_SERVER_ERROR = 500
}

export enum RedirectCode {
    MOVED_PERMANENTLY = 301,
    FOUND = 302,
    TEMPORARY_REDIRECT = 307
}

export interface ErrorResponse<T> {
    status: ErrorCode;
    message: string;
    data: T
}

// Unified Redirect Response
export interface RedirectResponse {
    status: RedirectCode;
    location: string;
}


type Success<T> = SuccessResponse<T> | RedirectResponse;


function TypedHandler<T, S, E>(handler: (request: T) => Result<S, E>) {
    return (req: Request, res: Response) => {
        const result = handler(req.body)
        if (result.isSuccess()) {

        } else {

        }
    }
}


function TypedRouter() {
    const id = randomUUID();
    let obj = {} as typeof router & {
        __meta__: {
            id: string,
            type: "TYPED_ROUTER",
            routes: typeof routes
        }
    };
    //@ts-expect-error
    obj = () => { }
    const router = Router();
    const proto = Object.getPrototypeOf(Object.getPrototypeOf(router))
    const routes = [] as ({
        type: "ROUTE"
        method: string,
        path: string
    } | {
        type: "ROUTER"
        path: string,
        router: typeof obj;
    }
    )[]

    for (const key of Object.keys(proto)) {
        if (methods.includes(key)) {
            if (methods.includes(key)) {
                obj[key] = (...args) => {
                    routes.push({ method: key, path: args[0] })
                    router[key](...args)
                }
            }
        }
    }
    obj["use"] = (...args) => {
        const path = args[0];
        if (typeof path === "string") {
            const secondArgs = args[1];
            if (secondArgs && typeof secondArgs === "function") {
                if (secondArgs["__meta__"]["type"] === "TYPED_ROUTER") {
                    routes.push({ type: "ROUTER", path: path, router: secondArgs })
                }
            }
        }
    }
    obj["__meta__"] = {
        id: id,
        type: "TYPED_ROUTER",
        routes: routes
    }
    return obj;
}

const app = express();

const ROOT_ROUTER = TypedRouter();


// const ROOT_ROUTER = Router();

ROOT_ROUTER.get("/", () => { })
ROOT_ROUTER.post("/post_route", () => { })

const SUB_ROUTER = TypedRouter();
SUB_ROUTER.get("/abcd", () => { })
SUB_ROUTER.patch("/patch", () => { })

ROOT_ROUTER.use("/hello", SUB_ROUTER)

app.use(ROOT_ROUTER);

console.log((ROOT_ROUTER.__meta__));

function buildRouteGraph(router: ReturnType<typeof TypedRouter>) {
    const graph = {}

}

