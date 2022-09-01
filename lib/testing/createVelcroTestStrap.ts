import indexDocument from './indexDocument'
import type {DocumentFields, DocumentId, ManagedIndices} from './ManagedIndices'
import {defaultManagedTestIndexNameFn, type ManagedTestIndexNameFn} from './managedTestIndexName'
import validateIndexConfig from './validateIndexConfig'
import VelcroTestStrap from './VelcroTestStrap'
import verifyDocumentsIndexed from './verifyDocumentsIndexed'
import {createElasticsearchClient, type ElasticsearchOptions} from '../createElasticsearchClient'
import {type Index, type IndexName, initIndex, parseConfig} from '../strap'
import {isEmptyString, isString} from '../validateFns'

export interface VelcroTestStrapOptions {
    managedTestIndexNameFn?: ManagedTestIndexNameFn
    configPath?: string
    documents?: Record<string, Array<DocumentFields> | Record<DocumentId, DocumentFields>>
    elasticsearch?: ElasticsearchOptions
    indices: Array<string | Index>
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
        const testName = managedTestIndexNameFn(index.name)
        if (isEmptyString(testName)) {
            throw new Error(`index ${index.name} alt name fn result is empty`)
        }
        await initIndex(client, {
            ...index,
            name: testName,
        })
        managed[index.name] = {
            name: index.name,
            testName: testName,
            documents: [],
        }
    }

    if (options.documents) {
        for (const indexName in options.documents) {
            const altIndexName = managed[indexName].testName
            const indexing: Array<Promise<DocumentId>> = []
            if (Array.isArray(options.documents[indexName])) {
                for (const document of options.documents[indexName] as Array<any>) {
                    indexing.push(indexDocument(client, altIndexName, document))
                }
            } else {
                for (const id in options.documents[indexName]) {
                    const document = options.documents[indexName][id]
                    indexing.push(indexDocument(client, altIndexName, document, id))
                }
            }
            const documentIds = await Promise.all(indexing)
            documentIds.forEach(id => managed[indexName].documents.push(id))
        }
        await verifyDocumentsIndexed(client, managed)
    }
    return new VelcroTestStrap(client, managed)
}
