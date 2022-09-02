import type {Client} from '@elastic/elasticsearch'

import type {DocumentId, ManagedIndices} from './ManagedIndices'
import type {IndexName} from '../strap'

export default class VelcroTestStrap {
    constructor(private readonly _client: Client,
                private readonly _managed: ManagedIndices) {
    }

    async cleanup(skipClosingElasticsearchClient?: boolean): Promise<void> {
        await this.deleteIndices()
        const closeClient = !(skipClosingElasticsearchClient === true)
        if (closeClient) {
            await this._client.close()
        }
    }

    async deleteIndices(): Promise<void> {
        for (const indexName in this._managed) {
            const index = this._managed[indexName].managedTestName
            await this._client.indices.delete({index})
        }
    }

    async deleteDocuments(): Promise<void> {
        for (const indexName in this._managed) {
            const index = this._managed[indexName].managedTestName
            for (const id in this._managed[indexName]) {
                await this._client.delete({index, id})
            }
        }
    }

    managedIndexName(index: IndexName): IndexName {
        if (!this._managed[index]) {
            throw new Error(`${index} is not a managed index`)
        }
        return this._managed[index].managedTestName
    }

    get managedIndexNames(): Record<IndexName, IndexName> {
        const names = {}
        for (const indexName in this._managed) {
            names[indexName] = this._managed[indexName].managedTestName
        }
        return names
    }

    documentId(indexName: IndexName, i: number): DocumentId {
        const documentIds = this.documentIds(indexName)
        if (i >= documentIds.length) {
            throw new Error(`${indexName}.documents[${i}] is out of bounds`)
        }
        return documentIds[i]
    }

    documentIds(indexName: IndexName): Array<DocumentId> {
        const index = Object.keys(this._managed)
            .map(maybeIndexName => this._managed[maybeIndexName])
            .find(index => index.name === indexName || index.managedTestName === indexName)
        if (!index) {
            throw new Error(`no index state for ${indexName}`)
        }
        return [...index.documents]
    }

    get elasticsearchClient(): Client {
        return this._client
    }

    get managedDocuments(): ManagedIndices {
        const copy: ManagedIndices = {}
        for (const indexName in this._managed) {
            const index = this._managed[indexName]
            copy[indexName] = {
                ...index,
                documents: [...index.documents],
            }
        }
        return copy
    }
}
