const {tokens} = require('../constants.ts')
const rp = require('request-promise')
import {Token} from '../models'

function coingeckoOptions(path: string, otherQs: any) {
    let opts: any = {
        method: 'GET',
        uri: 'https://api.coingecko.com/api/v3/simple/' + path,
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

async function getEthPrice() {
    return rp(coingeckoOptions('price', {ids: 'ethereum'})).then(
        (resp: any) => {
            return resp.ethereum.usd.toFixed(2)
        }
    )
}

async function getTokenPrice(addr: string) {
    const opts = coingeckoOptions('token_price/ethereum', {
        contract_addresses: addr
    })
    return rp(opts).then((resp: any) => {
        const tokenJson = resp[addr.toLocaleLowerCase()]
        return tokenJson.usd.toFixed(2)
    })
}

export async function getPrices() {
    const handleError = (err: any) => {
        console.log('Coingecko call error:', err.message)
        return 0
    }

    let prices: any = {ETH: await getEthPrice().catch(handleError)}

    await Promise.all(
        tokens.map(async (token: Token) => {
            if (token.address) {
                prices[token.symbol] = await getTokenPrice(token.address).catch(
                    handleError
                )
            }
        })
    )

    return prices
}

export default {getPrices}
