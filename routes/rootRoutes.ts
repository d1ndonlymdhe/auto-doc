import type { Request, Response } from "express";
import z from "zod";
import { TypedRouter } from "../lib/TypedRouter";
import { DataResponse, StaticRedirectResponse } from "../lib/ResponseTypes";
import { Header, Query, TypedRequest } from "../lib/RequestTypes";
import { traceHeader } from "../lib/RequestHeaders";
import accountRouter from "./accountRoutes";


const rootRouter = TypedRouter();

const healthRequestVariants = {
    standard: TypedRequest(
        undefined,
        [],
        [Query("search", "Optional search term")],
        traceHeader()
    ),
    debug: TypedRequest(
        undefined,
        [],
        [],
        traceHeader(Header("x-debug-mode", "Return extra diagnostics"))
    )
} as const;

const healthResponseVariants = {
    healthy: DataResponse(z.object({
        items: z.array(z.object({
            id: z.string().describe("Resource id"),
            name: z.string().describe("Resource state")
        }))
    }).describe("Service health response"), [], "Healthy response"),
    redirected: StaticRedirectResponse("/status", [], "Service temporarily redirects to status page")
} as const;

rootRouter.get(
    TypedRequest(z.object({ name: z.string() })),
    StaticRedirectResponse("/v1/accounts"),
    "/",
    async (_req: Request, res: Response) => {
        res.redirect("/v1/accounts");
    }
);

rootRouter.get(
    [healthRequestVariants.standard, healthRequestVariants.debug],
    [healthResponseVariants.healthy, healthResponseVariants.redirected],
    "/health",
    async (_req: Request, res: Response) => {
        res.json({ items: [{ id: "service", name: "ok" }] });
    }
);

rootRouter.subRoute("/v1/accounts", accountRouter);

export default rootRouter;

