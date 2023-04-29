import type {Client} from '@elastic/elasticsearch'

import type {Index, IndexName, MappingName} from './velcro.model'
import type {MappingProperty} from '@elastic/elasticsearch/lib/api/types'

export async function initIndex(client: Client, index: Index): Promise<void> {
    await deleteIndex(client, index.name, true)
    await createIndex(client, index)
}

async function createIndex(client: Client, index: Index): Promise<void> {
    const properties: Record<MappingName, MappingProperty> = {}
    Object.keys(index.properties).forEach(propName => properties[propName] = {type: index.properties[propName]})
    try {
        await client.indices.create({
            index: index.name,
            mappings: {properties},
        })
    } catch (e: any) {
        const errorType = elasticErrorType(e)
        console.log(`error creating index ${index.name} (${errorType || e.message}), with mapping: ${JSON.stringify(properties, null, 4)}`)
    }
}

async function deleteIndex(client: Client, index: IndexName, catchIndexNotFound?: boolean): Promise<void> {
    try {
        await client.indices.delete({index})
    } catch (e: any) {
        const errorType = elasticErrorType(e)
        if (!catchIndexNotFound || errorType !== 'index_not_found_exception') {
            console.log(`error deleting index ${index} (${errorType || e.message})`)
        }
    }
}

type ElasticsearchError = { meta?: { body?: { error?: { type?: string } } } }

function elasticErrorType(e?: ElasticsearchError): string | undefined {
    if (e && e.meta && e.meta.body && e.meta.body.error && e.meta.body.error.type) {
        return e.meta.body.error.type
    }
}
