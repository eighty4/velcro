import type {Client} from '@elastic/elasticsearch'

import type {DocumentId, ManagedIndices} from './ManagedIndices'
import type {IndexName} from '../strap'

interface IndexedDocument {
    indexed: boolean
    index: IndexName
    id: DocumentId
}

async function verifyDocumentIndexed(client: Client, index: string, id: string): Promise<IndexedDocument> {
    try {
        await client.get({index, id})
        return {index, id, indexed: true}
    } catch (e) {
        return {index, id, indexed: false}
    }
}

export default async function verifyDocumentsIndexed(client: Client, managed: ManagedIndices) {
    const waitTimeout = (ms: number) => new Promise(res => setTimeout(res, ms))
    const pending: Record<IndexName, Array<DocumentId>> = {}
    for (const indexName in managed) {
        const index = managed[indexName]
        if (index.documents.length) {
            pending[index.testName] = index.documents.slice()
        }
    }

    do {
        await waitTimeout(100)
        const verifying: Array<Promise<IndexedDocument>> = []
        for (const indexName in pending) {
            for (const documentId of pending[indexName]) {
                verifying.push(verifyDocumentIndexed(client, indexName, documentId))
            }
        }
        const verifyResults = await Promise.all(verifying)
        for (const verifyResult of verifyResults) {
            if (verifyResult.indexed) {
                pending[verifyResult.index].splice(pending[verifyResult.index].indexOf(verifyResult.id), 1)
                if (!pending[verifyResult.index].length) {
                    delete pending[verifyResult.index]
                }
            }
        }
    } while (Object.keys(pending).length)
}
