import type {ManagedIndices} from './ManagedIndices'
import {defaultManagedTestIndexNameFn, type ManagedTestIndexNameFn} from './managedTestIndexName'
import validateIndexConfig from './validateIndexConfig'
import VelcroTestStrap from './VelcroTestStrap'
import {createElasticsearchClient, type ElasticsearchOptions} from '../createElasticsearchClient'
import {indexDocuments} from '../indexDocuments'
import {initIndex} from '../strap'
import {isEmptyString, isString} from '../validateFns'
import {parseConfig} from '../velcro.config'
import type {DocumentFields, DocumentId, Documents, Index, IndexName} from '../velcro.model'

export interface VelcroTestStrapOptions {
    configPath?: string
    documents?: Record<IndexName, Array<DocumentFields> | Record<DocumentId, DocumentFields>>
    elasticsearch?: ElasticsearchOptions
    indices: Array<IndexName | Index>
    managedTestIndexNameFn?: ManagedTestIndexNameFn
    refreshIndices?: boolean
}

export async function createVelcroTestStrap(options: VelcroTestStrapOptions): Promise<VelcroTestStrap> {
    if (!options) {
        throw new Error('createVelcroTestStrap called without opts')
    }

    const indices: Array<Index> = []
    const indexNameReferences: Record<IndexName, number> = {}
    options.indices.forEach((index, i) => {
        if (isString(index)) {
            indexNameReferences[index as string] = i
        } else {
            try {
                validateIndexConfig(index as Index)
                indices.push(index as Index)
            } catch (e) {
                throw new Error(`opts.indices[${i}] is invalid (${e.message})`)
            }
        }
    })

    if (Object.keys(indexNameReferences).length) {
        const config = await parseConfig(options.configPath)
        for (const indexName in indexNameReferences) {
            const index = config.indices[indexName]
            if (!index) {
                throw new Error(`${indexName} not found in ${options.configPath ?? 'velcro.yaml'}`)
            }
            const i = indexNameReferences[indexName]
            indices.splice(i, 0, index)
        }
    }

    if (options.documents) {
        for (const indexName in options.documents) {
            if (!indices.some(index => index.name === indexName)) {
                throw new Error(`options.documents['${indexName}'] index is not managed by velcro`)
            }
            if (options.documents[indexName]) {
                if (!Array.isArray(options.documents[indexName])) {
                    throw new Error(`options.documents['${indexName}'] is not an array`)
                }
                options.documents[indexName].forEach((document, i) => {
                    if (document && !Object.keys(document).length) {
                        throw new Error(`options.documents['${indexName}'][${i}] is an empty object`)
                    }
                })
            }
        }
    }

    const client = createElasticsearchClient(options.elasticsearch)
    const managed: ManagedIndices = {}
    const managedTestIndexNameFn = options.managedTestIndexNameFn ?? defaultManagedTestIndexNameFn

    for (const index of indices) {
        const managedTestName = managedTestIndexNameFn(index.name)
        if (isEmptyString(managedTestName)) {
            throw new Error(`index ${index.name} alt name fn result is empty`)
        }
        await initIndex(client, {
            ...index,
            name: managedTestName,
        })
        managed[index.name] = {
            name: index.name,
            managedTestName,
            documents: [],
        }
    }

    if (options.documents) {
        const documents: Documents = {}
        for (const indexName in options.documents) {
            const {managedTestName} = managed[indexName]
            documents[managedTestName] = []
            if (Array.isArray(options.documents[indexName])) {
                for (const doc of options.documents[indexName] as Array<any>) {
                    documents[managedTestName].push({doc})
                }
            } else {
                for (const _id in options.documents[indexName]) {
                    const doc = options.documents[indexName][_id]
                    documents[managedTestName].push({_id, doc})
                }
            }
        }
        const indexingResult = await indexDocuments(client, documents)
        for (const managedTestName in indexingResult.documentIds) {
            const indexName = Object.keys(managed)
                .find(indexName => managed[indexName].managedTestName === managedTestName)
            managed[indexName].documents = indexingResult.documentIds[managedTestName]
        }

        if (typeof options.refreshIndices === 'undefined' || options.refreshIndices === true) {
            await options.elasticsearch.client.indices.refresh({
                index: Object.keys(options.documents).map(indexName => managed[indexName].managedTestName)
            })
        }
    }
    return new VelcroTestStrap(client, managed)
}
