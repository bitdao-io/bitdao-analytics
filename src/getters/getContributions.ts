import {Prices, Symbols, Contribution} from '../models'

import newConfigFromEnv from '../config'

import bent from 'bent'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

const config = newConfigFromEnv()

dayjs.extend(utc)
const newGetJSONRequest = bent('json')

// any call to getJSON should take ATLEAST 1 second to respond
const getJSON = (uri: string) => new Promise((resolve, reject) => {
    // control the rate of api reqs by setting a timeout around the req (these this out for now)
    setTimeout(() => {
        try {
            // make and resolve the request
            resolve(newGetJSONRequest(uri))
        } catch(e) {
            reject(e)
        }
    })
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
    )
    return json.prices.map((price: any) => price[1])
}

async function loadDaysPrice(coinID: string, timestamp: number) {
    return (await getPrices(coinID, timestamp, timestamp + 86400))[0]
}

async function getSymbols(): Promise<Symbols> {
    const req = getJSON(symbolsURI)
    const inverse: string[] = []
    const usdtPerpetual: string[] = []

    req.catch((error) => {})

    ;(await req).result.forEach((symbol: any) => {        
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

        const req = getJSON(uri)

        // Load the data
        let body = (await req).result
        if (!body || !body.length) {
            return volume
        }

        // Grab the volume based on the symbol type
        body = body[0]
        let _volume = parseFloat(body.volume)
        if (symbolType === 'perp') {
            _volume = parseFloat(body.turnover)
        }

        if (body.open_time < from || body.open_time > from + 86400) {
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

 
// get contributions for each day in the set
async function getContributionsOnDay(symbols: Symbols, startDate: dayjs.Dayjs) {
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

// ensures we definitely collect a result here
async function retryForContributionsOnDay(symbols: Symbols, startDate: dayjs.Dayjs) {
    let keepTrying = false;
    let contributions: Contribution[] = [];
    do {
        try {
            // attempt to get the results for the given day
            contributions = await getContributionsOnDay(symbols, startDate)
            // got result break
            keepTrying = false;
        } catch {
            // no result yet - keep trying
            keepTrying = true;
        }
    } while (keepTrying)

    return contributions
}

// get only the contributions for today...
export default async function getContributionsToday() {
    // get start of today in utc
    const todayDate = dayjs.utc().format("YYYY/MM/DD")

    // get contributions for today
    return getContributions(todayDate)
}

// get only the contributions for today...
export async function getContributions(date: string) {
    // get all symbols
    const symbols = await getSymbols()
    
    // get start of today in utc
    const todayDate = dayjs.utc(date, "YYYY/MM/DD").startOf('day')

    // get contributions for the given date
    return retryForContributionsOnDay(symbols,  todayDate)
}
