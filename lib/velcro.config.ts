import {readFile} from 'fs/promises'
import {join as joinPath} from 'path'
import {parse as parseYaml} from 'yaml'

import type {DocumentsConfig, Index, IndexName, MappingName, MappingType} from './velcro.model'

export interface Config {
    indices: Record<IndexName, Index>
    documents: DocumentsConfig
}

export async function readConfig(configPath?: string): Promise<Config | null> {
    const configYaml = await readConfigFileContent(configPath)
    if (configYaml) {
        return await parseConfig(configYaml)
    } else {
        return null
    }
}

async function readConfigFileContent(configPath?: string): Promise<string | null> {
    if (!configPath) {
        configPath = process.cwd()
    }
    if (!configPath.endsWith('velcro.yaml')) {
        configPath = joinPath(configPath, 'velcro.yaml')
    }
    try {
        return (await readFile(configPath)).toString('utf-8')
    } catch (e: any) {
        if (e.code && e.code === 'ENOENT') {
            return null
        } else {
            throw new Error(`velcro.yaml read error: ${e.message}`)
        }
    }
}

export async function parseConfig(configYaml: string): Promise<Config | null> {
    let yamlObject: any
    try {
        yamlObject = parseYaml(configYaml as string)
    } catch (e: any) {
        throw new Error(`yaml parse error (${e.message})`)
    }
    const config: Config = {
        indices: {},
        documents: {},
    }
    if (yamlObject.indices) {
        Object.keys(yamlObject.indices).forEach((indexName) => {
            const index = yamlObject.indices[indexName]
            if (index.properties) {
                const properties: Record<MappingName, MappingType> = {}
                Object.keys(index.properties).forEach(propertyName => {
                    properties[propertyName] = index.properties[propertyName]
                })
                config.indices[indexName] = {name: indexName, properties}
            }
        })
    }
    if (yamlObject.documents) {
        Object.keys(yamlObject.documents).forEach((environment) => {
            config.documents[environment] = {}
            Object.keys(yamlObject.documents[environment]).forEach((indexName) => {
                config.documents[environment][indexName] = []
                const docs = yamlObject.documents[environment][indexName]
                docs.forEach((doc: any) => {
                    if (doc._id && doc.doc) {
                        config.documents[environment][indexName].push({
                            _id: doc._id,
                            doc: doc.doc,
                        })
                    } else {
                        config.documents[environment][indexName].push({doc})
                    }
                })
            })
        })
    }

    return config
}
