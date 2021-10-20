require("dotenv").config({ path: '../../.env' });
const rp = require('request-promise');
const dateUtils = require('./dateUtils');
const uploadS3 = require('./uploadS3');

async function getByBitSpotVolume() {
    const requestOptions = {
        method: 'GET',
        uri: 'https://api.coingecko.com/api/v3/derivatives/exchanges/bybit',
        json: true,
        gzip: true
    };
    await rp(requestOptions).then(response => {
        const trade_volume_24h_btc = response.trade_volume_24h_btc
        getSimplePrice(trade_volume_24h_btc)
    }).catch((err) => {
        console.log('getByBitSpotVolume API call error:', err.message);
    });
}

// get price of bitcoin and ethereum
async function getSimplePrice(trade_volume_24h_btc) {
    const requestOptions = {
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
    };
    await rp(requestOptions).then(response => {
        let bitcoinPrice = response.bitcoin.usd
        let ethPrice = response.ethereum.usd
        // calculate trade volume of ByBit
        const tradeVolume = Number(bitcoinPrice) * Number(trade_volume_24h_btc)
        calculateDailyContribution(tradeVolume, ethPrice)
    }).catch((err) => {
        console.log('API call error:', err.message);
    });
}

async function calculateDailyContribution(tradeVolume, ethPrice) {
    const contributeVolume = (tradeVolume * Number(0.00025)).toFixed(0) // 2.5bps
    // 50% ETH
    const ethAmount = (contributeVolume * Number(0.5)).toFixed(0)
    const ethCount = (ethAmount / ethPrice).toFixed(2)
    // 25% USDT
    const usdtAmount = (contributeVolume * Number(0.25)).toFixed(0)
    // 25% USDC
    const usdcAmount = (contributeVolume * Number(0.25)).toFixed(0)

    const fileName = getFileName()
    const content = getContent(tradeVolume, contributeVolume, ethAmount, ethPrice, ethCount, usdtAmount, usdcAmount)
    // upload today data to S3
    uploadS3.uploadFile(fileName, JSON.stringify(content))
    // console.log('content=%s', JSON.stringify(content))
}

function getFileName() {
    const year = dateUtils.getYear()
    const month = dateUtils.getMonth()
    const day = dateUtils.getDay()
    return `ByBitSpot-${year}-${month}-${day}.json`;
}

function getContent(tradeVolume, contributeVolume, ethAmount, ethPrice, ethCount, usdtAmount, usdcAmount) {
    const today = dateUtils.getToday()
    let content = {}
    content.success = true;
    content.message = null;
    let body = {}
    let list = []
    let todayData = {
        ethCount: ethCount,
        ethPrice: ethPrice.toFixed(0),
        ethAmount: ethAmount,
        usdtCount: usdtAmount,
        usdtAmount: usdtAmount,
        usdcCount: usdcAmount,
        usdcAmount: usdcAmount,
        tradeVolume: tradeVolume.toFixed(0),
        contributeVolume: contributeVolume,
        date: today
    }
    list.push(todayData)
    body.list = list
    body.ethPrice = ethPrice.toFixed(0)
    content.body = body
    return content;
}

module.exports = {
    getByBitSpotVolume: getByBitSpotVolume
}