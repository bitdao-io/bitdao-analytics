import {Prices, Symbols, Contribution} from '../models'

import bent from 'bent'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
const newGetJSONRequest = bent('json')

const getJSON = (uri: string) => {
    let req = newGetJSONRequest(uri)
    req.catch(() => {})
    return req
}

// ContributionBPS is the bps of trade volume we expect to be contributed.
const ContributionBPS = 0.00025

// ContributionsShares maps currency symbols to proportion of the contribution
// they should make up.
const ContributionsShares = {
    eth: 0.5,
    usdt: 0.25,
    usdc: 0.25
}

// ContributionStartTime is the timestamp that the contribution pledge started.
// const ContributionStartTime = 1626307200000;

// ContributionChartLength is the maximum length of the contribution chart
// stored in S3.
const ContributionChartLength = 15

const symbolsURI = 'https://api.bybit.com/v2/public/symbols'

const inverseURI = (symbol: string, from: number): string => {
    return `https://api.bybit.com/v2/public/kline/list?interval=D&limit=1&symbol=${symbol}&from=${from}`
}

const usdtPerpetualsURI = (symbol: string, from: number): string => {
    return `https://api.bybit.com/public/linear/kline?interval=D&limit=1&symbol=${symbol}&from=${from}`
}

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
    let json = await getJSON(
        `https://api.coingecko.com/api/v3/coins/${coinID}/market_chart/range?vs_currency=usd&from=${from}&to=${to}`
    )
    return json['prices'].map((price: any) => price[1])
}

async function loadDaysPrice(coinID: string, timestamp: number) {
    return (await getPrices(coinID, timestamp, timestamp + 86400))[0]
}

async function getSymbols(): Promise<Symbols> {
    let req = getJSON(symbolsURI)
    let inverse: string[] = []
    let usdtPerpetual: string[] = []

    req.catch((error) => {})

    ;(await req)['result'].forEach((symbol: any) => {
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

async function loadVolume(symbols: string[], symbolType: string, from: number) {
    return symbols.reduce<Promise<number>>(
        async (volume: Promise<number>, symbol: string) => {
            // Get endpoint for this symbol type
            let uri = inverseURI(symbol, from)
            if (symbolType === 'perp') {
                uri = usdtPerpetualsURI(symbol, from)
            }

            const req = getJSON(uri)

            // Load the data
            let body = (await req)['result']
            if (!body || !body.length) {
                return await volume
            }

            // Grab the volume based on the symbol type
            body = body[0]
            let _volume = parseFloat(body['volume'])
            if (symbolType === 'perp') {
                _volume = parseFloat(body['turnover'])
            }

            if (body['open_time'] < from || body['open_time'] > from + 86400) {
                return await volume
            }

            // Accumulate the volume
            return (await volume) + _volume
        },
        Promise.resolve(0)
    )
}

async function loadVolumeForTimestamp(timestamp: number, symbols: Symbols) {
    let inverseVolume = await loadVolume(symbols.inverse, 'inverse', timestamp)
    let perpVolume = await loadVolume(symbols.usdtPerpetual, 'perp', timestamp)
    return inverseVolume + perpVolume
}

export default async function getContributions() {
    const symbols = await getSymbols()
    const contributions: Array<Contribution> = []

    const todayString = dayjs.utc().format('YYYYMMDD')
    const todayDate = dayjs.utc('20220726', 'YYYYMMDD')
    // const todayDate = dayjs.utc(todayString, 'YYYYMMDD');

    let startDate = todayDate.subtract(1, 'day').startOf('day')

    const getContribution = async () => {
        const ts = startDate.unix()
        let volume, btc, eth
        try {
            volume = await loadVolumeForTimestamp(ts, symbols)
            btc = await loadDaysPrice('bitcoin', ts)
            eth = await loadDaysPrice('ethereum', ts)
        } catch (err) {
            return false
        }
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
        return true
    }

    function sleep(seconds: number) {
        return new Promise((resolve) => {
            setTimeout(resolve, seconds * 1000)
        })
    }

    for (let i = 0; i < 1; i++) {
        for (let i = 0; i < 5; i++) {
            try {
                if (!(await getContribution())) {
                    await sleep(i * 2)
                    continue
                }
                break
            } catch (err) {
                await sleep(i * 2)
            }
        }
        startDate = startDate.subtract(1, 'd')
    }
    return contributions
}
