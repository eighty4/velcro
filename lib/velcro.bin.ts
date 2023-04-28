import type {ArgumentsCamelCase} from 'yargs'
import yargs from 'yargs/yargs'
import {hideBin} from 'yargs/helpers'

import {type Config, readConfig} from './velcro.config'
import type {StrapOptions} from './velcro.strap'
import type {ElasticsearchAuthMethod, ElasticsearchClientConfig} from './createElasticsearchClient'

yargs(hideBin(process.argv))
    .options({
        'skip-tls-verify': {
            describe: 'create an insecure tls connection to Elasticsearch',
        },
        'use-api-key-auth': {
            describe: 'use VELCRO_ES_API_KEY to authenticate with api key',
            conflicts: ['use-basic-auth', 'use-token-auth'],
        },
        'use-basic-auth': {
            describe: 'use VELCRO_ES_USER and VELCRO_ES_PASSWORD to authenticate with username and password',
            conflicts: ['use-api-key-auth', 'use-token-auth'],
        },
        'use-token-auth': {
            describe: 'use VELCRO_ES_TOKEN to authenticate with a bearer token',
            conflicts: ['use-api-key-auth', 'use-basic-auth'],
        },
    })
    .command({
        command: 'strap',
        aliases: ['bootstrap', 'init'],
        describe: 'initialize Elasticsearch with index mappings and documents',
        builder: (y) => y.options({
            environment: {alias: 'env', describe: 'environment to initialize'},
        }),
        handler: async (args) => executeStrapCommand({
            elasticsearch: createElasticsearchClientConfig(args),
            environment: args.environment as string,
        }),
    })
    .strict()
    .argv

function createElasticsearchClientConfig(args: ArgumentsCamelCase): ElasticsearchClientConfig {
    const isArgTrueBool: (arg: any) => boolean = arg => arg === true || arg === 'true'
    let auth: ElasticsearchAuthMethod | undefined
    if (isArgTrueBool(args['use-api-key-auth'])) {
        auth = 'apiKey'
    }
    if (isArgTrueBool(args['use-basic-auth'])) {
        auth = 'basic'
    }
    if (isArgTrueBool(args['use-token-auth'])) {
        auth = 'token'
    }
    return {
        tls: {
            insecure: isArgTrueBool(args['skip-tls-verify']),
        },
        auth,
    }
}

async function executeStrapCommand(options: StrapOptions): Promise<void> {
    const {strap} = await import('./velcro.strap')
    try {
        const result = await strap(await getConfigFromCwd(), options)
        const indicesStatus = `created ${result.created.indices.length} ${result.created.indices.length === 1 ? 'index' : 'indices'}`
        const documentsStatus = `${Object.keys(result.created.documents).length} document${Object.keys(result.created.documents).length === 1 ? '' : 's'}`
        console.log(`${indicesStatus} and ${documentsStatus}`)
        result.created.indices.length
    } catch (e: any) {
        console.log('velcro strap error:', e.message)
        process.exit(1)
    }
}

async function getConfigFromCwd(): Promise<Config> {
    let config: Config | null = null
    let error: string | null = null
    try {
        config = await readConfig()
    } catch (e: any) {
        error = e.message
    }
    if (!config && !error) {
        error = 'velcro.yaml not found in cwd'
    }
    if (error) {
        console.log(`unable to read velcro config: ${error}`)
        process.exit(1)
    } else {
        return config as Config
    }
}
