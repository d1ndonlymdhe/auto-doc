import { z } from 'zod'

function main() {

    let data = z.object({
        id: z.string(),
        isPrimary: z.boolean().optional(),
        names: z.number().array()
    })

    let schemaInner = z.object({
        id: z.string(),
        data: data.array()
    })

    let schema = z.object({
        name: z.string().optional(),
        data: z.object({
            height: z.string(),
            addresses: schemaInner.array()
        }),
        record: z.record(z.number(), data)
    })
    ZodTraversal(schema, "root", 0, false)
}


function ZodTraversal(
    schema: z.ZodType,
    name: string,
    tabs: number,
    isOptional: boolean
) {
    if (schema.def.type === "optional") {
        const innerType = schema.def.innerType;
        ZodTraversal(innerType, name, tabs, true)
    }
    if (schema.def.type === "object") {
        print(tabs, name, ":object", isOptional)
        const shape = schema.def.shape;
        for (const [key, value] of Object.entries(shape)) {
            ZodTraversal(value, key, tabs + 1, false)
        }
    }
    if (schema.def.type === "record") {
        print(tabs,name,":record",isOptional)
        const keyType = schema.def.keyType;
        ZodTraversal(keyType, `${name} key`, tabs, false)
        const valueType = schema.def.valueType;
        ZodTraversal(valueType, `${name} value`, tabs, false)
    }
    if (schema.def.type === "array") {
        const element = schema.def.element;
        print(tabs, name, ":array", isOptional)
        ZodTraversal(element, `-`, tabs, false)
    }
    if (schema.def.type === "string") {
        print(tabs, name, ":string", isOptional)
    }
    if (schema.def.type === "number") {
        print(tabs, name, ":number", isOptional)
    }
    if (schema.def.type === "boolean") {
        print(tabs, name, ":boolean", isOptional)
    }
}


function print(tabs: number, ...args: any[]) {

    console.log(tabber(tabs), ...args)
}

function tabber(tabs: number) {
    let str = "";
    for (let i = 0; i < tabs; i++) {
        str += "    "
    }
    return str;
}

main();