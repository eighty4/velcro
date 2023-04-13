import {strap} from './velcro.strap'
import {type Config, parseConfig} from './velcro.config'
import {defaultManagedTestIndexNameFn} from './testing/createVelcroTestStrap'

describe('velcro.strap', () => {

    it('bootstraps indices', async () => {
        const indexName = defaultManagedTestIndexNameFn('strap')
        const config = await parseConfig(`
---
indices:
  ${indexName}:
    properties:
      test-bool: boolean
      test-date: date
      test-keyword: keyword
      test-text: text
`) as Config

        const result = await strap(config, {})
        expect(result.created.indices[0].name).toBe(indexName)
        expect(await getIndexMappingProperties(indexName)).toEqual({
            'test-bool': {type: 'boolean'},
            'test-date': {type: 'date'},
            'test-keyword': {type: 'keyword'},
            'test-text': {type: 'text'},
        })
    })
})

async function getIndexMappingProperties(indexName: string) {
    const response = await fetch(`http://localhost:9200/${indexName}/_mapping`).then(r => r.json())
    return response[indexName].mappings.properties
}
