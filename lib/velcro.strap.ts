import {createElasticsearchClient} from './createElasticsearchClient'
import {indexDocuments} from './indexDocuments'
import {initIndex} from './indices'
import {isEmptyString} from './validateFns'
import {Config, parseConfig} from './velcro.config'
import type {Environment} from './velcro.model'

export interface StrapOptions {
    environment?: Environment
}

export async function strap(options: StrapOptions) {
    const config = await getConfigFromCwd()
    const es = createElasticsearchClient()

    if (!isEmptyString(options.environment) && !config.documents[options.environment]) {
        console.log(`velcro strap ran for env ${options.environment} but there is no ${options.environment} config`)
        process.exit(1)
    }

    for (const indexName in config.indices) {
        const index = config.indices[indexName]
        console.log('init', index.name)
        await initIndex(es, index)
    }

    let created = 0
    if (config.documents['all']) {
        created += (await indexDocuments(es, config.documents['all'])).count
    }
    if (options.environment) {
        created += (await indexDocuments(es, config.documents[options.environment])).count
    }
    console.log(`created ${created} document${created === 1 ? '' : 's'}`)

    console.log('finished')
}

async function getConfigFromCwd(): Promise<Config> {
    let config: Config | null = null
    let error: string | null = null
    try {
        config = await parseConfig()
    } catch (e) {
        error = e.message
    }
    if (!config && !error) {
        error = 'velcro.yaml not found in cwd'
    }
    if (error) {
        console.log(`unable to read velcro config: ${error}`)
        process.exit(1)
    } else {
        return config
    }
}
