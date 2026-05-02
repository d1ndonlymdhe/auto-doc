import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Accordion,
  AppShell,
  Box,
  Button,
  Card,
  Center,
  Container,
  Flex,
  Grid,
  GridCol,
  Group,
  JsonInput,
  Modal,
  NumberInput,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import './App.css'
import { useDisclosure } from '@mantine/hooks'
import z from 'zod'
import { ZodRepr, type Repr } from './reflection'

type HeaderField = {
  name: string
  description?: string
}

type ReprRequest = {
  headers: HeaderField[]
  params: HeaderField[]
  query: HeaderField[]
  body?: Repr
}

type DataResponse = {
  type: 'DATA'
  data: Repr
  description?: string
  headers: string[]
}

type StaticRedirectResponse = {
  type: 'STATIC_REDIRECT'
  location: string
  description?: string
  headers: string[]
}

type DynamicRedirectResponse = {
  type: 'DYNAMIC_REDIRECT'
  description?: string
  headers: string[]
}

type ReprResponse = DataResponse | StaticRedirectResponse | DynamicRedirectResponse

type RouteDoc = {
  method: string
  path: string
  inSchema: ReprRequest[]
  outSchema: ReprResponse[]
}


const StatusEnum = z.enum(["active", "inactive", "pending"]);

const RoleEnum = z.enum(["admin", "user", "guest"]);

const DeepSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),

  profile: z.object({
    name: z.object({
      first: z.string().min(1),
      middle: z.string().optional(),
      last: z.string().min(1),
    }),

    age: z.number().int().min(0).max(120),

    contact: z.object({
      email: z.string().email(),
      phone: z.string().nullable(),
    }),

    status: StatusEnum,
    role: RoleEnum,

    preferences: z.object({
      theme: z.enum(["light", "dark"]).default("light"),
      notifications: z.object({
        email: z.boolean(),
        sms: z.boolean().optional(),
        push: z.boolean().nullable(),
      }),
      record: z.record(z.string(), z.object({
        theme: z.enum(["light", "dark"]).default("light"),
        notifications: z.object({
          email: z.boolean(),
          sms: z.boolean().optional(),
          push: z.boolean().nullable(),
        }),
      }))
    }),
  }),

  metadata: z.object({
    version: z.literal(1),
    tags: z.array(z.string()).optional(),
    notes: z.string().nullable(),

    audit: z.object({
      createdBy: z.string(),
      updatedBy: z.string().nullable(),
      flags: z.array(
        z.object({
          type: z.enum(["warning", "error", "info"]),
          message: z.string(),
          code: z.union([
            z.literal("W001"),
            z.literal("E001"),
            z.number(),
          ]),
        })
      ).optional(),
    }),
  }),

  settings: z.object({
    privacy: z.object({
      visibility: z.enum(["public", "private", "friends"]),
      searchable: z.boolean().optional(),
    }).default({
      visibility: "private",
      searchable: false
    }),

    features: z.object({
      beta: z.boolean(),
      experiments: z.array(
        z.object({
          key: z.string(),
          enabled: z.boolean(),
          rollout: z.number().min(0).max(100).nullable(),
        })
      ).optional(),
    }).nullable(),
  }),

  // deeply nested union + optional + nullable combo
  extra: z.union([
    z.object({
      type: z.literal("A"),
      value: z.string(),
    }),
    z.object({
      type: z.literal("B"),
      value: z.number(),
    }),
    z.object({
      type: z.literal("C"),
      value: z.object({
        nested: z.string().nullable().optional(),
      }),
    }),
  ]).optional().nullable(),
});


function App() {
  const [routes, setRoutes] = useState<RouteDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const repr = ZodRepr(DeepSchema);

  async function fetchRoutes() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('http://localhost:3000/routes')
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }
      const data = await response.json() as RouteDoc[]
      setRoutes(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoutes()
  }, [])

  const sortedRoutes = useMemo(() => {
    return [...routes].sort((a, b) => {
      const pathCompare = a.path.localeCompare(b.path)
      if (pathCompare !== 0) {
        return pathCompare
      }
      return a.method.localeCompare(b.method)
    })
  }, [routes])

  return <AppShell
    header={{
      height: 56,
    }}
    padding="md"
  >
    <AppShell.Header>
      <Center h="100%" px="md">
        <Title>
          API DOCS
        </Title>
      </Center>
    </AppShell.Header>
    <AppShell.Main>
      <Container py="md" px="xs" size="lg">
        <Stack gap="md">
          {
            sortedRoutes.map((RouteDoc, idx) => {
              return <RouteDocRender key={idx} routeDoc={RouteDoc} />
            })
          }
        </Stack>
      </Container>
    </AppShell.Main>
  </AppShell>
}

function RouteDocRender({ routeDoc }: { routeDoc: RouteDoc }) {

  const [inputVariant, setInputVariant] = useState(0)
  const [outputVariant, setOutputVariant] = useState(0)

  const defaultOpenAccordionsIn = useMemo(() => {
    let items = [] as string[];
    const schema = routeDoc.inSchema[inputVariant];
    if (schema.headers?.length > 0) {
      items.push('Headers')
    }
    if (schema.params.length > 0) {
      items.push('Path Parameters')
    }
    if (schema.query.length > 0) {
      items.push('Query Parameters')
    }
    return items;
  }, [inputVariant])
  const inSchema = useMemo(() => {
    return routeDoc.inSchema[inputVariant]
  }, [inputVariant])
  const outSchema = useMemo(() => {
    return routeDoc.outSchema[outputVariant]
  }, [outputVariant])
  return (
    <Accordion variant='separated'>
      <Accordion.Item key={`${routeDoc.method}-${routeDoc.path}`} value={`${routeDoc.method}-${routeDoc.path}`}>
        <Accordion.Control>
          {routeDoc.method.toUpperCase()} {routeDoc.path}
        </Accordion.Control>
        <Accordion.Panel>
          <Group grow>
            <Container px={0} py={2}>
              <Flex dir='row' gap={20} align={"center"} my="sm">
                <Title
                  order={4}
                >
                  Input Schema
                </Title>
                <Select
                  onChange={(value) => {
                    setInputVariant(value)
                  }}
                  value={inputVariant}
                  data={
                    routeDoc.inSchema.map((_schema, index) => {
                      return {
                        value: index,
                        label: `Variant ${index + 1}`
                      }
                    })
                  } />
              </Flex>
              <Stack gap="sm">
                <Accordion multiple={true} variant='separated'>
                  {
                    inSchema?.headers?.length > 0 &&
                    <NamedDescription title="Headers" items={inSchema?.headers || []} />
                  }
                  {
                    inSchema.query.length > 0 &&
                    <NamedDescription title="Query Parameters" items={inSchema.query} />
                  }
                  {
                    inSchema.params.length > 9 &&
                    <NamedDescription title="Path Parameters" items={inSchema.params} />
                  }
                </Accordion>
                {
                  inSchema.body &&
                  <Accordion multiple variant='separated'>
                    <Accordion.Item key={"body"} value='body' />
                    <Accordion.Control>
                      <Text>
                        Body
                      </Text>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <pre>
                        {ReprToText(inSchema.body, 1)}
                      </pre>
                    </Accordion.Panel>
                  </Accordion>
                }
                {/* <Stack gap="xs">
                    <Text>
                      Body
                    </Text>
                    <Text>
                      ARRAY TEST
                    </Text>
                    <Array name='abcd' repr={{
                      repr: "string",
                    }}></Array>
                  </Stack> */}
              </Stack>
            </Container>
            <Container px={0} py={2}>
              <Flex dir='row' gap={20} align={"center"} my="sm">
                <Title
                  order={4}
                >
                  Output Schema
                </Title>
                <Select
                  onChange={(value) => {
                    setOutputVariant(value)
                  }}
                  value={inputVariant}
                  data={
                    routeDoc.outSchema.map((_schema, index) => {
                      return {
                        value: index,
                        label: `Variant ${index + 1}`
                      }
                    })
                  } />

              </Flex>
              <Stack gap="sm">

                <Accordion multiple={true} defaultValue={defaultOpenAccordionsIn} variant='separated'>
                  {
                    outSchema.headers.length > 0 &&
                    <NamedDescription title="Headers" items={outSchema.headers.map(h => ({ name: h }))} />
                  }
                </Accordion>
                <Card withBorder p="md" radius="md">
                  {
                    outSchema.type === "DATA" &&
                    <pre>
                      {ReprToText(outSchema.data, 1)}
                    </pre>
                  }
                  {
                    outSchema.type === "STATIC_REDIRECT" &&
                    <Text>
                      Redirect to {outSchema.location}
                    </Text>
                  }
                  {
                    outSchema.type === "DYNAMIC_REDIRECT" &&
                    <Text>
                      Dynamic Redirect {outSchema.description ? `[${outSchema.description}]` : ""}
                    </Text>
                  }
                </Card>
              </Stack>
            </Container>
          </Group>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  )
}

function HeaderRender({ header }: {
  header: ReprRequest["headers"][number]
}) {
  return <Card withBorder p="md" radius="md">
    <Stack gap="xs">
      <Text fw={600} size="sm" lh={1.3}>
        {header.name}
      </Text>
      <Text c="dimmed" size="xs" lh={1.5}>
        {header.description || "No description"}
      </Text>
      <TextInput mt={2}></TextInput>
    </Stack>
  </Card>
}

function NamedDescription({ items: headers, title }: { items: HeaderField[], title: string }) {
  return <Accordion.Item key={title} value={title}>
    <Accordion.Control>{title}</Accordion.Control>
    <Accordion.Panel>
      {
        headers.length === 0 && (
          <Text c="dimmed" size="sm">
            No headers
          </Text>
        )
      }
      {headers.map((header, index) => (
        <HeaderRender key={index} header={header} />
      ))}
    </Accordion.Panel>
  </Accordion.Item>
}


function ReprToText(repr: Repr, tabs: number): string {
  if (repr.repr === "string") {
    return `string`
  }
  if (repr.repr === "number") {
    return `number`
  }
  if (repr.repr === "boolean") {
    return `boolean`
  }
  if (repr.repr === "null") {
    return `null`
  }
  if (repr.repr === "any") {
    return `any`
  }
  if (repr.repr === "unknown") {
    return "unknown"
  }
  if (repr.repr === "nullable") {
    let as_string = ReprToText(repr.element_type, tabs);
    return `${as_string} | null`
  }
  if (repr.repr === "optional") {
    let as_string = ReprToText(repr.element_type, tabs);
    return `${as_string} | undefined`
  }
  if (repr.repr === "default") {
    const as_string = ReprToText(repr.element_type, tabs);
    const value_as_string = typeof repr.value === "object" ? JSON.stringify(repr.value, null, 2) : typeof repr.value === "string" ? `"${repr.value}"` : repr.value
    return `${as_string}\n${tabbed_string(tabs, `/*Default Value : ${value_as_string}*/`)}`
  }
  if (repr.repr === "array") {
    const as_string = ReprToText(repr.element_type, tabs);
    return `${as_string}[]`
  }
  if (repr.repr === "enum") {
    let enum_values = repr.values;
    let as_string = "";
    for (let i = 0; i < enum_values.length; i++) {
      let str = typeof enum_values[i] === "string" ? `"${enum_values[i]}"` : enum_values[i]
      if (i == (enum_values.length - 1)) {
        as_string += str
      } else {
        as_string += `${str}|`
      }
    }
    return as_string;
  }
  if (repr.repr === "union") {
    let union_values = repr.options;
    let as_string = "";

    for (let i = 0; i < union_values.length; i++) {
      if (i == (union_values.length - 1)) {
        as_string += ReprToText(union_values[i], tabs)
      } else {
        as_string += `${ReprToText(union_values[i], tabs)}|`
      }
    }

    return as_string;
  }
  if (repr.repr === "literal") {
    let lit_values = repr.values;
    let as_string = "";
    for (let i = 0; i < lit_values.length; i++) {
      let str = typeof lit_values[i] === "string" ? `"${lit_values[i]}"` : lit_values[i]
      if (i == (lit_values.length - 1)) {
        as_string += str
      } else {
        as_string += `${str}|`
      }
    }
    return as_string;
  }
  if (repr.repr === "object") {
    let as_string = "{"
    for (const [name, repr_type] of Object.entries(repr.properties)) {
      as_string += `\n${tabbed_string(tabs, `${name}: ${ReprToText(repr_type, tabs + 1)}`)}`;
    }
    as_string += "\n" + tabbed_string(tabs - 1, "}")
    return as_string;
  }
  if (repr.repr === "record") {
    let as_string = `Record<string,${ReprToText(repr.value_type, tabs + 1)}>`
    return as_string;
  }
  throw new Error("Unknown repr type");
}

function tabbed_string(tabs: number, string: string) {
  let tab = "    "
  let out_str = "";
  for (let i = 0; i < tabs; i++) {
    out_str += tab;
  }
  out_str = out_str + string;
  return out_str;
}


function OutputReprToText(name: string, repr: Repr) {
  if (repr.repr === "string") {
    return `${name} : string`
  }
  if (repr.repr === "number") {
    return `${name} : number`
  }
  if (repr.repr === "boolean") {
    return `${name} : boolean`
  }
  if (repr.repr === "null") {
    return `${name} : null`
  }
  if (repr.repr === "nullable") {
    let x = OutputReprToText(name, repr.element_type);
    return `${x} | null`
  }
  if (repr.repr === "optional") {
    let x = OutputReprToText(name, repr.element_type);
    return `${x} | undefined`
  }
  if (repr.repr === "any") {
    return `${name} : any`
  }
  if (repr.repr === "default") {
    let x = OutputReprToText(name, repr.element_type);
    let y = JSON.stringify(x, null, 2)
    return `${x} default : ${y}`
  }
  if (repr.repr === "array") {
    let x = OutputReprToText(name, repr.element_type);
    return `( ${x} )[]`
  }
  if (repr.repr === "enum") {
    let enum_values = repr.values;
    let as_string = "";
    for (let i = 0; i < enum_values.length; i++) {
      if (i == 0 || i == (enum_values.length - 1)) {
        as_string += enum_values[i]
      } else {
        as_string += `${enum_values[i]}|`
      }
    }
    return `${name} : ${as_string}`
  }
  if (repr.repr === "union") {
    let union_values = repr.options;
    let as_string = "";

    for (let i = 0; i < union_values.length; i++) {
      if (i == 0 || i == (union_values.length - 1)) {
        as_string += union_values[i]
      } else {
        as_string += `${union_values[i]}|`
      }
    }
  }
}

function String({
  name,
  val,
  setVal
}: {
  name: string,
  val: string,
  setVal: (val: string) => void
}) {
  return <TextInput label={name} value={val} onChange={(e) => setVal(e.currentTarget.value)} />
}

function Number({
  name,
  val,
  setVal
}: {
  name: string,
  val: string,
  setVal: (val: number) => void
}) {
  return <NumberInput label={name} value={val} onChange={setVal} />
}

function Bool({
  name,
  val,
  setVal
}: {
  name: string,
  val: boolean,
  setVal: (val: boolean) => void
}) {
  return <Switch label={name} checked={val} onChange={(e) => setVal(e.currentTarget.checked)} />
}

function ReprEditorFactory(
  {
    name,
    val,
    setVal,
    repr
  }: {
    name: string,
    val: any,
    setVal: (val: any) => void,
    repr: Repr
  }
) {
  if (repr.repr === "string") {
    return <String
      name={name}
      val={val || ""}
      setVal={setVal}
    ></String>
  }
  if (repr.repr === "number") {
    return <Number
      name={name}
      val={val || ""}
      setVal={setVal}
    ></Number>
  }
  if (repr.repr === "boolean") {
    return <Bool
      name={name}
      val={val || false}
      setVal={setVal}
    ></Bool>
  }
  if (repr.repr === "array") {
    return <Array
      name={name}
      repr={repr}
    ></Array>
  }
}


function Array({
  name,
  repr
}: {
  name: string,
  repr: Repr
}) {
  const [items, setItems] = useState<any[]>([])
  const [opened, { open, close: _close }] = useDisclosure(false);


  const [val, setVal] = useState<any>()


  const close = () => {
    setVal(undefined)
    _close()
  }

  const saveAndClose = useCallback(() => {
    setItems([...items, val])
    setVal(undefined)
    _close()
  }, [val, items])


  return <Card withBorder p="md" radius="md">
    <Text size='lg' mb="xs">
      {name}
    </Text>
    <Stack gap="sm">
      {
        items.map((item, index) => {
          return <Group key={`${name}-${index}`} align="end" gap="sm">
            <ReprEditorFactory
              name={`Item ${index + 1}`}
              val={item}
              setVal={(newVal) => {
                const newItems = [...items]
                newItems[index] = newVal
                setItems(newItems)
              }}
              repr={repr}
            />
            <Button
              onClick={() => {
                const newItems = [...items]
                newItems.splice(index, 1)
                setItems(newItems)
              }}
            >
              DEL
            </Button>
          </Group>
        })
      }
    </Stack>
    <Button onClick={open} mt="sm">Add Item</Button>
    <Modal opened={opened} onClose={close}>
      <ReprEditorFactory name={`Item ${items.length + 1}`} val={val} setVal={setVal} repr={repr} />
      <Button onClick={saveAndClose} mt="sm">Add</Button>
    </Modal>
  </Card>
}




export default App
