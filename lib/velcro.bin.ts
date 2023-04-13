import yargs from 'yargs/yargs'
import {hideBin} from 'yargs/helpers'

import {type Config, readConfig} from './velcro.config'
import {type StrapOptions} from './velcro.strap'

yargs(hideBin(process.argv))
    .command({
        command: 'strap',
        aliases: ['bootstrap', 'init'],
        describe: 'initialize Elasticsearch with index mappings and documents',
        builder: (y) => y.options({
            environment: {alias: 'env', describe: 'environment to initialize'},
        }),
        handler: async (args) => executeStrapCommand({environment: args.environment as string}),
    })
    .argv

async function executeStrapCommand(options: StrapOptions): Promise<void> {
    const {strap} = await import('./velcro.strap')
    try {
        const result = await strap(await getConfigFromCwd(), options)
        console.log(`created ${result.created.indices.length} ${result.created.indices.length === 1 ? 'index' : 'indices'} and ${Object.keys(result.created.documents).length} document${Object.keys(result.created.documents).length === 1 ? '' : 's'}`)
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
