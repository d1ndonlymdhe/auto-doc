type X = {
    id: string
    createdAt: string
    profile: {
        name: {
            first: string
            middle: string | undefined
            last: string
        }
        age: number
        contact: {
            email: string
            phone: string | null
        }
        status: "active" | "inactive" | "pending"
        role: "admin" | "user" | "guest"
        preferences: {
            theme: "light" | "dark"
            /*Default Value : "light"*/
            notifications: {
                email: boolean
                sms: boolean | undefined
                push: boolean | null
            }
            record: Record<string, {
                theme: "light" | "dark"
                /*Default Value : "light"*/
                notifications: {
                    email: boolean
                    sms: boolean | undefined
                    push: boolean | null
                }
            }>
        }
    }
    metadata: {
        version: 1
        tags: string[] | undefined
        notes: string | null
        audit: {
            createdBy: string
            updatedBy: string | null
            flags: {
                type: "warning" | "error" | "info"
                message: string
                code: "W001" | "E001" | number
            }[] | undefined
        }
    }
    settings: {
        privacy: {
            visibility: "public" | "private" | "friends"
            searchable: boolean | undefined
        }
        /*Default Value : {
"visibility": "private",
"searchable": false
}*/
        features: {
            beta: boolean
            experiments: {
                key: string
                enabled: boolean
                rollout: number | null
            }[] | undefined
        } | null
    }
    extra: {
        type: "A"
        value: string
    } | {
        type: "B"
        value: number
    } | {
        type: "C"
        value: {
            nested: string | null | undefined
        }
    } | undefined | null
}