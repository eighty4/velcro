import type {IndexName} from '../strap'

export type DocumentId = string

export type DocumentFields = any

export interface ManagedIndex {
    name: IndexName
    managedTestName: IndexName
    documents: Array<DocumentId>
}

export type ManagedIndices = Record<IndexName, ManagedIndex>
