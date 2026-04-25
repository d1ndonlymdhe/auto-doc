import { Router, type NextFunction, type Response, type Request } from "express";
import { ZodRepr } from "../reflection";
import type { ReprResponse } from "./ResponseTypes";
const methods = [
    "get",
    "delete",
    "patch",
    "post",
    "put",
] as const
import z from "zod"


type TypedRouter = (Omit<ReturnType<typeof Router>, typeof methods[number]> & {
    __meta__: {
        type: "TYPED_ROUTER",
        routes: TypedRoute[],
        innerRouter: ReturnType<typeof Router>,
    }
}) & {
    [K in typeof methods[number]]: TypedMethod
} & {
    router: () => ReturnType<typeof Router>
}

type TypedRoute = {
    type: "ROUTE",
    method: string,
    path: string,
    inSchema: any,
    outSchema: ReprResponse
} | {
    type: "ROUTER",
    path: string,
    router: TypedRouter
}

type Middleware = (req: Request, res: Response, next: NextFunction) => Promise<void>
type TypedMethod = (inSchema: z.ZodType, responseType: ReprResponse, path: string, middlewares: Middleware[], handler: (req: any) => Promise<any>) => void



export function TypedRouter() {
    const router = Router();

    // @ts-ignore
    let obj = (() => { }) as TypedRouter

    const proto = Object.getPrototypeOf(Object.getPrototypeOf(router))
    const routes = [] as TypedRoute[]

    for (const key of Object.keys(proto)) {
        //@ts-ignore
        if (methods.includes(key)) {
            obj[(key) as typeof methods[number]] = (inSchema: z.ZodType, responseType: ReprResponse, path: string, middlewares: Middleware[], handler: (req: any) => Promise<any>) => {
                routes.push({
                    type: "ROUTE",
                    method: key,
                    path: path,
                    inSchema: ZodRepr(inSchema),
                    outSchema: responseType
                })
                //@ts-ignore
                router[key](path, ...middlewares, async (req, res) => {
                    res.send(JSON.stringify(handler(req.body)))
                })
            }
        }
    }


    //@ts-ignore
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
        router.use(...args)
    }

    obj["__meta__"] = {
        type: "TYPED_ROUTER",
        routes: routes,
        innerRouter: router,
    }

    obj["router"] = () => router

    return obj;
}

export function flattenRoutes(route: TypedRoute, prefix: string): {
    method: string,
    path: string,
    inSchema: any,
    outSchema: ReprResponse
}[] {
    if (route.type === "ROUTE") {
        return [route]
    } else {
        return route.router.__meta__.routes.flatMap((r) => flattenRoutes(r, prefix + route.path))
    }
}