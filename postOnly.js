import { Router } from "express";
import z from "zod"
import express from "express"
import { ZodRepr } from "./reflection";

function TypedRouter() {

    let obj = {}
    //@ts-expect-error
    obj = () => { }
    const router = Router();
    router.post
    const proto = Object.getPrototypeOf(Object.getPrototypeOf(router))
    const routes = []

    for (const key of Object.keys(proto)) {
        // if (methods.includes(key)) {
        //     if (methods.includes(key)) {
        //         obj[key] = (inSchema:z.ZodType, outSchema:z.ZodType,...args) => {
        //             routes.push({ method: key, path: args[0] })
        //             router[key](...args)
        //         }
        //     }
        // }

        obj["post"] = (inSchema, outSchema, ...args) => {
            routes.push({
                type: "ROUTE",
                method: "POST",
                path: args[0],
                inSchema: ZodRepr(inSchema),
                outSchema: ZodRepr(outSchema)
            })
            if (args.length >= 2) {
                // Last argument should be the handler function
                let handler = args[args.length - 1];
                args.pop();
                router.post(...args, (req, res) => {
                    res.send(JSON.stringify(handler(req.body)))
                })

            } else {
                console.error("Atleast 4 arguments required");
                console.error("Usage: router.post(inSchema, outSchema, ...middlewares, path, handler)")
                throw Error("Not enough arguments for route definition")
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
        type: "TYPED_ROUTER",
        routes: routes,
        innerRouter: router,
        route_prefix: ""
    }
    return obj;
}


function flattenRoutes(route, prefix) {
    if (route.type === "ROUTE") {
        return [{
            method: route.method,
            path: prefix + route.path,
            inSchema: route.inSchema,
            outSchema: route.outSchema,
        }]
    }
    if (route.type === "ROUTER") {
        return route.router.__meta__.routes.flatMap((r) => flattenRoutes(r, prefix + route.path))
    }
}


const ROOT_ROUTER = TypedRouter();
const SUB_ROUTER = TypedRouter();




const inSchema = z.object({
    name: z.string()
})

const outSchema = z.string()

ROOT_ROUTER.post(inSchema, outSchema, "/", (req) => {
    console.log(req)

    return "Hello world";
})

ROOT_ROUTER.use("/sub", SUB_ROUTER)

SUB_ROUTER.post(z.any(), z.any(), "/route_a", (req) => {
    return "ROUTE_A"
})
SUB_ROUTER.post(z.any(), z.any(), "/route_b", (req) => {
    return "ROUTE_B"
})


const SUB_SUB_ROUTER = TypedRouter();
SUB_SUB_ROUTER.post(z.string(), z.any(), "/hello", (req) => {
    return "HELLO"
})

SUB_ROUTER.use("/abcd/efgh", SUB_SUB_ROUTER)

const app = express();

app.use("/", ROOT_ROUTER.__meta__.innerRouter)



app.listen(3000, "0.0.0.0")
// console.log(ROOT_ROUTER.__meta__.routes)
console.log(ROOT_ROUTER.__meta__.routes.map((r) => {
    return flattenRoutes(r, "")
}).flat())