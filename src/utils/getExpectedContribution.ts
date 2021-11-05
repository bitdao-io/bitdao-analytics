const rp = require('request-promise');
import {formatDate} from './dateUtils'
import {Contribution} from "../models";

// ContributionBPS is the bps of trade volume we expect to be contributed.
const ContributionBPS = 0.00025;

// ContributionsShares maps currency symbols to proportion of the contribution
// they should make up.
const ContributionsShares = {
    eth: 0.5,
    usdt: 0.25,
    usdc: 0.25,
};

async function getContributionsForHistoricalVolumes() {
    const prices = await getCurrentPrices();
    const volumes = await getTradeVolumeChart();
    const btcPrices = await getHistoricalPrices('bitcoin');
    const ethPrices = await getHistoricalPrices('ethereum');

    let contributions = [];
    for (let i = 0; i < volumes.length; i++) {
        let date = new Date();
        date.setDate(date.getUTCDate() - (volumes.length - i - 1));
        contributions.push(getContributionForBTCVolume({
            btc: btcPrices[i],
            eth: ethPrices[i],
        }, volumes[i], date));
    }
    return contributions.reverse();
}

class Prices {
    btc: number;
    eth: number;
}

function getContributionForBTCVolume(prices: Prices, tradeVolumeInBTC: Number, date: Date) : Contribution{
    const contributionVolumeInUSD = prices.btc * tradeVolumeInBTC.valueOf() * ContributionBPS;

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

        tradeVolume: parseFloat((prices.btc * tradeVolumeInBTC.valueOf()).toFixed(0)),
        contributeVolume: parseFloat(contributionVolumeInUSD.toFixed(0)),

        date: formatDate(date),
    };
}

export async function getExpectedContribution() {
    const prices = await getCurrentPrices();
    const tradeVolumeInBTC = await getTradeVolume();
    return getContributionForBTCVolume(prices, tradeVolumeInBTC.valueOf(), new Date());
}

async function getHistoricalPrices(coinID: string) {
    let to = new Date();
    let from = new Date();
    from.setDate(to.getDate() - 100);

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


async function getCurrentPrices() {
    return rp({
        method: 'GET',
        uri: 'https://api.coingecko.com/api/v3/simple/price',
        qs: {
            'ids': 'bitcoin,ethereum',
            'vs_currencies': 'USD',
            'include_market_cap': 'true',
            'include_24hr_vol': 'true',
            'include_24hr_change': 'true',
            'include_last_updated_at': 'true'
        },
        json: true,
        gzip: true
    }).then((response: any) => {
        return {
            btc: Number(response.bitcoin.usd),
            eth: Number(response.ethereum.usd),
        };
    }).catch((err: any) => console.log('API call error:', err.message))
}

async function getTradeVolume() {
    return rp({
        method: 'GET',
        uri: 'https://api.coingecko.com/api/v3/derivatives/exchanges/bybit',
        json: true,
        gzip: true
    }).then((response: any) => {
        return Number(response.trade_volume_24h_btc);
    }).catch((err: any) => console.log('getTradeVolume API call error:', err.message));
}

async function getTradeVolumeChart() {
    return rp({
        method: 'GET',
        uri: 'https://api.coingecko.com/api/v3/exchanges/bybit/volume_chart?days=100',
        json: true,
        gzip: true
    }).then((chart: any) => {
        return chart.map((chart: any) => chart[1]);
    }).catch((err: any) => console.log('getTradeVolumeChart API call error:', err.message));
}

export default {getExpectedContribution};
