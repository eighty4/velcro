import type {Client} from '@elastic/elasticsearch'

import type {DocumentId, DocumentIds, Documents, Document, IndexName} from './velcro.model'

export async function indexDocument(client: Client, index: string, document: Document): Promise<DocumentId> {
    try {
        return (await client.index({index, id: document._id, document: document.doc}))._id
    } catch (e: any) {
        throw new Error(`error indexing document in index ${index} (${e.message})`)
    }
}

interface IndexDocumentsResult {
    count: number
    documentIds: DocumentIds
}

export async function indexDocuments(client: Client, documents: Documents): Promise<IndexDocumentsResult> {
    const indexing: Record<IndexName, Array<Promise<DocumentId>>> = {}
    for (const indexName in documents) {
        indexing[indexName] = []
        for (const document of documents[indexName]) {
            indexing[indexName].push(indexDocument(client, indexName, document))
        }
    }

    const documentIds: DocumentIds = {}
    let count = 0
    for (const indexName in indexing) {
        count += indexing[indexName].length
        documentIds[indexName] = await Promise.all(indexing[indexName])
    }

    return {count, documentIds}
}
