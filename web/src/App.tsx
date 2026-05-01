import { useCallback, useEffect, useMemo, useState } from 'react'
import {
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
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import './App.css'
import { useDisclosure } from '@mantine/hooks'

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

type Repr =
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


function App() {
  const [routes, setRoutes] = useState<RouteDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
  return (
    <Card key={`${routeDoc.method}-${routeDoc.path}`} shadow="sm" p="md" withBorder radius="md">
      <Title order={3} mb="md">{routeDoc.method.toUpperCase()} {routeDoc.path}</Title>
      <Grid>
        <Grid.Col>
          <Container px={0}>
            <Title
              order={4}
              mb="sm"
            >
              Input Schema
            </Title>
            <Stack gap="sm">
              <NamedDescription title="Headers" items={routeDoc.inSchema[0]?.headers || []} />
              <NamedDescription title="Query Parameters" items={routeDoc.inSchema[0].query} />
              <NamedDescription title="Path Parameters" items={routeDoc.inSchema[0].params} />
              <Card withBorder p="md" radius="md">
                <Stack gap="xs">
                  <Text>
                    Body
                  </Text>
                  <Text>
                    ARRAY TEST
                  </Text>
                  <Array name='abcd' repr={{
                    repr: "string",
                  }}></Array>
                </Stack>
              </Card>
            </Stack>
          </Container>
        </Grid.Col>
      </Grid>
    </Card>
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
  return (
    <Card withBorder p="md" radius="md">
      <Stack gap="sm">
        <Title order={5}>
          {title}
        </Title>
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
      </Stack>
    </Card>
  )
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
