import type {DocumentId, IndexName} from '../velcro.model'

export interface ManagedIndex {
    name: IndexName
    managedTestName: IndexName
    documents: Array<DocumentId>
}

export type ManagedIndices = Record<IndexName, ManagedIndex>
