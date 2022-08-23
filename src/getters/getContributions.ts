import {Prices, Symbols, Contribution} from '../models'

import newConfigFromEnv from '../config'

import bent from 'bent'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

const config = newConfigFromEnv()

dayjs.extend(utc)
const newGetJSONRequest = bent('json')

// any call to getJSON should take * ATLEAST 1 second to respond (according to the rules of the api)
const getJSON = (uri: string) => new Promise((resolve, reject) => {
    // control the rate of api reqs by setting a timeout around the req (* leave this out for now - if we start getting throttled...)
   
    // setTimeout(() => {
        try {
            // make and resolve the request
            resolve(newGetJSONRequest(uri))
        } catch(e) {
            reject(e)
        }
    // }) // (...add 1000ms back in here)
})

// ContributionBPS is the bps of trade volume we expect to be contributed.
const ContributionBPS = 0.00025

/*
 * ContributionsShares maps currency symbols to proportion of the contribution
 * they should make up.
 */
const ContributionsShares = {
    eth: 0.5,
    usdt: 0.25,
    usdc: 0.25
}

/*
 * ContributionStartTime is the timestamp that the contribution pledge started.
 * const ContributionStartTime = 1626307200000;
 */

/*
 * ContributionChartLength is the maximum length of the contribution chart
 * stored in S3.
 */
const symbolsURI = `https://api.bybit.com/v2/public/symbols?api_key=${config.bybitApiKey}`

const inverseURI = (symbol: string, from: number): string => `https://api.bybit.com/v2/public/kline/list?interval=D&limit=1&symbol=${symbol}&from=${from}&api_key=${config.bybitApiKey}`

const usdtPerpetualsURI = (symbol: string, from: number): string => `https://api.bybit.com/public/linear/kline?interval=D&limit=1&symbol=${symbol}&from=${from}&api_key=${config.bybitApiKey}`

function formatContribution(
    prices: Prices,
    tradeVolumeInUSD: number,
    timestamp: number
): Contribution {
    // const contributionVolumeInUSD = prices.btc * tradeVolumeInUSD * ContributionBPS;
    const contributionVolumeInUSD = tradeVolumeInUSD * ContributionBPS

    const ethAmount = contributionVolumeInUSD * ContributionsShares.eth
    const ethCount = ethAmount / prices.eth

    const usdtAmount = contributionVolumeInUSD * ContributionsShares.usdt
    const usdcAmount = contributionVolumeInUSD * ContributionsShares.usdc

    return {
        date: dayjs.utc(timestamp * 1000).format('YYYY-MM-DD'),
        ethPrice: parseFloat(prices.eth.toFixed(2)),

        tradeVolume: parseFloat(tradeVolumeInUSD.toFixed(0)),
        contributeVolume: parseFloat(contributionVolumeInUSD.toFixed(0)),

        ethAmount: parseFloat(ethAmount.toFixed(2)),
        ethCount: parseFloat(ethCount.toFixed(2)),
        usdtAmount: parseFloat(usdtAmount.toFixed(0)),
        usdtCount: parseFloat(usdtAmount.toFixed(0)),
        usdcAmount: parseFloat(usdcAmount.toFixed(0)),
        usdcCount: parseFloat(usdcAmount.toFixed(0))
    }
}

function normalizeSymbol(symbol: string) {
    return symbol.toLocaleLowerCase()
}

async function getPrices(coinID: string, from: number, to: number) {
    const json = await getJSON(
        `https://api.coingecko.com/api/v3/coins/${coinID}/market_chart/range?vs_currency=usd&from=${from}&to=${to}`
    ) as { prices: number[][] }
    
    return json.prices.map((price: number[]) => price[1] || 0)
}

async function loadDaysPrice(coinID: string, timestamp: number) {
    return (await getPrices(coinID, timestamp, timestamp + 86400))[0]
}

async function getSymbols(): Promise<Symbols> {
    const req = getJSON(symbolsURI) as Promise<{ result: {quote_currency: string, name: string}[]}>
    const inverse: string[] = []
    const usdtPerpetual: string[] = []

    req.catch(() => ({}))

    ;(await req).result.forEach((symbol) => {        
        const quote = normalizeSymbol(symbol.quote_currency)
        if (quote === 'usdt') {
            usdtPerpetual.push(symbol.name)
        } else {
            inverse.push(symbol.name)
        }
    })

    return {
        inverse,
        usdtPerpetual
    }
}

async function loadVolume(symbols: string[], symbolType: string, from: number) {
    let volume = 0;
    for(const symbol of symbols) {
        // Get endpoint for this symbol type
        let uri = inverseURI(symbol, from)
        if (symbolType === 'perp') {
            uri = usdtPerpetualsURI(symbol, from)
        }

        const req = getJSON(uri) as Promise<{ result: {volume: string, turnover: string, open_time: number}[]}>

        // Load the data
        const body = (await req).result
        if (!body || !body.length) {
            return volume
        }

        // Grab the volume based on the symbol type
        const innerBody = body[0]
        let _volume = parseFloat(innerBody.volume)
        if (symbolType === 'perp') {
            _volume = parseFloat(innerBody.turnover)
        }

        if (innerBody.open_time < from || innerBody.open_time > from + 86400) {
            return volume
        }

        // Accumulate the volume
        volume = volume + _volume
    }

    return volume
}

async function loadVolumeForTimestamp(timestamp: number, symbols: Symbols) {
    const inverseVolume = await loadVolume(symbols.inverse, 'inverse', timestamp)
    const perpVolume = await loadVolume(symbols.usdtPerpetual, 'perp', timestamp)
    return inverseVolume + perpVolume
}

// ensures we definitely collect a result here
async function _retryIfError(
    method: (_symbols: Symbols, _startDate: dayjs.Dayjs) => Promise<Contribution[]>, 
    params: {symbols: Symbols, startDate: dayjs.Dayjs}
) {
    let keepTrying = false;
    let contributions: Contribution[] = [];
    do {
        try {
            // attempt to get the results for the given day
            contributions = await method(params.symbols, params.startDate)
            // got result break
            keepTrying = false;
        } catch {
            // no result yet - keep trying
            keepTrying = true;
        }
    } while (keepTrying)

    return contributions
}

// get contributions for the given day and return load volumes
async function _getContributionsOnDate(symbols: Symbols, startDate: dayjs.Dayjs) {
    // all results will be stored in this array
    const contributions: Contribution[] = []
    
    // given date to unix ts
    const ts = startDate.unix()

    const volume = await loadVolumeForTimestamp(ts, symbols)
    const btc = await loadDaysPrice('bitcoin', ts)
    const eth = await loadDaysPrice('ethereum', ts)

    contributions.push(
        formatContribution(
            {
                btc,
                eth
            },
            volume,
            ts
        )
    )
    
    return contributions
}

// get only the contributions for given date (YYY/MM/DD format)...
export default async function getContributions(date: string) {
    // get all symbols
    const symbols = await getSymbols()
    
    // get start of today in utc
    const givenDate = dayjs.utc(date, "YYYY/MM/DD").startOf('day')

    // get contributions for the given date
    return _retryIfError(_getContributionsOnDate, { symbols,  startDate: givenDate})
}
