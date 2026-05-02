import { z } from 'zod'

type BaseRepr = {
    description?: string
}

type StringRepr = {
    repr: "string"
} & BaseRepr

type NumberRepr = {
    repr: "number"
} & BaseRepr

type ArrayRepr = {
    repr: "array"
    element_type: Repr
} & BaseRepr

type BoolRepr = {
    repr: "boolean"
} & BaseRepr

type ObjectRepr = {
    repr: "object"
    properties: Record<string, Repr>
} & BaseRepr

type NullableRepr = {
    repr: "nullable"
    element_type: Repr
} & BaseRepr

type OptionalRepr = {
    repr: "optional"
    element_type: Repr
} & BaseRepr

type EnumRepr = {
    repr: "enum"
    values: boolean[] | number[] | string[]
} & BaseRepr

type DefaultRepr = {
    repr: "default"
    element_type: Repr
    value: unknown
} & BaseRepr

type RecordRepr = {
    repr: "record"
    key_type: "string"
    value_type: Repr
} & BaseRepr

type AnyRepr = {
    repr: "any"
} & BaseRepr

type UnknownRepr = {
    repr: "unknown"
} & BaseRepr

type LiteralRepr = {
    repr: "literal"
    values: boolean[] | number[] | string[]
} & BaseRepr

type NullRepr = {
    repr: "null"
} & BaseRepr

type UnionRepr = {
    repr: "union"
    options: Repr[]
} & BaseRepr

export type Repr =
    | StringRepr
    | NumberRepr
    | ArrayRepr
    | BoolRepr
    | ObjectRepr
    | NullableRepr
    | OptionalRepr
    | EnumRepr
    | DefaultRepr
    | AnyRepr
    | UnknownRepr
    | RecordRepr
    | LiteralRepr
    | NullRepr
    | UnionRepr

function StringRepr(description?: string): StringRepr {
    return {
        repr: "string",
        description
    }
}

function NumberRepr(description?: string): NumberRepr {
    return {
        repr: "number",
        description
    }
}

function ArrayRepr(element_type: Repr, description?: string): ArrayRepr {
    return { repr: "array", element_type, description }
}

function BoolRepr(description?: string): BoolRepr {
    return { repr: "boolean", description }
}

function ObjectRepr(properties: Record<string, Repr>, description?: string): ObjectRepr {
    return { repr: "object", properties, description }
}

function NullableRepr(element_type: Repr, description?: string): NullableRepr {
    return { repr: "nullable", element_type, description }
}

function OptionalRepr(element_type: Repr, description?: string): OptionalRepr {
    return { repr: "optional", element_type, description }
}

function EnumRepr(values: boolean[] | number[] | string[], description?: string): EnumRepr {
    return { repr: "enum", values, description }
}

function DefaultRepr(element_type: Repr, value: unknown, description?: string): DefaultRepr {
    return { repr: "default", element_type, value, description }
}

function RecordRepr(value_type: Repr, description?: string): RecordRepr {
    return { repr: "record", key_type: "string", value_type, description }
}

function AnyRepr(description?: string): AnyRepr {
    return { repr: "any", description }
}

function UnknownRepr(description?: string): UnknownRepr {
    return { repr: "unknown", description }
}

function LiteralRepr(values: boolean[] | number[] | string[], description?: string): LiteralRepr {
    return { repr: "literal", values, description }
}

function NullRepr(description?: string): NullRepr {
    return { repr: "null", description }
}

function UnionRepr(options: Repr[], description?: string): UnionRepr {
    return { repr: "union", options, description }
}

export function ZodRepr(schema: z.ZodType): Repr {
    const type = schema.def.type;
    const description = schema.description;
    if (type === "object") {
        let repr: ObjectRepr = ObjectRepr({}, description);
        const shape = (schema as z.ZodObject<any>).def.shape;
        for (const [key, value] of Object.entries(shape) as [string, z.ZodType][]) {
            repr.properties[key] = ZodRepr(value);
        }
        return repr;
    } else if (type === "array") {
        return ArrayRepr(ZodRepr((schema as z.ZodArray<any>).def.element), description)
    } else if (type === "string") {
        return StringRepr(description)
    } else if (type === "literal") {
        let values = (schema as z.ZodLiteral<any>).def.values
        if (values.length === 0) {
            throw new Error("Literal schema must have at least one value")
        }
        if (typeof values[0] === "string") {
            return LiteralRepr(values as string[], description)
        } else if (typeof values[0] === "number") {
            return LiteralRepr(values as number[], description)
        } else if (typeof values[0] === "boolean") {
            return LiteralRepr(values as boolean[], description)
        } else {
            throw new Error("Unsupported literal type")
        }
    } else if (type === "default") {
        const innerType = (schema as z.ZodDefault<any>).def.innerType;
        const defaultValue = (schema as z.ZodDefault<any>).def.defaultValue;
        return DefaultRepr(ZodRepr(innerType), defaultValue, description)
    } else if (type === "unknown") {
        return UnknownRepr(description)
    } else if (type === "any") {
        return AnyRepr(description)
    } else if (type === "enum") {
        const values = Object.values((schema as z.ZodEnum<any>).def.entries);
        return EnumRepr(values as boolean[] | number[] | string[], description)
    } else if (type === "record") {
        const keyType = (schema as z.ZodRecord<any>).def.keyType as z.ZodType;
        if (keyType.def.type !== "string") {
            throw new Error("Record key type must be a string")
        }
        const valueType = (schema as z.ZodRecord<any>).def.valueType as z.ZodType;
        return RecordRepr(ZodRepr(valueType), description)
    } else if (type === "null") {
        return NullRepr(description)
    } else if (type === "union") {
        return UnionRepr((schema as z.ZodUnion<any>).def.options.map(ZodRepr), description)
    } else if (type === "nullable") {
        const innerType = (schema as z.ZodNullable<any>).def.innerType;
        return NullableRepr(ZodRepr(innerType), description)
    } else if (type === "optional") {
        return OptionalRepr(ZodRepr((schema as z.ZodOptional<any>).def.innerType), description)
    } else if (type === "number") {
        return NumberRepr(description)
    } else if (type === "boolean") {
        return BoolRepr(description)
    }
    else {
        throw new Error(`Unsupported schema type: ${type}`)
    }
}