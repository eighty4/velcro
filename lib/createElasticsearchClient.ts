import {Client} from '@elastic/elasticsearch'

export interface ElasticsearchOptions {
    client?: Client
}

export function createElasticsearchClient(opts?: ElasticsearchOptions): Client {
    if (opts && opts.client) {
        return opts.client
    }
    return new Client({node: 'http://localhost:9200'})
}
