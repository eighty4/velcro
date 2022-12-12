import {Client} from '@elastic/elasticsearch'

export function createElasticsearchClient(): Client {
    // todo parameterize bin to configure es client
    return new Client({node: 'http://localhost:9200'})
}
