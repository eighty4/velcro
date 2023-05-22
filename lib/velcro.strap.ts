import {createElasticsearchClient, ElasticsearchClientConfig} from './createElasticsearchClient'
import {indexDocuments} from './indexDocuments'
import {initIndex} from './indices'
import type {Logger} from './logger'
import {isEmptyString} from './validateFns'
import type {Config} from './velcro.config'
import type {DocumentId, Environment, Index, IndexName} from './velcro.model'

export interface StrapOptions {
    configFile: string
    elasticsearch?: ElasticsearchClientConfig
    environment?: Environment
    logger?: Logger
}

export interface StrapResult {
    created: {
        indices: Array<Index>,
        documents: Record<IndexName, DocumentId>,
    }
}

export async function strap(config: Config, options: StrapOptions): Promise<StrapResult> {
    const es = createElasticsearchClient(options.elasticsearch, options.logger)

    if (!isEmptyString(options.environment) && !config.documents[options.environment as string]) {
        throw new Error(`strap for env ${options.environment} without any ${options.environment} specific config`)
    }

    const result: StrapResult = {created: {indices: [], documents: {}}}

    for (const indexName in config.indices) {
        const index = config.indices[indexName]
        await initIndex(es, index)
        if (options.logger) {
            options.logger.log('created index', indexName)
        }
        result.created.indices.push(index)
    }

    if (options.logger) {
        if (options.environment) {
            options.logger.log('indexing docs for env', options.environment)
        } else if (config.documents['all']) {
            options.logger.log('indexing docs (no env specified)')
        }
    }
    if (config.documents['all']) {
        await indexDocuments(es, config.documents['all'])
    }
    if (options.environment) {
        await indexDocuments(es, config.documents[options.environment])
    }
    return result
}
