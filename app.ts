import express from "express"
import { flattenRoutes, TypedRouter } from "./lib/TypedRouter";
import z from "zod";
import { DataResponse, RepredResponse } from "./lib/ResponseTypes";


const app = express();
const rootRouter = TypedRouter()

rootRouter.get(z.any(), RepredResponse(DataResponse(z.object({ message: z.string() }))), "/", [], async () => {
    return { message: "Hello, World!" }
})
rootRouter.get(z.any(), RepredResponse(DataResponse(z.object({ message: z.string() }))), "/test", [], async () => {
    return { message: "Test endpoint!" }
})

app.use("/", rootRouter.router())
app.get("/routes", (req, res) => {
    let routes = rootRouter.__meta__.routes.map((route) => flattenRoutes(route, "")).flat()
    res.json(routes)
})


app.listen(3000)