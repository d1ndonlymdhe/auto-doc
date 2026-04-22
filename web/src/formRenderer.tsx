import { useState, type ReactElement } from "react"
import type { AnyRepr, ArrayRepr, BoolLiteralRepr, BoolRepr, DefaultRepr, EnumRepr, NullRepr, NullableRepr, NumberLiteralRepr, NumberRepr, ObjectRepr, OptionalRepr, RecordRepr, Repr, StringLiteralRepr, StringRepr, UnionRepr, UnknownRepr } from "./reflection"


export function StringField(
    { name, value, setValue }: {
        name: string,
        value: string,
        setValue: (value: string) => void,
    }
) {
    return <div>
        <span>{name} (string)</span>
        <input value={value} type="text" onChange={(e) => setValue(e.target.value)} />
    </div>
}

export function NumberField(
    { name, value, setValue }: {
        name: string,
        value: number,
        setValue: (value: number) => void,
    }
) {
    return <div>
        <span>{name} (number)</span>
        <input value={value} type="number" onChange={(e) => setValue(Number(e.target.value))} />
    </div>
}

export function BooleanField({ name, value, setValue }: {
    name: string,
    value: boolean,
    setValue: (value: boolean) => void,
}) {
    return <div>
        <span>{name} (boolean)</span>
        <input type="checkbox" checked={value} onChange={(e) => setValue(e.target.checked)} />
    </div>
}

export function ArrayField({ name, value, setValue, repr }: {
    name: string,
    value: unknown[],
    setValue: (value: unknown[]) => void,
    repr: ArrayRepr
}) {
    const [adding, setAdding] = useState(false)


    return <div>
        <p>
            {name}
        </p>
        <div>

        </div>
    </div>
}


const x = [
    <div>Hello</div>,
    <p>What up!</p>
]

export function ObjectField({ name, value, setValue, repr }: {
    name: string,
    value: Record<string, unknown>,
    setValue: (value: Record<string, unknown>) => void,
    repr: ObjectRepr
}) {

    const itemsToRender = (Object.entries(repr.properties) as [string, Repr][]).map(([key, subValue]) => {
        if (typeof subValue === "string") {
            if (subValue === "string") {
                // itemsToRender.push(StringField({ name: key, value: value[key] as string, setValue: (v) => setValue({ ...value, [key]: v }) }))
                return <StringField name={key} value={value[key] as string || ""} setValue={(v) => setValue({ ...value, [key]: v })} />
            } else if (subValue === "number") {
                return <NumberField name={key} value={value[key] as number || 0} setValue={(v) => setValue({ ...value, [key]: v })} />
            } else if (subValue === "boolean") {
                return <BooleanField name={key} value={value[key] as boolean || false} setValue={(v) => setValue({ ...value, [key]: v })} />
            }
        } else if (Array.isArray(subValue)) {
            if (subValue.length === 0) {
                return <div>
                    <p>{key} literal with 0 elements</p>
                </div>
            } else {
                return <div>
                    <p>{key} literal with type {typeof subValue[0]} allowed values = {subValue.join(", ")}</p>
                </div>
            }
        } else if (typeof subValue === "object") {
            if (subValue.repr === "object") {
                return (<ObjectField name={key} value={value[key] as Record<string, unknown> || {}} setValue={(v) => setValue({ ...value, [key]: v })} repr={subValue} />)
            }
        }
    })


    return <div>
        <p>{name} (object)</p>
        {itemsToRender}
    </div>
}