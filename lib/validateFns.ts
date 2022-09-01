export function isString(maybe?: any): boolean {
    return typeof maybe === 'string' || maybe instanceof String
}

export function isEmptyString(maybe?: any): boolean {
    return !isString(maybe) || !maybe.length
}

export function isValidMappingType(maybe?: any): boolean {
    return !isEmptyString(maybe) && (
        maybe === 'keyword' || maybe === 'text' || maybe === 'date' || maybe === 'boolean'
    )
}
