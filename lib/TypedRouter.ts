import { Router, type NextFunction, type Response, type Request } from "express";
import type { ReprResponse } from "./ResponseTypes";
const methods = [
    "get",
    "delete",
    "patch",
    "post",
    "put",
] as const
import type { ReprRequest } from "./RequestTypes";


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
    subRoute: (path: string, router: TypedRouter) => void
}

type TypedRoute = {
    type: "ROUTE",
    method: string,
    path: string,
    inSchema: ReprRequest[],
    outSchema: ReprResponse[]
} | {
    type: "ROUTER",
    path: string,
    router: TypedRouter
}

type Middleware = (req: Request, res: Response, next?: NextFunction) => Promise<void>
type TypedMethod = (requestType: ReprRequest | ReprRequest[], responseType: ReprResponse | ReprResponse[], path: string, ...routerArgs: Middleware[]) => void



export function TypedRouter() {
    const router = Router();

    // @ts-ignore
    let obj = (() => { }) as TypedRouter
    const proto = Object.getPrototypeOf(Object.getPrototypeOf(router))
    const routes = [] as TypedRoute[]
    for (const key of Object.keys(proto)) {
        //@ts-ignore
        if (methods.includes(key)) {
            obj[(key) as typeof methods[number]] = (requestType: ReprRequest | ReprRequest[], responseType: ReprResponse | ReprResponse[], path: string, ...routerArgs: Middleware[]) => {
                routes.push({
                    type: "ROUTE",
                    method: key,
                    path: path,
                    inSchema: Array.isArray(requestType) ? requestType : [requestType],
                    outSchema: Array.isArray(responseType) ? responseType : [responseType]
                })
                //@ts-ignore
                router[key](path, ...routerArgs)
            }
        } else {
            //@ts-ignore
            obj[key] = (...args: any[]) => {
                //@ts-ignore
                router[key](...args)
            }
        }
    }


    obj["subRoute"] = (path: string, childRouter: TypedRouter) => {
        routes.push({ type: "ROUTER", path: path, router: childRouter })
        router.use(path, childRouter.router())
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
    inSchema: ReprRequest[],
    outSchema: ReprResponse[]
}[] {
    if (route.type === "ROUTE") {
        let { type, ...routeData } = route
        routeData.path = `${prefix}${routeData.path}`
        return [routeData]
    } else {
        return route.router.__meta__.routes.flatMap((r) => flattenRoutes(r, prefix + route.path))
    }
}