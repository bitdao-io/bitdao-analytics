import {AttributeValue} from '@aws-sdk/client-dynamodb/dist-types/models/models_0'

export class Balances {
    timestamp: number

    ethCount: number
    ethPrice: number
    bitCount: number
    bitPrice: number
    fttCount: number
    fttPrice: number
    usdtCount: number
    usdtPrice: number
    usdcCount: number
    usdcPrice: number
    xsushiCount: number
    xsushiPrice: number
    usdTotal: number

    static FromDDB(ddb: Record<string, AttributeValue>): Balances {
        let b = new Balances()

        b.timestamp = parseInt(ddb.timestamp_.N)
        b.usdTotal = parseUSD(ddb.usdTotal.N)

        b.ethPrice = parseUSD(ddb.ethPrice.N)
        b.ethCount = parseETH(ddb.ethCount.N)
        b.bitPrice = parseUSD(ddb.bitPrice.N)
        b.bitCount = parseETH(ddb.bitCount.N)
        b.fttPrice = parseUSD(ddb.fttPrice.N)
        b.fttCount = parseETH(ddb.fttCount.N)
        b.usdtPrice = parseUSD(ddb.usdtPrice.N)
        b.usdtCount = parseUSD(ddb.usdtCount.N)
        b.usdcPrice = parseUSD(ddb.usdcPrice.N)
        b.usdcCount = parseUSD(ddb.usdcCount.N)
        b.xsushiPrice = parseUSD(ddb.xsushiPrice.N)
        b.xsushiCount = parseETH(ddb.xsushiCount.N)

        return b
    }
}

// ByBitContribution represents a single day's contribution from ByBit to the
// treasury. In theory, we could just store the trade volume and re-compute the
// other values on demand, but this requires knowing the exact contribution
// formula for each day historically. By store all the calculated values we are
// essentially encoding the formula.
export class ByBitContribution {
    date: string

    timestamp: number
    tradeVolume: number
    contributeVolume: number

    ethPrice: number
    ethAmount: number
    ethCount: number
    usdtAmount: number
    usdtCount: number
    usdcAmount: number
    usdcCount: number

    static FromDDB(ddb: Record<string, AttributeValue>): ByBitContribution {
        let c = new ByBitContribution()

        c.timestamp = parseInt(ddb.timestamp_.N)
        c.tradeVolume = parseUSD(ddb.contributionVolume.N)
        c.contributeVolume = parseUSD(ddb.contributionVolume.N)
        c.ethPrice = parseUSD(ddb.contributionVolume.N)

        c.ethAmount = parseUSD(ddb.ethAmount.N)
        c.ethCount = parseETH(ddb.ethCount.N)
        c.usdtAmount = parseUSD(ddb.usdtAmount.N)
        c.usdtCount = parseUSD(ddb.usdtCount.N)
        c.usdcAmount = parseUSD(ddb.usdcAmount.N)
        c.usdcCount = parseUSD(ddb.usdcCount.N)

        return c
    }
}

export class Token {
    symbol: string;
    address: string;
}

function parseUSD(amount: string): number {
    return Math.round(parseFloat(amount) * 100) / 100
}

function parseETH(amount: string): number {
    return Math.round(parseFloat(amount) * 10000) / 10000
}

// export const Models = {
//     Balances,
//     ByBitContribution,
//     Token
// }
