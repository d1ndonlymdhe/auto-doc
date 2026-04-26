import type { Request, Response } from "express";
import z from "zod";
import { TypedRouter } from "../lib/TypedRouter";
import { DataResponse } from "../lib/ResponseTypes";
import { Query, TypedRequest } from "../lib/RequestTypes";
import { authHeader } from "../lib/RequestHeaders";


const adminRouter = TypedRouter();

adminRouter.get(
    TypedRequest(undefined, [], [Query("limit")], authHeader()),
    DataResponse(z.object({ logs: z.array(z.object({ id: z.string(), message: z.string() })) })),
    "/logs",
    async (_req: Request, res: Response) => {
        res.json({ logs: [{ id: "log_1", message: "example" }] });
    }
);

export default adminRouter;

