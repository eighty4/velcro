import type {Logger} from './logger'
import {strap, type StrapOptions} from './velcro.strap'
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
documents:
  all:
    ${indexName}:
      - test-bool: true
        test-date: 2022-09-04T22:00:00.000Z
        test-keyword: keys
        test-text: texts
  dev:
    ${indexName}:
      - test-bool: true
        test-date: 2022-09-04T22:00:00.000Z
        test-keyword: keys
        test-text: texts
`) as Config

        const logger: Logger = {log: jest.fn()}
        const options: StrapOptions = {configFile: 'velcro.yaml', environment: 'dev', logger: logger}
        const result = await strap(config, options)
        expect(result.created.indices).toHaveLength(1)
        expect(result.created.indices[0].name).toBe(indexName)
        expect(Object.keys(result.created.documents)).toHaveLength(1)
        expect(result.created.documents[indexName]).toHaveLength(2)
        expect(await getIndexMappingProperties(indexName)).toEqual({
            'test-bool': {type: 'boolean'},
            'test-date': {type: 'date'},
            'test-keyword': {type: 'keyword'},
            'test-text': {type: 'text'},
        })
        expect(logger.log).toHaveBeenCalledTimes(4)
        expect(logger.log).toHaveBeenNthCalledWith(1, 'elasticsearch client will connect to', 'http://localhost:9200')
        expect(logger.log).toHaveBeenNthCalledWith(2, 'created index', indexName)
        expect(logger.log).toHaveBeenNthCalledWith(3, 'indexing docs for environment', 'dev')
        expect(logger.log).toHaveBeenNthCalledWith(4, 'created', '1 index', 'and', '2 documents')
    })
})

async function getIndexMappingProperties(indexName: string) {
    const response = await fetch(`http://localhost:9200/${indexName}/_mapping`).then(r => r.json())
    return response[indexName].mappings.properties
}
