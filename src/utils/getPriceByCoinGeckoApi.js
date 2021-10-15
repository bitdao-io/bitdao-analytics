require("dotenv").config({ path: '../../.env' });

const rp = require('request-promise');
const requestOptions = {
  method: 'GET',
  uri: 'https://api.coingecko.com/api/v3/simple/token_price/ethereum',
  qs: {
    'contract_addresses': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    'vs_currencies': 'USD'
  },
  json: true,
  gzip: true
};

rp(requestOptions).then(response => {
  console.log('API call response:', response);
}).catch((err) => {
  console.log('API call error:', err.message);
});