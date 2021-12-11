import Web3 from "web3";

const {
    tokens,
    erc20MinABI
} = require('../constants.ts');

import {Token} from "../models";


/**
 * Get erc20 token balance.
 * @param web3 a Web3 instance
 * @param walletAddr wallet address to get balance of
 * @param tokenAddr erc20 token address to get balance of
 * @returns balance of erc20
 */
async function getBalance(web3:any, walletAddr:string, tokenAddr:string) : Promise<number>  {
    const contract = new web3.eth.Contract(erc20MinABI, tokenAddr);
    const decimals = await contract.methods.decimals().call();
    const balance = await contract.methods.balanceOf(walletAddr).call();
    return (balance / (Math.pow(10, decimals)));
}

/**
 * Get ETH balance of account.
 * @param web3 is a Web3 instance
 * @param walletAddr wallet address to get balance of
 * @returns balance of ether
 */
async function getEthBalance(web3:Web3, walletAddr:string) : Promise<number> {
    const etherBalance = await web3.eth.getBalance(walletAddr);
    return parseFloat(web3.utils.fromWei(etherBalance, 'ether'));
}

/**
 * Get an appropriate getter function for the given token
 * @param token is a Token object
 * @returns getter function
 */
function balanceGetterForCurrency(token:Token): (web3: Web3, walletAddr: string) => Promise<number> {
    if (token.address) {
        return (web3:Web3, walletAddr:string) => getBalance(web3, walletAddr, token.address);
    }
    return getEthBalance;
}
/**
 * Get balances for all currencies.
 * @param web3 is a Web3 instance
 * @param walletAddr wallet address to get balance of
 * @returns balance of ether
 */
async function getBalances(web3:Web3, walletAddr:string) {
    let balances:any = {};

    await Promise.all(tokens.map(async (token:Token) => {
        return balanceGetterForCurrency(token)(web3, walletAddr).then((balance:number) => {
            balances[token.symbol] = balance;
        }).catch((err) => {
            console.log('get balance error:', err);
            return 0;
        });
    }));

    return balances;
}

module.exports = getBalances;
