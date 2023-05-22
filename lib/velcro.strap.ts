import {createElasticsearchClient, ElasticsearchClientConfig} from './es.client'
import {indexDocuments} from './es.documents'
import {initIndex} from './es.indices'
import type {Logger} from './logger'
import {isEmptyString} from './validateFns'
import type {Config} from './velcro.config'
import type {DocumentIds, Documents, Environment, Index} from './velcro.model'

export interface StrapOptions {
    configFile: string
    elasticsearch?: ElasticsearchClientConfig
    environment?: Environment
    logger?: Logger
}

export interface StrapResult {
    created: {
        indices: Array<Index>,
        documents: DocumentIds,
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

    const hasEnvDocs = !!options.environment && config.documents[options.environment]
    if (!hasEnvDocs && !config.documents['all']) {
        return result
    }

    if (options.logger) {
        if (hasEnvDocs) {
            options.logger.log('indexing docs for environment', options.environment)
        } else if (config.documents['all']) {
            options.logger.log('indexing docs (no declared environment)')
        }
    }

    async function indexDocumentsAndMergeResult(docs: Documents) {
        const indexResult = await indexDocuments(es, docs)
        Object.keys(indexResult.documentIds).forEach(indexName => {
            if (!result.created.documents[indexName]) {
                result.created.documents[indexName] = []
            }
            indexResult.documentIds[indexName].forEach(documentId => {
                result.created.documents[indexName].push(documentId)
            })
        })
    }

    if (config.documents['all']) {
        await indexDocumentsAndMergeResult(config.documents['all'])
    }
    if (hasEnvDocs && options.environment) {
        await indexDocumentsAndMergeResult(config.documents[options.environment])
    }

    if (options.logger) {
        const {length: indicesCount} = result.created.indices
        const indices = `${indicesCount} ${indicesCount === 1 ? 'index' : 'indices'}`
        const docsCount = Object.keys(result.created.documents)
            .reduce((a, v) => a + result.created.documents[v].length, 0)
        const documents = `${docsCount} document${docsCount === 1 ? '' : 's'}`
        options.logger.log('created', indices, 'and', documents)
    }

    return result
}
