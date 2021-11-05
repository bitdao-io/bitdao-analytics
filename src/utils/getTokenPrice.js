require("dotenv").config({ path: '../../.env' });
const rp = require('request-promise');
const uploadS3 = require('./s3');
const dateUtils = require('./dateUtils');

async function getTokenPrice(symbol, balance, tokenAddress) {
  const requestOptions = {
    method: 'GET',
    uri: 'https://api.coingecko.com/api/v3/simple/token_price/ethereum',
    qs: {
      'contract_addresses': tokenAddress,
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
    let tokenJson = response[`${tokenAddress}`.toLocaleLowerCase()]
    let price = tokenJson.usd.toFixed(2)
    let volume = tokenJson.usd_24h_vol.toFixed(2)
    console.log('symbol=%s, balance=%s, price=%s, usd_24h_vol=%s', symbol, balance, price, volume)

    const fileName = getFileName(symbol)
    const content = getContent(symbol, tokenAddress, balance, price, volume);
    uploadS3.uploadFile(fileName, JSON.stringify(content));
  }).catch((err) => {
    console.log('API call error:', err.message);
  });
}

function getFileName(token) {
  const year = dateUtils.getYear()
  const month = dateUtils.getMonth()
  const day = dateUtils.getDay()
  return `${token}-${year}-${month}-${day}.json`;
}

function getContent(token, tokenAddress, quantity, price, volume) {
  const year = dateUtils.getYear()
  const month = dateUtils.getMonth()
  const day = dateUtils.getDay()
  const priceVolumeSource = `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${tokenAddress}&vs_currencies=USD&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true`
  return {
    yyyy: year,
    mm: month,
    dd: day,
    token: token,
    quantity: quantity,
    source: 'https://etherscan.io/address/0x78605df79524164911c144801f41e9811b7db73d',
    price: price,
    price_source: priceVolumeSource,
    volume: volume,
    volume_source: priceVolumeSource
  }
}

module.exports = {
  getTokenPrice: getTokenPrice
}
