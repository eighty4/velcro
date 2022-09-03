import {Client} from '@elastic/elasticsearch'

import type {Documents} from './velcro.model'

export async function indexDocuments(client: Client, documents: Documents): Promise<number> {
    const indexing: Array<Promise<unknown>> = []
    for (const indexName in documents) {
        documents[indexName].forEach((document) => {
            indexing.push(client.index({
                index: indexName,
                id: document._id,
                document: document.doc,
            }))
        })
    }
    await Promise.all(indexing)
    return indexing.length
}
