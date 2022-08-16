import {
    GetJSON
} from "./getJSON";

const {tokens} = require('../constants.ts')
const rp = require('request-promise')
import {Token} from '../models'

function buildURI(path: string, otherQs: any) {
    let opts: any = {
        method: 'GET',
        uri: `https://api.coingecko.com/api/v3/simple/${path}`,
        qs: {
            vs_currencies: 'USD'
        },
        json: true,
        gzip: true
    }

    for (let key in otherQs) {
        opts.qs[key] = otherQs[key]
    }

    return opts
}

const buildHistoricURI = (coinID: string, time: number): string => {
    const end = time + 86400
    return `https://api.coingecko.com/api/v3/coins/${coinID}/market_chart/range?vs_currency=usd&from=${time}&to=${end}`
}

async function getCoinPrice(coin: string): Promise<number> {
    const resp = await rp(buildURI('price', {ids: coin}))
    return resp[coin].usd.toFixed(2)
}

export async function GetETHPrice(): Promise<number> {
    return getCoinPrice('ethereum')
}

export async function GetBTCPrice(): Promise<number> {
    return getCoinPrice('bitcoin')
}

export async function GetTokenPrice(addr: string): Promise<number> {
    const resp = await rp(
        buildURI('token_price/ethereum', {
            contract_addresses: addr
        })
    )
    return resp[addr.toLocaleLowerCase()].usd.toFixed(2)
}

export async function GetHistoricETHPrice(time : number): Promise<number> {
    let json = await GetJSON(buildHistoricURI('ethereum', time))
    return json['prices'].map((price: any) => price[1])[0]
}


export async function GetAllPrices() {
    let prices: Record<string, number> = {}

    // Start loading prices
    const getBTC = GetBTCPrice()
    const getETH = GetETHPrice()
    const getTokens = tokens.map(async (token: Token) => {
        if (token.address) {
            prices[token.symbol] = await GetTokenPrice(token.address)
        }
    })

    // Wait for all prices to resolve
    await Promise.all(getTokens)
    prices.BTC = await getBTC
    prices.ETH = await getETH

    return prices
}
