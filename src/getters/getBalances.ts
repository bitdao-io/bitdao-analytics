import Web3
    from "web3";

const {
    tokens,
    erc20MinABI
} = require('../constants.ts');

import {Token} from "../models";
import {getPrices} from "./getPrices";

/**
 * Get ETH balance of account.
 * @param web3 is a Web3 instance
 * @param walletAddr wallet address to get balance of
 * @returns balance of ether
 */
async function getEthBalance(web3: Web3, walletAddr: string): Promise<number> {
    const etherBalance = await web3.eth.getBalance(walletAddr);
    return parseFloat(web3.utils.fromWei(etherBalance, 'ether'));
}

/**
 * Get erc20 token balance.
 * @param web3 a Web3 instance
 * @param walletAddr wallet address to get balance of
 * @param tokenAddr erc20 token address to get balance of
 * @returns balance of erc20
 */
async function getERC20Balance(web3: any, walletAddr: string, tokenAddr: string): Promise<number> {
    const contract = new web3.eth.Contract(erc20MinABI, tokenAddr);
    const decimals = await contract.methods.decimals().call();
    const balance = await contract.methods.balanceOf(walletAddr).call();
    return (balance / (Math.pow(10, decimals)));
}

/**
 * Get balances for all currencies in the native units.
 * @param web3 is a Web3 instance
 * @param walletAddr wallet address to get balance of
 * @returns balances of ether and tokens
 */
async function getNativeBalances(web3: Web3, walletAddr: string) {
    let balances: any = {};

    await Promise.all(tokens.map(async (token: Token) => {
        let getter = getEthBalance;
        if (token.address) {
            getter = (web3: Web3, walletAddr: string) => getERC20Balance(web3, walletAddr, token.address);
        }

        return getter(web3, walletAddr).then((balance: number) => {
            balances[token.symbol] = balance;
        }).catch((err) => {
            console.log('get balance error:', err);
            return 0;
        });
    }));

    return balances;
}

/**
 * Get balances for all currencies converted into USD.
 * @param web3 is a Web3 instance
 * @param walletAddr wallet address to get balance of
 * @returns balances in USD
 */
export default async function getBalances(web3: Web3, walletAddr: string) {
    let balances = await getNativeBalances(web3, walletAddr);
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
