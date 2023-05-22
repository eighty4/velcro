import {createElasticsearchClient, ElasticsearchClientConfig} from './es.client'
import {indexDocuments} from './es.documents'
import {initIndex} from './es.indices'
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

    if (options.logger) {
        const {length: indicesCount} = result.created.indices
        const indices = `${indicesCount} ${indicesCount === 1 ? 'index' : 'indices'}`
        const {length: docsCount} = Object.keys(result.created.documents)
        const documents = `${docsCount} document${docsCount === 1 ? '' : 's'}`
        options.logger.log('created', indices, 'and', documents)
    }

    return result
}
