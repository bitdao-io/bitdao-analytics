const getBalances = require('../getters/getTokenBalance');

import {getPrices} from "../getters/getPrices";
import {tokens} from "../constants";
import {Token} from "../models";

export default async function getAPIBalance(conf: any, conns: any) {
    let balances = await getBalances(conns.web3, conf.treasuryAddress);
    let prices = await getPrices();

    let usdTotal = 0;
    let response = tokens.reduce((resp: any, token: Token) => {
        let symbol = token.symbol.toLocaleLowerCase();
        resp[symbol + "Count"] = balances[token.symbol];
        resp[symbol + "Price"] = prices[token.symbol];
        usdTotal += balances[token.symbol] * prices[token.symbol];
        return resp;
    }, {});

    response.usdTotal = usdTotal;

    return response;
}
