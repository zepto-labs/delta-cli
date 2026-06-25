export const INVALIDATE_CACHE = {
    ALL: 'ALL',
    CHECK_UPDATE: 'CHECK_UPDATE',
    GET_REGISTRY: 'GET_REGISTRY',
    RELEASE_LIST: 'RELEASE_LIST',
}

// Convert object key in a type
export type INVALIDATE_CACHE_TYPE = (typeof INVALIDATE_CACHE)[keyof typeof INVALIDATE_CACHE]
