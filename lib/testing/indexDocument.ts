import type {Client} from '@elastic/elasticsearch'

import type {DocumentFields, DocumentId} from './ManagedIndices'

export default async function indexDocument(client: Client, index: string, document: DocumentFields, id?: DocumentId): Promise<DocumentId> {
    try {
        return (await client.index({index, id, document}))._id
    } catch (e) {
        throw new Error(`error indexing document in index ${index} (${e.message})`)
    }
}
