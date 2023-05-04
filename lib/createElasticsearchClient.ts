import {Client} from '@elastic/elasticsearch'
import type {ClientOptions} from '@elastic/elasticsearch/lib/client'

export type ElasticsearchAuthMethod = 'apiKey' | 'basic' | 'token'

export interface ElasticsearchClientConfig {
    address?: string,
    auth?: ElasticsearchAuthMethod
    tls?: {
        insecure?: boolean
    },
}

export function createElasticsearchClient(config?: ElasticsearchClientConfig): Client {
    return new Client(createElasticsearchClientOptions(config))
}

export function createElasticsearchClientOptions(providedConfig?: ElasticsearchClientConfig): ClientOptions {
    const config: ElasticsearchClientConfig = providedConfig || {address: 'http://localhost:9200'}
    const clientOptions: ClientOptions = {node: resolveNodeAddress(config)}
    if (config.tls?.insecure === true) {
        clientOptions.tls = {rejectUnauthorized: false}
    }
    if (config.auth === 'basic') {
        const {
            VELCRO_ES_USER: username,
            VELCRO_ES_PASSWORD: password,
        } = process.env
        if (!username || !password) {
            throw new Error('--use-basic-auth requires VELCRO_ES_USER and VELCRO_ES_PASSWORD env vars')
        }
        clientOptions.auth = {username, password}
    } else if (config.auth === 'token') {
        let {VELCRO_ES_TOKEN: bearer} = process.env
        if (!bearer) {
            throw new Error('--use-token-auth requires VELCRO_ES_TOKEN env var')
        }
        if (!bearer.startsWith('Bearer ')) {
            bearer = 'Bearer ' + bearer
        }
        clientOptions.auth = {bearer}
    } else if (config.auth === 'apiKey') {
        const {VELCRO_ES_API_KEY: apiKey} = process.env
        if (!apiKey) {
            throw new Error('--use-api-key-auth requires VELCRO_ES_API_KEY env var')
        }
        clientOptions.auth = {apiKey}
    }
    return clientOptions
}

function resolveNodeAddress(config: ElasticsearchClientConfig): string {
    let address = process.env.VELCRO_ES_HOST || config.address
    if (address) {
        if (!(address.startsWith('http://') || address.startsWith('https://'))) {
            address = 'http://' + address
        }
    } else {
        address = 'http://localhost:9200'
    }
    return address
}
