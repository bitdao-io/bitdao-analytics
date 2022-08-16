import bent from 'bent'

const newGetJSONRequest = bent('json')

export function GetJSON(uri: string): Promise<any> {
    let req = newGetJSONRequest(uri)
    req.catch(() => {})
    return req
}
