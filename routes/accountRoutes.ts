import type { Request, Response } from "express";
import z from "zod";
import { TypedRouter } from "../lib/TypedRouter";
import { DataResponse, DynamicRedirectResponse } from "../lib/ResponseTypes";
import { Header, Param, Query, TypedRequest } from "../lib/RequestTypes";
import adminRouter from "./adminRoutes";

const accountRouter = TypedRouter();

const accountGetResponseVariants = {
    standard: DataResponse(z.object({
        id: z.string().describe("Account id"),
        name: z.string().describe("Display name"),
        status: z.enum(["active", "suspended"]).describe("Lifecycle status")
    }).describe("Standard account details"), [], "Found account"),
    suspended: DataResponse(z.object({
        id: z.string().describe("Account id"),
        name: z.string().describe("Display name"),
        status: z.literal("suspended").describe("Suspended status"),
        suspensionReason: z.string().describe("Administrative reason")
    }).describe("Suspended account details"), [], "Account is suspended")
} as const;

const accountCreateRequestVariants = {
    emailSignup: TypedRequest(
        z.object({
            name: z.string().min(2).describe("Full name"),
            email: z.email().describe("Primary email")
        }).describe("Create account using email"),
        [],
        [],
        [Header("x-request-id", "Request id for idempotency")]
    ),
    phoneSignup: TypedRequest(
        z.object({
            name: z.string().min(2).describe("Full name"),
            phone: z.string().describe("E.164 phone number")
        }).describe("Create account using phone"),
        [],
        [],
        [Header("x-request-id", "Request id for idempotency")]
    )
} as const;

const accountCreateResponseVariants = {
    createdImmediately: DataResponse(
        z.object({
            id: z.string().describe("Created account id"),
            created: z.boolean().describe("Creation status")
        }).describe("Account created response"),
        [],
        "Created immediately"
    ),
    pendingVerification: DataResponse(
        z.object({
            id: z.string().describe("Pending account id"),
            requiresVerification: z.boolean().describe("Further verification required")
        }).describe("Pending verification response"),
        [],
        "Created but pending verification"
    )
} as const;

accountRouter.get(
    TypedRequest(
        undefined,
        [Param("accountId", "Account identifier")],
        [Query("include", "Optional related data")]
    ),
    [accountGetResponseVariants.standard, accountGetResponseVariants.suspended],
    "/:accountId",
    async (req: Request, res: Response) => {
        res.json({ id: req.params.accountId, name: "Demo Account", status: "active" });
    }
);

accountRouter.post(
    [accountCreateRequestVariants.emailSignup, accountCreateRequestVariants.phoneSignup],
    [accountCreateResponseVariants.createdImmediately, accountCreateResponseVariants.pendingVerification],
    "/",
    async (_req: Request, res: Response) => {
        res.status(201).json({ id: "acc_123", created: true });
    }
);

accountRouter.put(
    TypedRequest(
        z.object({
            name: z.string().optional(),
            status: z.enum(["active", "suspended"]).optional()
        }),
        [Param("accountId")]
    ),
    DataResponse(z.object({ updated: z.boolean() })),
    "/:accountId",
    async (_req: Request, res: Response) => {
        res.json({ updated: true });
    }
);

accountRouter.patch(
    TypedRequest(
        z.object({ tags: z.array(z.string()) }),
        [Param("accountId")]
    ),
    DataResponse(z.object({ patched: z.boolean(), tags: z.array(z.string()) })),
    "/:accountId/tags",
    async (req: Request, res: Response) => {
        res.json({ patched: true, tags: req.body.tags || [] });
    }
);

accountRouter.delete(
    TypedRequest(undefined, [Param("accountId")]),
    DynamicRedirectResponse(["x-request-id"], "Client can redirect to list endpoint after deletion"),
    "/:accountId",
    async (_req: Request, res: Response) => {
        res.redirect(303, "/v1/accounts");
    }
);

accountRouter.subRoute("/admin", adminRouter);

export default accountRouter;
