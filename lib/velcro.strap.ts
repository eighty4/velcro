import {createElasticsearchClient, ElasticsearchClientConfig} from './createElasticsearchClient'
import {indexDocuments} from './indexDocuments'
import {initIndex} from './indices'
import {isEmptyString} from './validateFns'
import type {Config} from './velcro.config'
import type {DocumentId, Environment, Index, IndexName} from './velcro.model'

export interface StrapOptions {
    configFile: string
    elasticsearch?: ElasticsearchClientConfig
    environment?: Environment
}

export interface StrapResult {
    created: {
        indices: Array<Index>,
        documents: Record<IndexName, DocumentId>,
    }
}

export async function strap(config: Config, options: StrapOptions): Promise<StrapResult> {
    const es = createElasticsearchClient()

    if (!isEmptyString(options.environment) && !config.documents[options.environment as string]) {
        throw new Error(`strap for env ${options.environment} without any ${options.environment} specific config`)
    }

    const result: StrapResult = {created: {indices: [], documents: {}}}

    for (const indexName in config.indices) {
        const index = config.indices[indexName]
        await initIndex(es, index)
        result.created.indices.push(index)
    }

    if (config.documents['all']) {
        await indexDocuments(es, config.documents['all'])
    }
    if (options.environment) {
        await indexDocuments(es, config.documents[options.environment])
    }
    return result
}
