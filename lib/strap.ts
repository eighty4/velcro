import {Client} from '@elastic/elasticsearch'
import {parse as parseYaml} from 'yaml'
import {join as joinPath} from 'path'
import {readFile} from 'fs/promises'

type IndexName = string

interface Config {
    indices: Record<IndexName, Index>
}

type MappingName = string

type MappingType = 'keyword' | 'text' | 'date' | 'boolean'

interface Index {
    name: IndexName
    properties: Record<MappingName, MappingType>
}

function expandIndexProperties(properties: Record<MappingName, MappingType>): Record<MappingName, { 'type': MappingType }> {
    const expanded = {}
    Object.keys(properties).forEach(propName => expanded[propName] = {type: properties[propName]})
    return expanded
}

async function readConfigFileContent(): Promise<string> {
    const yamlPath = joinPath(process.cwd(), 'velcro.yaml')
    try {
        const yamlBuffer = await readFile(yamlPath)
        return yamlBuffer.toString('utf-8')
    } catch (e) {
        if (e.code && e.code === 'ENOENT') {
            console.log('no velcro.yaml found in cwd')
        } else {
            console.log(`error reading velcro.yaml: ${e.message}`)
        }
        process.exit(1)
    }
}

async function parseConfig(): Promise<Config> {
    const yamlString = await readConfigFileContent()
    let yamlObject
    try {
        yamlObject = parseYaml(yamlString)
    } catch (e) {
        console.log(`error parsing yaml from velcro.yaml: ${e.message}`)
        process.exit(1)
    }
    const config: Config = {
        indices: {},
    }
    if (yamlObject.indices) {
        Object.keys(yamlObject.indices).forEach((indexName) => {
            const index = yamlObject.indices[indexName]
            if (index.properties) {
                const properties = {}
                Object.keys(index.properties).forEach(propertyName => {
                    properties[propertyName] = index.properties[propertyName]
                })
                config.indices[indexName] = {name: indexName, properties}
            }
        })
    }
    return config
}

export async function strap() {
    const config = await parseConfig()
    const es = new Client({node: 'http://localhost:9200'})

    for (const indexName in config.indices) {
        const index = config.indices[indexName]
        await initIndex(es, index)
    }

    console.log('finished')
}

async function initIndex(client: Client, index: Index): Promise<void> {
    console.log('init', index.name)
    await deleteIndex(client, index.name, true)
    await createIndex(client, index)
}

async function createIndex(client: Client, index: Index): Promise<void> {
    const properties = expandIndexProperties(index.properties)
    try {
        await client.indices.create({
            index: index.name,
            mappings: {properties},
        })
    } catch (e) {
        const errorType = elasticErrorType(e)
        console.log(`error creating index ${index.name} (${errorType || e.message}), with mapping: ${JSON.stringify(properties, null, 4)}`)
    }
}

async function deleteIndex(client: Client, index: IndexName, catchIndexNotFound?: boolean): Promise<void> {
    try {
        await client.indices.delete({index})
    } catch (e) {
        const errorType = elasticErrorType(e)
        if (!catchIndexNotFound || errorType !== 'index_not_found_exception') {
            console.log(`error deleting index ${index} (${errorType || e.message})`)
        }
    }
}

function elasticErrorType(e: any): string | undefined {
    if (e && e.meta && e.meta.body && e.meta.body.error && e.meta.body.error.type) {
        return e.meta.body.error.type
    }
}
