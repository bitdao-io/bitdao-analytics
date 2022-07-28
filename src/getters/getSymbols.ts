import {GetJSON} from './getJSON'

const loadSymbolsURI = 'https://api.bybit.com/v2/public/symbols'

function normalizeSymbol(symbol: string) {
    return symbol.toLocaleLowerCase()
}

export class Symbols {
    inverse: string[]
    usdtPerpetual: string[]
}

export async function GetSymbols(): Promise<Symbols> {
    let inverse: string[] = []
    let usdtPerpetual: string[] = []

    const resp = await GetJSON(loadSymbolsURI)
    resp['result'].forEach((symbol: any) => {
        const quote = normalizeSymbol(symbol['quote_currency'])
        if (quote === 'usdt') {
            usdtPerpetual.push(symbol['name'])
        } else {
            inverse.push(symbol['name'])
        }
    })

    return {
        inverse,
        usdtPerpetual
    }
}
