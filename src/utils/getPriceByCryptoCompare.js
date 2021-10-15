require("dotenv").config({ path: '../../.env' });

const {
  tokens,
  tokenSymbols
} = require('./constants.js')
const rp = require('request-promise');
const uploadS3 = require('./uploadS3');
const dateUtils = require('./dateUtils');

const options = {
  method: 'GET',
  uri: 'https://min-api.cryptocompare.com/data/pricemulti',
  qs: {
    'fsyms': tokenSymbols,
    'tsyms': 'USD',
    'api_key': process.env.CRYPTO_COMPARE_API_KEY
  },
  json: true,
  gzip: true
};

async function getPrice() {
  rp(options).then(response => {
    // console.log('API call response=%s', JSON.stringify(response));
    for (var i = 0; i < tokens.length; i++) {
      // get price from response
      const symbol = tokens[i].symbol;
      const symbolJson = response[`${symbol}`.toUpperCase()]
      if (typeof (symbolJson) == 'undefined') {
        continue
      }
      const price = symbolJson.USD
      // console.log('symbol=%s, price=%s', symbol, price.toFixed(2));
      const fileName = getFileName(symbol);
      const content = getContent(symbol, price.toFixed(2));
      // console.log('content=%s', JSON.stringify(content))
      uploadS3.uploadFile(fileName, JSON.stringify(content));
    }
  }).catch((err) => {
    console.log('API call error:', err.message);
  });
}

function getFileName(token) {
  const year = dateUtils.getYear()
  const month = dateUtils.getMonth()
  const day = dateUtils.getDay()

  // console.log(`getFileName year=${year}, month=${month}, day=${day}`);
  return `${token}-price-${year}-${month}-${day}.json`;
}

function getContent(token, price) {
  const year = dateUtils.getYear()
  const month = dateUtils.getMonth()
  const day = dateUtils.getDay()
  let content = {
    yyyy: year,
    mm: month,
    dd: day,
    token: token,
    price: price,
    source: 'https://min-api.cryptocompare.com/data/pricemulti'
  }
  return content;
}

module.exports = {
  getPrice: getPrice
}