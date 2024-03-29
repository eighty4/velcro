import type {ArgumentsCamelCase} from 'yargs'
import yargs from 'yargs/yargs'
import {hideBin} from 'yargs/helpers'

import {ConsoleLogger} from './logger'
import {type Config, normalizeConfigPath, readConfig} from './velcro.config'
import type {StrapOptions} from './velcro.strap'
import type {ElasticsearchAuthMethod, ElasticsearchClientConfig} from './es.client'

export class VelcroCLI {

    constructor(private readonly commands: VelcroCommands) {
    }

    get yargs() {
        return yargs(hideBin(process.argv))
            .options({
                'node-address': {
                    describe: 'set Elasticsearch node address with protocol, hostname and port',
                },
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
                    'config-file': {
                        describe: 'path to velcro yml config file',
                        default: 'velcro.yaml',
                        configParser: normalizeConfigPath as any,
                        array: false,
                    },
                }),
                handler: async (args) => {
                    await this.commands.strapCommand({
                        configFile: args.configFile as string,
                        elasticsearch: createElasticsearchClientConfig(args),
                        environment: args.environment as string,
                        logger: new ConsoleLogger(),
                    })
                },
            })
            .command('$0', 'the default command', {}, () => {
                this.commands.defaultCommand()
            })
            .strict()
    }

    static initialize(): VelcroCLI {
        return new VelcroCLI(new VelcroCommandDispatch())
    }

    async execute(): Promise<void> {
        await this.yargs.parseAsync()
    }
}

export interface VelcroCommands {
    defaultCommand(): Promise<void> | void

    strapCommand(options: StrapOptions): Promise<void> | void
}

class VelcroCommandDispatch implements VelcroCommands {
    defaultCommand(): void {
        console.log('run `velcro strap` or `velcro strap --help` to get started')
    }

    async strapCommand(options: StrapOptions): Promise<void> {
        const {strap} = await import('./velcro.strap')
        try {
            const config = await getConfigFromVelcroYaml(options.configFile)
            await strap(config, options)
        } catch (e: any) {
            console.log('velcro strap error:', e.message)
            process.exit(1)
        }
    }
}

function createElasticsearchClientConfig(args: ArgumentsCamelCase): ElasticsearchClientConfig {
    let address: string | undefined
    let auth: ElasticsearchAuthMethod | undefined
    if (typeof args['node-address'] === 'string') {
        address = args['node-address']
    }
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
        address,
        auth,
        tls: {
            insecure: isArgTrueBool(args['skip-tls-verify']),
        },
    }
}

function isArgTrueBool(arg: any): boolean {
    return arg === true || arg === 'true'
}

async function getConfigFromVelcroYaml(configFile: string): Promise<Config> {
    let config: Config | null = null
    let error: string | null = null
    try {
        config = await readConfig(configFile)
    } catch (e: any) {
        error = e.message
    }
    if (!config && !error) {
        error = 'velcro.yaml not found ' + (configFile === 'velcro.yaml' ? 'in cwd' : 'at ' + configFile)
    }
    if (error) {
        console.log(`unable to read velcro config: ${error}`)
        process.exit(1)
    } else {
        return config as Config
    }
}
