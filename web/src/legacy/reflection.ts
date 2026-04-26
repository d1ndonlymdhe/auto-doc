
export type StringRepr = "string"

export function StringRepr(): StringRepr {
    return "string"
}

export type NumberRepr = "number"
export function NumberRepr(): NumberRepr {
    return "number"
}
export type ArrayRepr = {
    repr: "array"
    element_type: Repr
}
export function ArrayRepr(element_type: Repr): ArrayRepr {
    return { repr: "array", element_type }
}
export type BoolRepr = "boolean"
export function BoolRepr(): BoolRepr {
    return "boolean"
}
export type ObjectRepr = {
    repr: "object",
    properties: Record<string, Repr>
}
export function ObjectRepr(properties: Record<string, Repr>): ObjectRepr {
    return { repr: "object", properties }
}
export type NullableRepr = {
    repr: "nullable",
    element_type: Repr
}
export function NullableRepr(element_type: Repr): NullableRepr {
    return { repr: "nullable", element_type }
}
export type OptionalRepr = {
    repr: "optional",
    element_type: Repr
}
export function OptionalRepr(element_type: Repr): OptionalRepr {
    return { repr: "optional", element_type }
}
export type EnumRepr = {
    repr: "enum",
    values: boolean[] | number[] | string[]
}
export function EnumRepr(values: boolean[] | number[] | string[]): EnumRepr {
    return { repr: "enum", values }
}
export type DefaultRepr = {
    repr: "default",
    element_type: Repr
    value: unknown
}
export function DefaultRepr(element_type: Repr, value: unknown): DefaultRepr {
    return { repr: "default", element_type, value }
}
export type RecordRepr = {
    repr: "record"
    key_type: "string",
    value_type: Repr
}
export function RecordRepr(value_type: Repr): RecordRepr {
    return { repr: "record", key_type: "string", value_type }
}

export type AnyRepr = "any"
export function AnyRepr(): AnyRepr {
    return "any"
}

export type UnknownRepr = "unknown"
export function UnknownRepr(): UnknownRepr {
    return "unknown"
}
export type NumberLiteralRepr = number[]
export function NumberLiteralRepr(values: number[]): NumberLiteralRepr {
    return values
}
export type StringLiteralRepr = string[]
export function StringLiteralRepr(values: string[]): StringLiteralRepr {
    return values
}
export type BoolLiteralRepr = boolean[]
export function BoolLiteralRepr(values: boolean[]): BoolLiteralRepr {
    return values
}
export type NullRepr = "null"
export function NullRepr(): NullRepr {
    return "null"
}
export type UnionRepr = {
    repr: "union",
    options: Repr[]
}
export function UnionRepr(options: Repr[]): UnionRepr {
    return { repr: "union", options }
}

export type Repr = StringRepr | NumberRepr | ArrayRepr | BoolRepr | ObjectRepr | NullableRepr | OptionalRepr | EnumRepr | DefaultRepr | AnyRepr | UnknownRepr | RecordRepr | NumberLiteralRepr | StringLiteralRepr | BoolLiteralRepr | NullRepr | UnionRepr
