import { z } from 'zod'

// function main() {

//     let data = z.object({
//         id: z.string(),
//         isPrimary: z.boolean().optional(),
//         names: z.number().array()
//     })

//     let schemaInner = z.object({
//         id: z.string(),
//         data: data.array()
//     })

//     let E = z.object({
//         e: z.enum({
//             a: 1,
//             b: 2,
//             c: "abcd"
//         })
//     })


//     let schema = z.object({
//         // un: z.union([E, schemaInner, data]),
//         literal: z.literal("hello"),
//         name: z.string().max(100).optional().nullable().default("NAME"),
//         number: z.number().max(10).min(5),
//         data: z.object({
//             height: z.string(),
//             addresses: schemaInner.array(),
//             enumWrapper: z.object({
//                 id: z.string(),
//                 value: E.optional()
//             })
//         }).optional().default({
//             height: "1",
//             addresses: [],
//             enumWrapper: {
//                 id: "z",
//             }
//         }),
//         record_example: z.record(z.string(), data.optional()),
//         everything: z.any().optional()
//     })

//     console.log(JSON.stringify(ZodRepr(schema)))
// }


type StringRepr = "string"

function StringRepr(): StringRepr {
    return "string"
}

type NumberRepr = "number"
function NumberRepr(): NumberRepr {
    return "number"
}
type ArrayRepr = {
    repr: "array"
    element_type: Repr
}
function ArrayRepr(element_type: Repr): ArrayRepr {
    return { repr: "array", element_type }
}
type BoolRepr = "boolean"
function BoolRepr(): BoolRepr {
    return "boolean"
}
type ObjectRepr = {
    repr: "object",
    properties: Record<string, Repr>
}
function ObjectRepr(properties: Record<string, Repr>): ObjectRepr {
    return { repr: "object", properties }
}
type NullableRepr = {
    repr: "nullable",
    element_type: Repr
}
function NullableRepr(element_type: Repr): NullableRepr {
    return { repr: "nullable", element_type }
}
type OptionalRepr = {
    repr: "optional",
    element_type: Repr
}
function OptionalRepr(element_type: Repr): OptionalRepr {
    return { repr: "optional", element_type }
}
type EnumRepr = {
    repr: "enum",
    values: boolean[] | number[] | string[]
}
function EnumRepr(values: boolean[] | number[] | string[]): EnumRepr {
    return { repr: "enum", values }
}
type DefaultRepr = {
    repr: "default",
    element_type: Repr
    value: unknown
}
function DefaultRepr(element_type: Repr, value: unknown): DefaultRepr {
    return { repr: "default", element_type, value }
}
type RecordRepr = {
    repr: "record"
    key_type: "string",
    value_type: Repr
}
function RecordRepr(value_type: Repr): RecordRepr {
    return { repr: "record", key_type: "string", value_type }
}

type AnyRepr = "any"
function AnyRepr(): AnyRepr {
    return "any"
}

type UnknownRepr = "unknown"
function UnknownRepr(): UnknownRepr {
    return "unknown"
}
type NumberLiteralRepr = number[]
function NumberLiteralRepr(values: number[]): NumberLiteralRepr {
    return values
}
type StringLiteralRepr = string[]
function StringLiteralRepr(values: string[]): StringLiteralRepr {
    return values
}
type BoolLiteralRepr = boolean[]
function BoolLiteralRepr(values: boolean[]): BoolLiteralRepr {
    return values
}
type NullRepr = "null"
function NullRepr(): NullRepr {
    return "null"
}
type UnionRepr = {
    repr: "union",
    options: Repr[]
}
function UnionRepr(options: Repr[]): UnionRepr {
    return { repr: "union", options }
}

type Repr = StringRepr | NumberRepr | ArrayRepr | BoolRepr | ObjectRepr | NullableRepr | OptionalRepr | EnumRepr | DefaultRepr | AnyRepr | UnknownRepr | RecordRepr | NumberLiteralRepr | StringLiteralRepr | BoolLiteralRepr | NullRepr | UnionRepr

export function ZodRepr(schema: z.ZodType): Repr {
    const type = schema.def.type;
    if (type === "object") {
        let repr: ObjectRepr = ObjectRepr({});
        const shape = schema.def.shape;
        for (const [key, value] of Object.entries(shape) as [string, z.ZodType][]) {
            repr.properties[key] = ZodRepr(value);
        }
        return repr;
    } else if (type === "array") {
        return ArrayRepr(ZodRepr(schema.def.element))
    } else if (type === "string") {
        return StringRepr()
    } else if (type === "literal") {
        let values = schema.def.values
        if (values.length === 0) {
            throw new Error("Literal schema must have at least one value")
        }
        if (typeof values[0] === "string") {
            return StringLiteralRepr(values as string[])
        } else if (typeof values[0] === "number") {
            return NumberLiteralRepr(values as number[])
        } else if (typeof values[0] === "boolean") {
            return BoolLiteralRepr(values as boolean[])
        } else {
            throw new Error("Unsupported literal type")
        }
    } else if (type === "default") {
        const innerType = schema.def.innerType;
        const defaultValue = schema.def.defaultValue;
        return DefaultRepr(ZodRepr(innerType), defaultValue)
    } else if (type === "unknown") {
        return UnknownRepr()
    } else if (type === "any") {
        return AnyRepr()
    } else if (type === "enum") {
        const values = Object.values(schema.def.entries);
        return EnumRepr(values as boolean[] | number[] | string[])
    } else if (type === "record") {
        const keyType = schema.def.keyType as z.ZodType;
        if (keyType.def.type !== "string") {
            throw new Error("Record key type must be a string")
        }
        const valueType = schema.def.valueType as z.ZodType;
        return RecordRepr(ZodRepr(valueType))
    } else if (type === "null") {
        return NullRepr()
    } else if (type === "union") {
        return UnionRepr(schema.def.options.map(ZodRepr))
    } else if (type === "nullable") {
        const innerType = schema.def.innerType;
        return NullableRepr(ZodRepr(innerType))
    } else if (type === "optional") {
        return OptionalRepr(ZodRepr(schema.def.innerType))
    } else if (type === "number") {
        return NumberRepr()
    } else if (type === "boolean") {
        return BoolRepr()
    }
    else {
        throw new Error(`Unsupported schema type: ${type}`)
    }
}

// function ZodTraversal(
//     schema: z.ZodType,
//     name: string,
//     tabs: number,
//     isOptional: boolean,
//     isNullable: boolean
// ) {


//     if (schema.def.type === "nullable") {
//         const innerType = schema.def.innerType
//         ZodTraversal(innerType, name, tabs, isOptional, true)
//     }
//     else if (schema.def.type === "optional") {
//         const innerType = schema.def.innerType;
//         ZodTraversal(innerType, name, tabs, true, isNullable)
//     }
//     else if (schema.def.type === "object") {
//         print(tabs, name, ":object", isOptional, isNullable)

//         const shape = schema.def.shape;
//         for (const [key, value] of Object.entries(shape)) {
//             ZodTraversal(value, key, tabs + 1, false, false)
//         }
//     }
//     else if (schema.def.type === "record") {
//         print(tabs, name, ":record", isOptional, isNullable)
//         const keyType = schema.def.keyType;
//         ZodTraversal(keyType, `key`, tabs, false, false)
//         const valueType = schema.def.valueType;
//         ZodTraversal(valueType, `value`, tabs, false, false)
//     }
//     else if (schema.def.type === "array") {
//         const element = schema.def.element;
//         print(tabs, name, ":array", isOptional, isNullable)
//         ZodTraversal(element, `-`, tabs, false, false)
//     }
//     else if (schema.def.type === "string") {
//         print(tabs, name, ":string", isOptional, isNullable)
//     }
//     else if (schema.def.type === "number") {
//         print(tabs, name, ":number", isOptional, isNullable)
//     }
//     else if (schema.def.type === "boolean") {
//         print(tabs, name, ":boolean", isOptional, isNullable)
//     }
//     else if (schema.def.type === "enum") {
//         print(tabs, name, ":enum", isOptional, isNullable)
//         let entries = Object.values(schema.def.entries)
//         for (const entry of entries) {
//             print(tabs, `- ${entry} ${typeof entry}`)
//         }
//     }
//     else if (schema.def.type === "date") {
//         throw new Error("Date is not supported, use string")
//     } else if (schema.def.type === "any") {
//         print(tabs, name, ":any", isOptional, isNullable)
//     } else if (schema.def.type === "null") {
//         print(tabs, name, ":null", isOptional, isNullable)
//     } else if (schema.def.type === "union") {
//         print(tabs, name, ":union", isOptional, isNullable)
//         const options = schema.def.options
//         for (const option of options) {
//             ZodTraversal(option, `-`, tabs, false, false)
//         }
//     } else if (schema.def.type === "literal") {
//         print(tabs, name, ":literal", isOptional, isNullable)
//         for (const value of schema.def.values) {
//             print(tabs, `- ${value} ${typeof value}`)
//         }
//     } else if (schema.def.type === "default") {
//         // print("DEFAULT")
//         const innerType = schema.def.innerType
//         ZodTraversal(innerType, name, tabs, isOptional, isNullable)
//         print(tabs, "DEFAULT", schema.def.defaultValue)
//     } else if (schema.def.type === "unknown") {
//         print(tabs, name, ":unknown", isOptional, isNullable)
//     }
// }


// function print(tabs: number, ...args: any[]) {

//     console.log(tabber(tabs), ...args)
// }

// function tabber(tabs: number) {
//     let str = "";
//     for (let i = 0; i < tabs; i++) {
//         str += "    "
//     }
//     return str;
// }

