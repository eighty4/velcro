function randomString(length: number): string {
    if (typeof length === 'undefined') {
        throw new Error('must provide length')
    }
    const letters = 'abcdefghijklmnopqrstuvwxyz'
    let str = ''
    for (let i = 0; i < length; i++) {
        str += letters.charAt(Math.floor(Math.random() * 26))
    }
    return str
}

export type ManagedTestIndexNameFn = (indexName: string) => string

export function defaultManagedTestIndexNameFn(indexName: string): string {
    return `test-${indexName}-${randomString(4)}`
}
