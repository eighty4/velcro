import {Client} from '@elastic/elasticsearch'
import type {ClientOptions} from '@elastic/elasticsearch/lib/client'
import type {ConnectionOptions} from 'tls'

export type ElasticsearchAuthMethod = 'apiKey' | 'basic' | 'token'

export type ElasticsearchAuth = { apiKey: string } | { bearer: string } | { username: string; password: string }

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
    return {
        auth: resolveAuth(config),
        node: resolveNodeAddress(config),
        tls: resolveConnectionOptions(config),
    }
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

function resolveAuth(config: ElasticsearchClientConfig): ElasticsearchAuth | undefined {
    switch (process.env.VELCRO_ES_AUTH || config.auth) {
        case 'apiKey':
            const {VELCRO_ES_API_KEY: apiKey} = process.env
            if (!apiKey) {
                throw new Error('--use-api-key-auth requires VELCRO_ES_API_KEY env var')
            }
            return {apiKey}
        case 'basic':
            const {
                VELCRO_ES_USER: username,
                VELCRO_ES_PASSWORD: password,
            } = process.env
            if (!username || !password) {
                throw new Error('--use-basic-auth requires VELCRO_ES_USER and VELCRO_ES_PASSWORD env vars')
            }
            return {username, password}
        case 'token':
            let {VELCRO_ES_TOKEN: bearer} = process.env
            if (!bearer) {
                throw new Error('--use-token-auth requires VELCRO_ES_TOKEN env var')
            }
            if (!bearer.startsWith('Bearer ')) {
                bearer = 'Bearer ' + bearer
            }
            return {bearer}
    }
}

function resolveConnectionOptions(config: ElasticsearchClientConfig): ConnectionOptions | undefined {
    const {VELCRO_ES_SKIP_TLS_VERIFY: envVar} = process.env
    if (envVar === 'true' || (config.tls?.insecure === true && envVar !== 'false')) {
        return {rejectUnauthorized: false}
    }
}
