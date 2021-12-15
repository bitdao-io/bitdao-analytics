const rp = require('request-promise');
import {formatDate} from '../dateUtils'
import {
    Contribution,
    Prices
} from "../models";

// ContributionBPS is the bps of trade volume we expect to be contributed.
const ContributionBPS = 0.00025;

// ContributionsShares maps currency symbols to proportion of the contribution
// they should make up.
const ContributionsShares = {
    eth: 0.5,
    usdt: 0.25,
    usdc: 0.25,
};

// ContributionStartTime is the timestamp that the contribution pledge started.
const ContributionStartTime = 1626307200000;

// ContributionChartLength is the maximum length of the contribution chart
// stored in S3.
const ContributionChartLength = 365;

function getContributionForBTCVolume(prices: Prices, tradeVolumeInBTC: number, date: Date): Contribution {
    const contributionVolumeInUSD = prices.btc * tradeVolumeInBTC * ContributionBPS;

    const ethAmount = contributionVolumeInUSD * ContributionsShares.eth;
    const ethCount = ethAmount / prices.eth;

    const usdtAmount = (contributionVolumeInUSD * ContributionsShares.usdt).toFixed(0);
    const usdcAmount = (contributionVolumeInUSD * ContributionsShares.usdc).toFixed(0);

    return {
        ethCount: parseFloat(ethCount.toFixed(2)),
        ethPrice: parseFloat(prices.eth.toFixed(0)),
        ethAmount: parseFloat(ethAmount.toFixed(0)),

        usdtAmount: parseFloat(usdtAmount),
        usdtCount: parseFloat(usdtAmount),
        usdcAmount: parseFloat(usdcAmount),
        usdcCount: parseFloat(usdcAmount),

        tradeVolume: parseFloat((prices.btc * tradeVolumeInBTC).toFixed(0)),
        contributeVolume: parseFloat(contributionVolumeInUSD.toFixed(0)),

        date: formatDate(date),
    };
}

async function getHistoricalPrices(coinID: string) {
    let to = new Date();
    let from = new Date();
    from.setDate(to.getDate() - ContributionChartLength);

    return rp({
        method: 'GET',
        uri: 'https://api.coingecko.com/api/v3/coins/' + coinID + '/market_chart/range',
        qs: {
            'vs_currency': 'usd',
            'from': from.getTime() / 1000,
            'to': to.getTime() / 1000,
        },
        json: true,
        gzip: true
    }).then((response: any) => {
        return response.prices.map((price: any) => price[1]);
    }).catch((err: any) => console.log('API call error:', err.message))
}

async function getTradeVolumeChart() {
    return rp({
        method: 'GET',
        uri: 'https://api.coingecko.com/api/v3/exchanges/bybit/volume_chart?days=' + ContributionChartLength,
        json: true,
        gzip: true
    }).then((chart: any) => {
        return chart.map((chart: any) => chart[1]);
    }).catch((err: any) => console.log('getTradeVolumeChart API call error:', err.message));
}

export default async function getContributions() {
    const volumes = await getTradeVolumeChart();
    const btcPrices = await getHistoricalPrices('bitcoin');
    const ethPrices = await getHistoricalPrices('ethereum');

    let contributions: any = [];
    for (let i = 0; i < volumes.length; i++) {
        let date = new Date();
        date.setDate(date.getUTCDate() - (volumes.length - i - 1));

        if (date.getTime() < ContributionStartTime) {
            continue;
        }

        contributions.unshift(getContributionForBTCVolume({
            btc: btcPrices[i],
            eth: ethPrices[i],
        }, volumes[i], date));
    }
    return contributions;
}
