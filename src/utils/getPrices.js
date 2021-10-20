const { tokens } = require('./constants.js');
const rp = require('request-promise');

function coingeckoOptions(path, otherQs) {
    let opts = {
        method: 'GET',
        uri: 'https://api.coingecko.com/api/v3/simple/' + path,
        qs: {
            'vs_currencies': 'USD',
            'include_market_cap': 'true',
            'include_24hr_vol': 'true',
            'include_24hr_change': 'true',
            'include_last_updated_at': 'true'
        },
        json: true,
        gzip: true
    };

    for (let key in otherQs) {
        opts.qs[key] = otherQs[key];
    }

    return opts;
}

async function getEthPrice() {
    return rp(coingeckoOptions('price', {'ids': 'ethereum'})).then(resp => {
        return resp.ethereum.usd.toFixed(2);
    });
}

async function getTokenPrice(addr) {
    const opts = coingeckoOptions('token_price/ethereum', {'contract_addresses': addr});
    return rp(opts).then(resp => {
        const tokenJson = resp[addr.toLocaleLowerCase()];
        return tokenJson.usd.toFixed(2);
    });
}


async function getPrices() {
    const handleError = (err) => {
        console.log('Coingecko call error:', err.message);
        return 0;
    };

    let prices = {'ETH': await getEthPrice().catch(handleError)};

    await Promise.all(tokens.map(async token => {
        if (token.address) {
            prices[token.symbol] = await getTokenPrice(token.address).catch(handleError);
        }
    }));

    return prices;
}

module.exports = getPrices;
