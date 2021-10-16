require("dotenv").config({ path: '../../.env' });
const rp = require('request-promise');
const uploadS3 = require('./uploadS3');
const dateUtils = require('./dateUtils');

async function getSimplePrice(symbol, balance) {
  const requestOptions = {
    method: 'GET',
    uri: 'https://api.coingecko.com/api/v3/simple/price',
    qs: {
      'ids': 'ethereum',
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
    // console.log('symbol=%s, balance=%s, response=%s', symbol, balance, JSON.stringify(response))
    let tokenJson = response.ethereum
    let price = tokenJson.usd.toFixed(2)
    let volume = tokenJson.usd_24h_vol.toFixed(2)
    console.log('symbol=%s, balance=%s, price=%s, usd_24h_vol=%s', symbol, balance, price, volume)

    const fileName = getFileName(symbol)
    const content = getContent(symbol, balance, price, volume);
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

function getContent(token, quantity, price, volume) {
  const year = dateUtils.getYear()
  const month = dateUtils.getMonth()
  const day = dateUtils.getDay()
  const priceVolumeSource = `https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=USD&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true`
  let content = {
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
  return content;
}

module.exports = {
  getSimplePrice: getSimplePrice
}

symbol=ETH, balance=138714.898473120426836325, price=3946.72, usd_24h_vol=21281512772.75
symbol=BIT, balance=1000000020, price=1.80, usd_24h_vol=104164108.43
symbol=USDT, balance=56735771, price=1.00, usd_24h_vol=75964195874.95
symbol=USDC, balance=56735672, price=1.00, usd_24h_vol=2960198154.44
symbol=xSUSHI, balance=2132234.813768734, price=13.44, usd_24h_vol=7917493.90