import {createElasticsearchClient} from './es.client'
import {initIndex} from './es.indices'
import {defaultManagedTestIndexNameFn} from './testing/createVelcroTestStrap'
import {indexDocument, indexDocuments} from './es.documents'

describe('es.documents.ts', () => {

    describe('indexDocument()', () => {

        it('works', async () => {
            const es = createElasticsearchClient()
            const index = defaultManagedTestIndexNameFn('test-index-doc')
            await initIndex(es, {
                name: index,
                properties: {
                    tweet: 'text',
                },
            })
            const doc = {tweet: 'foobar'}
            const id = await indexDocument(es, index, {doc})
            const result = await es.get({index, id})
            expect(result.found).toBe(true)
            expect(result._source).toStrictEqual(doc)
            await es.indices.delete({index})
        })
    })

    describe('indexDocuments()', () => {

        it('works', async () => {
            const es = createElasticsearchClient()
            const index1 = defaultManagedTestIndexNameFn('test-index-docs')
            const index2 = defaultManagedTestIndexNameFn('test-index-docs')
            await initIndex(es, {
                name: index1,
                properties: {
                    tweet: 'text',
                },
            })
            await initIndex(es, {
                name: index2,
                properties: {
                    tweet: 'text',
                },
            })
            const ids = await indexDocuments(es, {
                [index1]: [{doc: {tweet: 'foo'}}],
                [index2]: [{doc: {tweet: 'bar'}}],
            })
            expect(ids.count).toBe(2)
            const result1 = await es.get({index: index1, id: ids.documentIds[index1][0]})
            expect(result1.found).toBe(true)
            expect(result1._source).toStrictEqual({tweet: 'foo'})
            const result2 = await es.get({index: index2, id: ids.documentIds[index2][0]})
            expect(result2.found).toBe(true)
            expect(result2._source).toStrictEqual({tweet: 'bar'})
            await es.indices.delete({index: index1})
            await es.indices.delete({index: index2})
        })
    })
})
