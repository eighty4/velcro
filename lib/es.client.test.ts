import {createElasticsearchClient, createElasticsearchClientOptions} from './es.client'
import type {Logger} from './logger'

describe('createElasticsearchClientOptions', () => {

    beforeEach(() => {
        delete process.env.VELCRO_ES_HOST
        delete process.env.VELCRO_ES_SKIP_TLS_VERIFY
        delete process.env.VELCRO_ES_AUTH
        delete process.env.VELCRO_ES_USER
        delete process.env.VELCRO_ES_PASSWORD
        delete process.env.VELCRO_ES_TOKEN
        delete process.env.VELCRO_ES_API_KEY
    })

    it('creates client and logs address', () => {
        const logger: Logger = {log: jest.fn()}
        const client = createElasticsearchClient({}, logger)
        expect(client).toBeDefined()
        expect(logger.log).toHaveBeenCalledWith('elasticsearch client configured for', 'http://localhost:9200')
    })

    it('prepends http when address protocol missing', () => {
        const clientOptions = createElasticsearchClientOptions({address: '127.0.0.1:9200'})
        expect(clientOptions.node).toBe('http://127.0.0.1:9200')
    })

    it('handles https prefix with boolean logic', () => {
        const clientOptions = createElasticsearchClientOptions({address: 'https://127.0.0.1:9200'})
        expect(clientOptions.node).toBe('https://127.0.0.1:9200')
    })

    it('defaults to localhost when address missing', () => {
        const clientOptions = createElasticsearchClientOptions({})
        expect(clientOptions.node).toBe('http://localhost:9200')
    })

    it('defaults to localhost when config undefined', () => {
        const clientOptions = createElasticsearchClientOptions()
        expect(clientOptions.node).toBe('http://localhost:9200')
    })

    it('env variable overrides default node address without config object', () => {
        process.env.VELCRO_ES_HOST = 'http://prod.elasticsearch'
        const clientOptions = createElasticsearchClientOptions()
        expect(clientOptions.node).toBe('http://prod.elasticsearch')
    })

    it('env variable overrides config object node address', () => {
        process.env.VELCRO_ES_HOST = 'http://prod.elasticsearch'
        const clientOptions = createElasticsearchClientOptions({address: 'http://dev.elasticsearch'})
        expect(clientOptions.node).toBe('http://prod.elasticsearch')
    })

    it('basic auth throws error when user env var missing', () => {
        expect(() => createElasticsearchClientOptions({auth: 'basic'}))
            .toThrow('--use-basic-auth requires VELCRO_ES_USER and VELCRO_ES_PASSWORD env vars')
    })

    it('basic auth throws error when password env var missing', () => {
        expect(() => createElasticsearchClientOptions({auth: 'basic'}))
            .toThrow('--use-basic-auth requires VELCRO_ES_USER and VELCRO_ES_PASSWORD env vars')
    })

    it('basic auth happy path', () => {
        process.env.VELCRO_ES_USER = 'user'
        process.env.VELCRO_ES_PASSWORD = 'password'
        expect(createElasticsearchClientOptions({auth: 'basic'}).auth).toStrictEqual({
            username: 'user',
            password: 'password',
        })
    })

    it('token auth throws error when token env var missing', () => {
        expect(() => createElasticsearchClientOptions({auth: 'token'}))
            .toThrow('--use-token-auth requires VELCRO_ES_TOKEN env var')
    })

    it('token auth prepends Bearer prefix', () => {
        process.env.VELCRO_ES_TOKEN = 'token'
        expect(createElasticsearchClientOptions({auth: 'token'}).auth).toStrictEqual({bearer: 'Bearer token'})
    })

    it('env variable overrides config object', () => {
        process.env.VELCRO_ES_AUTH = 'apiKey'
        process.env.VELCRO_ES_API_KEY = 'api key'
        process.env.VELCRO_ES_TOKEN = 'token'
        expect(createElasticsearchClientOptions({auth: 'token'}).auth).toStrictEqual({apiKey: 'api key'})
    })

    it('token auth happy path', () => {
        process.env.VELCRO_ES_TOKEN = 'Bearer token'
        expect((createElasticsearchClientOptions({auth: 'token'}).auth)).toStrictEqual({bearer: 'Bearer token'})
    })

    it('api key auth throws error when api key env var missing', () => {
        expect(() => createElasticsearchClientOptions({auth: 'apiKey'}))
            .toThrow('--use-api-key-auth requires VELCRO_ES_API_KEY env var')
    })

    it('api key auth happy path', () => {
        process.env.VELCRO_ES_API_KEY = 'api key'
        expect(createElasticsearchClientOptions({auth: 'apiKey'}).auth).toStrictEqual({apiKey: 'api key'})
    })

    it('insecure tls', () => {
        expect(createElasticsearchClientOptions({tls: {insecure: true}}).tls?.rejectUnauthorized).toBe(false)
        expect(createElasticsearchClientOptions({tls: {insecure: false}}).tls).toBeUndefined()
        expect(createElasticsearchClientOptions({tls: {}}).tls).toBeUndefined()
        expect(createElasticsearchClientOptions({}).tls).toBeUndefined()

        process.env.VELCRO_ES_SKIP_TLS_VERIFY = 'false'
        expect(createElasticsearchClientOptions({tls: {insecure: true}}).tls?.rejectUnauthorized).toBeUndefined()

        process.env.VELCRO_ES_SKIP_TLS_VERIFY = 'true'
        expect(createElasticsearchClientOptions({tls: {insecure: true}}).tls?.rejectUnauthorized).toBe(false)
    })

    it('env var overrides enabled skipping tls verify config', () => {
        process.env.VELCRO_ES_SKIP_TLS_VERIFY = 'false'
        expect(createElasticsearchClientOptions({tls: {insecure: true}}).tls?.rejectUnauthorized).toBeUndefined()
    })

    it('env var override enables skipping tls verify config', () => {
        process.env.VELCRO_ES_SKIP_TLS_VERIFY = 'true'
        expect(createElasticsearchClientOptions({tls: {insecure: false}}).tls?.rejectUnauthorized).toBe(false)
    })

})
