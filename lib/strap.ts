import {createElasticsearchClient} from './createElasticsearchClient'
import {indexDocuments} from './indexDocuments'
import {initIndex} from './indices'
import {isEmptyString} from './validateFns'
import {parseConfig} from './velcro.config'
import type {Environment} from './velcro.model'

export interface StrapOptions {
    environment?: Environment
}

export async function strap(options: StrapOptions) {
    const config = await parseConfig()
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
