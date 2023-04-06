import {readFile} from 'fs/promises'
import {join as joinPath} from 'path'
import {parse as parseYaml} from 'yaml'

import type {DocumentsConfig, Index, IndexName} from './velcro.model'

export interface Config {
    indices: Record<IndexName, Index>
    documents: DocumentsConfig
}

async function readConfigFileContent(configPath?: string): Promise<string> {
    if (!configPath) {
        configPath = process.cwd()
    }
    if (!configPath.endsWith('velcro.yaml')) {
        configPath = joinPath(configPath, 'velcro.yaml')
    }
    try {
        const yamlBuffer = await readFile(configPath)
        return yamlBuffer.toString('utf-8')
    } catch (e) {
        if (e.code && e.code === 'ENOENT') {
            console.log('no velcro.yaml found in cwd')
        } else {
            console.log(`error reading velcro.yaml: ${e.message}`)
        }
        process.exit(1)
    }
}

export async function parseConfig(configPath?: string): Promise<Config> {
    const yamlString = await readConfigFileContent(configPath)
    let yamlObject
    try {
        yamlObject = parseYaml(yamlString)
    } catch (e) {
        console.log(`error parsing yaml from velcro.yaml: ${e.message}`)
        process.exit(1)
    }
    const config: Config = {
        indices: {},
        documents: {},
    }
    if (yamlObject.indices) {
        Object.keys(yamlObject.indices).forEach((indexName) => {
            const index = yamlObject.indices[indexName]
            if (index.properties) {
                const properties = {}
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
                docs.forEach((doc) => {
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
