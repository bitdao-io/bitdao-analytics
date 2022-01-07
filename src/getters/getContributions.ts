import {
    Prices,
    Symbols,
    Contribution,
} from "../models";

import bent from 'bent';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
const getJSON = bent('json')

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
// const ContributionStartTime = 1626307200000;

// ContributionChartLength is the maximum length of the contribution chart
// stored in S3.
const ContributionChartLength = 15;

const symbolsURI = 'https://api.bybit.com/v2/public/symbols';

const inverseURI = (symbol: string, from: number): string => {
    return `https://api.bybit.com/v2/public/kline/list?interval=D&limit=1&symbol=${symbol}&from=${from}`;
}

const usdtPerpetualsURI = (symbol: string, from: number): string => {
    return `https://api.bybit.com/public/linear/kline?interval=D&limit=1&symbol=${symbol}&from=${from}`;
}

function loadContribution(prices: Prices, tradeVolumeInUSD: number, timestamp: number): Contribution {
    // const contributionVolumeInUSD = prices.btc * tradeVolumeInUSD * ContributionBPS;
    const contributionVolumeInUSD = tradeVolumeInUSD * ContributionBPS;

    const ethAmount = contributionVolumeInUSD * ContributionsShares.eth;
    const ethCount = ethAmount / prices.eth;

    const usdtAmount = (contributionVolumeInUSD * ContributionsShares.usdt).toFixed(0);
    const usdcAmount = (contributionVolumeInUSD * ContributionsShares.usdc).toFixed(0);

    return {

        date: dayjs.utc(timestamp*1000).format('YYYY-MM-DD'),
        tradeVolume: parseFloat(tradeVolumeInUSD.toFixed(0)),
        contributeVolume: parseFloat(contributionVolumeInUSD.toFixed(0)),


        // ethCount: parseFloat(ethCount.toFixed(2)),
        // ethPrice: parseFloat(prices.eth.toFixed(0)),
        ethAmount: parseFloat(ethAmount.toFixed(0)),

        usdtAmount: parseFloat(usdtAmount),
        // usdtCount: parseFloat(usdtAmount),
        usdcAmount: parseFloat(usdcAmount),
        // usdcCount: parseFloat(usdcAmount),
    };
}

function normalizeSymbol(symbol: string) {
    return symbol.toLocaleLowerCase();
}

async function getPrices(coinID: string, from: number, to: number) {
    let json = await getJSON(`https://api.coingecko.com/api/v3/coins/${coinID}/market_chart/range?vs_currency=usd&from=${from}&to=${to}`);
    return json['prices'].map((price: any) => price[1]);
}

async function loadDaysPrice(coinID: string, timestamp: number) {
    return (await getPrices(coinID, timestamp, timestamp + 86400))[0];
}

async function getSymbols(): Promise<Symbols>{
    let json = getJSON(symbolsURI);
    let inverse: string[] = [];
    let usdtPerpetual: string[] = [];

    (await json)['result'].forEach((symbol: any) => {
        const quote = normalizeSymbol(symbol['quote_currency']);
        if (quote === 'usdt') {
            usdtPerpetual.push(symbol['name']);
        } else {
            inverse.push(symbol['name']);
        }
    })

    return {inverse, usdtPerpetual};
}

async function loadVolume(symbols: string[], from: number, uriBuilder: any) {
    return symbols.reduce<Promise<number>>(async (volume: Promise<number>, symbol: string) =>{
        let body = (await getJSON(uriBuilder(symbol, from)))['result'];
        if (!body || !body.length) {
            return await volume;
        }

        body = body[0];
        let _volume = parseFloat(body['volume']);
        if (body['id']) {
            _volume = parseFloat(body['turnover']);
        }

        // if (body['turnover']) {
        // 	_volume = parseFloat(body['turnover']);
        // }

        console.log(`Loaded ${symbol}: ${_volume} - ${JSON.stringify(body)}`);
        return (await volume) + _volume;
    }, Promise.resolve(0));
}

async function loadVolumeForTimestamp(timestamp: number, symbols: Symbols) {
    console.log(`timestamp: ${timestamp}`);

    let inverseVolume = await loadVolume(symbols.inverse, timestamp, inverseURI);
    let perpVolume = await loadVolume(symbols.usdtPerpetual, timestamp, usdtPerpetualsURI);

    console.log(perpVolume, inverseVolume, inverseVolume + perpVolume);
    return inverseVolume + perpVolume;
}

export default async function getContributions() {
    const currentDateString = dayjs.utc().format('YYYYMMDD');
    const symbols = await getSymbols();
    const contributions: Array<Contribution> = [];

    let ts = 0;
    // let startDate = dayjs.utc(currentDateString, 'YYYYMMDD');
    // let startDate = dayjs.utc('2021-12-17', 'YYYYMMDD');
    let startDate = dayjs.utc('2021-08-16', 'YYYYMMDD');
    let endDate = startDate.add(1, 'd');

    for (let i = 0; i < 2; i++) {
        endDate = startDate;
        startDate = startDate.subtract(1, 'd');
        ts = startDate.unix();

        const volume = await loadVolumeForTimestamp(ts, symbols);
        const btc = await loadDaysPrice('bitcoin', ts);
        const eth = await loadDaysPrice('ethereum', ts);
        const contribution = loadContribution({btc, eth}, volume, ts);
        console.log(ts);
        console.log(startDate.format('YYYY-MM-DD'));
        console.log(volume);
        console.log(contribution);
        contributions.push(contribution);
    }
    return contributions;
}
