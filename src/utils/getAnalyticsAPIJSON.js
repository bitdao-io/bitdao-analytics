const getBalances = require('./getTokenBalance');
const getPrices = require('./getPrices');
const { tokens } = require("./constants.js");

async function getAnalyticsAPIJSON(conf, conns){
    let balances = await getBalances(conns, conf.treasuryAddress);
    let prices = await getPrices();

    let usdTotal = 0;
    let response = tokens.reduce((resp, token) => {
        let symbol = token.symbol.toLocaleLowerCase();
        resp[symbol + "Count"] = balances[token.symbol];
        resp[symbol + "Price"] = prices[token.symbol];
        usdTotal += balances[token.symbol] * prices[token.symbol];
        return resp;
    }, {});

    response.usdTotal = usdTotal;

    return response;
}

module.exports = getAnalyticsAPIJSON;
