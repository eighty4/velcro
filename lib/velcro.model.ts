export type DocumentId = string

export type DocumentFields = any

export type Document = { _id?: DocumentId, doc: DocumentFields }

export type Documents = Record<IndexName, Array<Document>>

export type DocumentIds = Record<IndexName, Array<DocumentId>>

export type DocumentsConfig = Record<Environment, Documents>

export type Environment = string

export type IndexName = string

export type MappingName = string

export type MappingType = 'keyword' | 'text' | 'date' | 'boolean'

export interface Index {
    name: IndexName
    properties: Record<MappingName, MappingType>
}
