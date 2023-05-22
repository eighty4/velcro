import {Client} from '@elastic/elasticsearch'
import type {ClientOptions} from '@elastic/elasticsearch/lib/client'
import type {ConnectionOptions} from 'tls'
import type {Logger} from './logger'

export type ElasticsearchAuthMethod = 'apiKey' | 'basic' | 'token'

export type ElasticsearchAuth = { apiKey: string } | { bearer: string } | { username: string; password: string }

export interface ElasticsearchClientConfig {
    address?: string,
    auth?: ElasticsearchAuthMethod
    tls?: {
        insecure?: boolean
    },
}

export function createElasticsearchClient(config?: ElasticsearchClientConfig, logger?: Logger): Client {
    const clientOptions = createElasticsearchClientOptions(config)
    if (logger) {
        logger.log('elasticsearch client will connect to', clientOptions.node)
    }
    return new Client(clientOptions)
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
    const {
        VELCRO_ES_API_KEY: apiKey,
        VELCRO_ES_USER: username,
        VELCRO_ES_PASSWORD: password,
        VELCRO_ES_TOKEN: bearer,
    } = process.env
    switch (process.env.VELCRO_ES_AUTH || config.auth) {
        case 'apiKey':
            if (!apiKey) {
                throw new Error('--use-api-key-auth requires VELCRO_ES_API_KEY env var')
            }
            return {apiKey}
        case 'basic':
            if (!username || !password) {
                throw new Error('--use-basic-auth requires VELCRO_ES_USER and VELCRO_ES_PASSWORD env vars')
            }
            return {username, password}
        case 'token':
            if (!bearer) {
                throw new Error('--use-token-auth requires VELCRO_ES_TOKEN env var')
            }
            return {bearer: bearer.startsWith('Bearer ') ? bearer : 'Bearer ' + bearer}
    }
}

function resolveConnectionOptions(config: ElasticsearchClientConfig): ConnectionOptions | undefined {
    const {VELCRO_ES_SKIP_TLS_VERIFY: envVar} = process.env
    if (envVar === 'true' || (config.tls?.insecure === true && envVar !== 'false')) {
        return {rejectUnauthorized: false}
    }
}
