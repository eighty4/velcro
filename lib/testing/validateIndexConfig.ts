import type {Index} from '../strap'
import {isEmptyString, isValidMappingType} from '../validateFns'

export default function validateIndexConfig(index: Index): void {
    if (!index) {
        throw new Error('not an object')
    }
    if (isEmptyString(index.name)) {
        throw new Error('no index name')
    }
    if (index.properties) {
        for (const mappingName in index.properties) {
            if (isEmptyString(mappingName)) {
                throw new Error()
            }
            const mappingType = index.properties[mappingName]
            if (!isValidMappingType(mappingType)) {
                throw new Error(`${index.name} mapping ${mappingName} type ${mappingType} is not valid`)
            }
        }
    }
}
