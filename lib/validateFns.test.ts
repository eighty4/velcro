import {isString, isEmptyString, isValidMappingType} from './validateFns'

describe('validateFns', () => {

    describe('isString', () => {

        it('evaluates whether values are strings', () => {
            expect(isString('theory')).toBe(true)
            expect(isString(null)).toBe(false)
            expect(isString(true)).toBe(false)
            expect(isString(undefined)).toBe(false)
            expect(isString(42)).toBe(false)
        })
    })

    describe('isEmptyString', () => {

        it('evaluates whether value is null, undefined, empty string or not a string', () => {
            expect(isEmptyString('theory')).toBe(false)
            expect(isEmptyString(null)).toBe(true)
            expect(isEmptyString(true)).toBe(true)
            expect(isEmptyString(undefined)).toBe(true)
            expect(isEmptyString(42)).toBe(true)
        })
    })

    describe('isValidMappingType', () => {

        it(`evaluates whether a value is 'keyword', 'text', 'date', or 'boolean'`, () => {
            expect(isValidMappingType('keyword')).toBe(true)
            expect(isValidMappingType('text')).toBe(true)
            expect(isValidMappingType('date')).toBe(true)
            expect(isValidMappingType('boolean')).toBe(true)
            expect(isValidMappingType('theory')).toBe(false)
            expect(isValidMappingType(null)).toBe(false)
            expect(isValidMappingType(true)).toBe(false)
            expect(isValidMappingType(undefined)).toBe(false)
            expect(isValidMappingType(42)).toBe(false)
        })
    })
})
