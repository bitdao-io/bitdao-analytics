//1. Import coingecko-api
const CoinGecko = require('coingecko-api');

//2. Initiate the CoinGecko API Client
const CoinGeckoClient = new CoinGecko();

async function getPrice() {
    const params = {
        order: CoinGecko.ORDER.MARKET_CAP_DESC
    }
    CoinGeckoClient.coins.markets({ params })
    .then((response) => {
      console.log('getPrice reresponsesult=%s', JSON.stringify(response))
    })
    .catch((error) => {
        console.log(error)
      })
}

getPrice()