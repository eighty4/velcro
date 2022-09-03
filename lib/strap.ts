import type {Client} from '@elastic/elasticsearch'

import {createElasticsearchClient} from './createElasticsearchClient'
import {indexDocuments} from './indexDocuments'
import {isEmptyString} from './validateFns'
import {expandIndexProperties, parseConfig} from './velcro.config'
import type {Environment, Index, IndexName} from './velcro.model'

export interface StrapOptions {
    environment?: Environment
}

export async function strap(options: StrapOptions) {
    const config = await parseConfig()
    const es = createElasticsearchClient()

    if (!isEmptyString(options.environment) && !config.documents[options.environment]) {
        console.log(`velcro strap ran for env ${options.environment} but there is no ${options.environment} config`)
        process.exit(1)
    }

    for (const indexName in config.indices) {
        const index = config.indices[indexName]
        console.log('init', index.name)
        await initIndex(es, index)
    }

    let created = 0
    if (config.documents['all']) {
        created += await indexDocuments(es, config.documents['all'])
    }
    if (options.environment) {
        created += await indexDocuments(es, config.documents[options.environment])
    }
    console.log(`created ${created} document${created === 1 ? '' : 's'}`)

    console.log('finished')
}

export async function initIndex(client: Client, index: Index): Promise<void> {
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
