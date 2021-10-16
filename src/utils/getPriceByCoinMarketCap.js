require("dotenv").config({ path: '../../.env' });
const rp = require('request-promise');

async function getPrice(tokenAddress) {
  const requestOptions = {
    method: 'GET',
    uri: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest',
    qs: {
      'symbol': '1',
      'convert': 'USD'
    },
    headers: {
      'X-CMC_PRO_API_KEY': process.env.X_CMC_PRO_API_KEY
    },
    json: true,
    gzip: true
  };
  
  rp(requestOptions).then(response => {
    console.log('API call response:', response);
  }).catch((err) => {
    console.log('API call error:', err.message);
  });
}