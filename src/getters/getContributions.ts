import {ByBitContribution} from '../models'

import {GetJSON} from './getJSON'
import {GetSymbols, Symbols} from './getSymbols'
import {GetHistoricETHPrice} from './getPrices'

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

// ContributionBPS is the bps of trade volume we expect to be contributed.
const ContributionBPS = 0.00025

// ContributionsShares maps currency symbols to proportion of the contribution
// they should make up.
const ContributionsShares = {
    eth: 0.5,
    usdt: 0.25,
    usdc: 0.25
}

const retryAttemptLimit = 5

const inverseURI = (symbol: string, from: number): string => {
    return `https://api.bybit.com/v2/public/kline/list?interval=D&limit=1&symbol=${symbol}&from=${from}`
}

const usdtPerpetualsURI = (symbol: string, from: number): string => {
    return `https://api.bybit.com/public/linear/kline?interval=D&limit=1&symbol=${symbol}&from=${from}`
}

function formatContribution(
  ethPrice: number,
  tradeVolumeInUSD: number,
  timestamp: number
): ByBitContribution {
    const contributionVolumeInUSD = tradeVolumeInUSD * ContributionBPS

    const ethAmount = contributionVolumeInUSD * ContributionsShares.eth
    const ethCount = ethAmount / ethPrice

    const usdtAmount = contributionVolumeInUSD * ContributionsShares.usdt
    const usdcAmount = contributionVolumeInUSD * ContributionsShares.usdc

    return {
        date: dayjs.utc(timestamp * 1000).format('YYYY-MM-DD'),
        timestamp: timestamp * 1000,
        ethPrice: parseFloat(ethPrice.toFixed(2)),

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

async function loadVolumeAtDateForType(
  symbols: string[],
  type: string,
  from: number
) {
    return symbols.reduce<Promise<number>>(
      async (volume: Promise<number>, symbol: string) => {
          // Get endpoint for this symbol type
          let uri = inverseURI(symbol, from)
          if (type === 'perp') {
              uri = usdtPerpetualsURI(symbol, from)
          }

          const req = GetJSON(uri)

          // Load the data
          let body = (await req)['result']
          if (!body || !body.length) {
              return await volume
          }

          // Grab the volume based on the symbol type
          body = body[0]
          let _volume = parseFloat(body['volume'])
          if (type === 'perp') {
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

async function loadTotalVolumeAtDate(timestamp: number, symbols: Symbols) {
    let inverseVolume = await loadVolumeAtDateForType(
      symbols.inverse,
      'inverse',
      timestamp
    )
    let perpVolume = await loadVolumeAtDateForType(
      symbols.usdtPerpetual,
      'perp',
      timestamp
    )
    return inverseVolume + perpVolume
}

export default async function getContributions(): Promise<ByBitContribution[]> {
    const symbols = await GetSymbols()
    const contributions: Array<ByBitContribution> = []

    const todayDate = dayjs.utc(new Date(), 'YYYYMMDD')
    let startDate = todayDate.subtract(1, 'day').startOf('day')

    const getContribution = async () => {
        const ts = startDate.unix()
        let volume,
          eth
        try {
            volume = await loadTotalVolumeAtDate(ts, symbols)
            eth = await GetHistoricETHPrice(ts)
        } catch (err) {
            return false
        }

        contributions.push(formatContribution(eth, volume, ts))
        return true
    }

    function sleep(seconds: number) {
        return new Promise((resolve) => {
            setTimeout(resolve, seconds * 1000)
        })
    }

    // To deal with a flakey backend API we try a few times with a doubling
    // backoff before giving up
    for (let i = 0; i < retryAttemptLimit; i++) {
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

    return contributions
}
