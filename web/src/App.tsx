import { useEffect, useMemo, useState } from 'react'
import {
  Badge,
  Box,
  Button,
  Card,
  Code,
  Container,
  Divider,
  Group,
  Loader,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import './App.css'

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

type ReprObject = {
  repr: string
  description?: string
  [key: string]: unknown
}

type Repr = ReprObject | string[] | number[] | boolean[] | string

const methodColor: Record<string, string> = {
  get: 'teal',
  post: 'blue',
  put: 'orange',
  patch: 'grape',
  delete: 'red',
}

function isReprObject(value: Repr | undefined): value is ReprObject {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value) && 'repr' in value)
}

function descriptionPrefix(description?: string) {
  return description ? `(${description}) ` : ''
}

function primitiveToken(name: string) {
  return `<${name}>`
}

function renderHeaderList(title: string, rows: HeaderField[]) {
  if (rows.length === 0) {
    return (
      <Box>
        <Text fw={600} size="sm">{title}</Text>
        <Text c="dimmed" size="sm">None</Text>
      </Box>
    )
  }

  return (
    <Box>
      <Text fw={600} size="sm">{title}</Text>
      <Stack gap={4} mt={4}>
        {rows.map((row) => (
          <Text key={`${title}-${row.name}`} size="sm">
            <strong>{row.name}</strong>
            {row.description ? ` - ${row.description}` : ''}
          </Text>
        ))}
      </Stack>
    </Box>
  )
}

function SchemaTree({ schema, level = 0 }: { schema: Repr; level?: number }) {
  if (Array.isArray(schema)) {
    const inferredType = schema.length > 0 ? typeof schema[0] : 'value'
    return <Code block>{`[${primitiveToken(inferredType)}]... ${JSON.stringify(schema)}`}</Code>
  }

  if (typeof schema === 'string') {
    return <Code>{primitiveToken(schema)}</Code>
  }

  if (!isReprObject(schema)) {
    return <Code>{String(schema)}</Code>
  }

  const indentStyle = { marginLeft: level * 14, marginTop: 4 }
  const labelPrefix = descriptionPrefix(schema.description)

  switch (schema.repr) {
    case 'object': {
      const properties = (schema.properties as Record<string, Repr>) || {}
      const keys = Object.keys(properties)
      return (
        <Box style={indentStyle}>
          <details open={level < 1}>
            <summary>
              <Code>{`${labelPrefix}{ key: value }`}</Code>
            </summary>
            <Stack gap={6} mt={6}>
              {keys.length === 0 ? <Text size="sm" c="dimmed">{`{}`}</Text> : null}
              {keys.map((key) => (
                <Box key={`${level}-${key}`}>
                  <Text size="sm" fw={600}>{`${key}:`}</Text>
                  <SchemaTree schema={properties[key]} level={level + 1} />
                </Box>
              ))}
            </Stack>
          </details>
        </Box>
      )
    }
    case 'array': {
      const element = schema.element_type as Repr
      const elementLabel = isReprObject(element) ? primitiveToken(element.repr) : '<element_type>'
      return (
        <Box style={indentStyle}>
          <details open={level < 1}>
            <summary>
              <Code>{`${labelPrefix}[ ${elementLabel} ]`}</Code>
            </summary>
            <Box mt={6}>
              <SchemaTree schema={element} level={level + 1} />
            </Box>
          </details>
        </Box>
      )
    }
    case 'union': {
      const options = (schema.options as Repr[]) || []
      return (
        <Box style={indentStyle}>
          <details open={level < 1}>
            <summary>
              <Code>{`${labelPrefix}[<union>]...`}</Code>
            </summary>
            <Stack gap={6} mt={6}>
              {options.map((option, index) => (
                <Box key={`union-${level}-${index}`}>
                  <Text size="xs" c="dimmed">Option {index + 1}</Text>
                  <SchemaTree schema={option} level={level + 1} />
                </Box>
              ))}
            </Stack>
          </details>
        </Box>
      )
    }
    case 'enum':
    case 'literal':
      return <Code block>{`${labelPrefix}[${primitiveToken(typeof ((schema.values as unknown[])[0] ?? 'string'))}]... ${JSON.stringify(schema.values)}`}</Code>
    case 'nullable':
    case 'optional':
      return (
        <Box style={indentStyle}>
          <details open={level < 1}>
            <summary>
              <Code>{`${labelPrefix}${schema.repr}`}</Code>
            </summary>
            <Box mt={6}>
              <SchemaTree schema={schema.element_type as Repr} level={level + 1} />
            </Box>
          </details>
        </Box>
      )
    case 'default':
      return (
        <Box style={indentStyle}>
          <details open={level < 1}>
            <summary>
              <Code>{`${labelPrefix}default`}</Code>
            </summary>
            <Code block mt={6}>{JSON.stringify(schema.value, null, 2)}</Code>
            <Box mt={6}>
              <SchemaTree schema={schema.element_type as Repr} level={level + 1} />
            </Box>
          </details>
        </Box>
      )
    case 'record':
      return (
        <Box style={indentStyle}>
          <details open={level < 1}>
            <summary>
              <Code>{`${labelPrefix}{ [${String(schema.key_type)}]: value }`}</Code>
            </summary>
            <Box mt={6}>
              <SchemaTree schema={schema.value_type as Repr} level={level + 1} />
            </Box>
          </details>
        </Box>
      )
    default:
      return <Code>{`${labelPrefix}${primitiveToken(schema.repr)}`}</Code>
  }
}

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
    void fetchRoutes()
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

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Paper className="hero" radius="xl" p="xl">
          <Group justify="space-between" align="flex-start">
            <Box>
              <Text size="xs" fw={700} tt="uppercase" c="dimmed">Contract Explorer</Text>
              <Title order={1}>API Documentation</Title>
              <Text c="dimmed" mt={4}>Source: http://localhost:3000/routes</Text>
            </Box>
            <Button onClick={() => void fetchRoutes()} variant="light">Refresh</Button>
          </Group>
        </Paper>

        {loading ? (
          <Paper p="xl" radius="md">
            <Group justify="center">
              <Loader />
              <Text>Loading route metadata...</Text>
            </Group>
          </Paper>
        ) : null}

        {error ? (
          <Paper p="xl" radius="md" className="errorPanel">
            <Title order={3}>Unable to load docs</Title>
            <Text mt={6}>{error}</Text>
            <Text c="dimmed" size="sm" mt={6}>Ensure the backend is running on localhost:3000 and CORS is enabled.</Text>
          </Paper>
        ) : null}

        {!loading && !error && sortedRoutes.length === 0 ? (
          <Paper p="xl" radius="md">
            <Text>No routes found in metadata.</Text>
          </Paper>
        ) : null}

        {!loading && !error ? (
          <Stack gap="md">
            {sortedRoutes.map((route, routeIndex) => (
              <Card key={`${route.method}-${route.path}-${routeIndex}`} radius="lg" withBorder>
                <Group justify="space-between" align="center">
                  <Group gap="sm">
                    <Badge color={methodColor[route.method] || 'gray'} variant="filled">{route.method.toUpperCase()}</Badge>
                    <Code>{route.path}</Code>
                  </Group>
                  <Text size="sm" c="dimmed">
                    {route.inSchema.length} request variant(s), {route.outSchema.length} response variant(s)
                  </Text>
                </Group>

                <Divider my="md" />

                <Group align="flex-start" grow>
                  <Stack gap="sm">
                    <Title order={4}>Request</Title>
                    {route.inSchema.map((requestSchema, requestIndex) => (
                      <Paper key={`in-${routeIndex}-${requestIndex}`} p="sm" withBorder radius="md">
                        <Text fw={700} size="sm">Variant {requestIndex + 1}</Text>
                        <Stack gap="xs" mt={8}>
                          {renderHeaderList('Headers', requestSchema.headers)}
                          {renderHeaderList('Params', requestSchema.params)}
                          {renderHeaderList('Query', requestSchema.query)}
                          <Box>
                            <Text fw={600} size="sm">Body</Text>
                            {requestSchema.body ? (
                              <ScrollArea.Autosize mah={260} mt={4}>
                                <SchemaTree schema={requestSchema.body} />
                              </ScrollArea.Autosize>
                            ) : (
                              <Text c="dimmed" size="sm">None</Text>
                            )}
                          </Box>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>

                  <Stack gap="sm">
                    <Title order={4}>Response</Title>
                    {route.outSchema.map((responseSchema, responseIndex) => (
                      <Paper key={`out-${routeIndex}-${responseIndex}`} p="sm" withBorder radius="md">
                        <Text fw={700} size="sm">Variant {responseIndex + 1}</Text>
                        <Text size="sm" mt={6}><strong>Type:</strong> {responseSchema.type}</Text>
                        {responseSchema.description ? (
                          <Text size="sm"><strong>Description:</strong> {responseSchema.description}</Text>
                        ) : null}

                        {responseSchema.headers.length > 0 ? (
                          <Text size="sm"><strong>Headers:</strong> {responseSchema.headers.join(', ')}</Text>
                        ) : (
                          <Text size="sm" c="dimmed">Headers: none</Text>
                        )}

                        {responseSchema.type === 'STATIC_REDIRECT' ? (
                          <Text size="sm"><strong>Location:</strong> {responseSchema.location}</Text>
                        ) : null}

                        {responseSchema.type === 'DATA' ? (
                          <Box mt={8}>
                            <Text fw={600} size="sm">Body schema</Text>
                            <ScrollArea.Autosize mah={260} mt={4}>
                              <SchemaTree schema={responseSchema.data} />
                            </ScrollArea.Autosize>
                          </Box>
                        ) : null}
                      </Paper>
                    ))}
                  </Stack>
                </Group>
              </Card>
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Container>
  )
}

export default App
