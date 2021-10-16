require("dotenv").config('../../.env');
const {
    tokens,
    erc20MinABI
} = require('./constants.js')
const tokenPriceUtils = require('./getTokenPriceByCoinGeckoApi');
const simplePriceUtils = require('./getSimplePriceByCoinGeckoApi');

const Web3 = require('web3');
const rpcURL = process.env.MAIN_RPC_URL
// Show Web3 where it needs to look for a connection to Ethereum.
web3 = new Web3(new Web3.providers.HttpProvider(rpcURL));

// let tokenAddress = USDT_TOKEN_ADDRESS
let walletAddress = process.env.BITDAO_ACCOUNT

/**
 * Get erc20 token balance.
 * @param tokenAddress erc20 token address
 * @returns balance of erc20
 */
async function getBalance(tokenAddress) {
    let contract = new web3.eth.Contract(erc20MinABI, tokenAddress);
    decimals = await contract.methods.decimals().call();
    balance = await contract.methods.balanceOf(walletAddress).call();
    balance = balance / (Math.pow(10, decimals))
    return balance;
}

/**
 * Get ETH balance of account.
 * @returns 
 */
async function getEthBalance() {
    const etherBalance = await web3.eth.getBalance(walletAddress);
    return web3.utils.fromWei(etherBalance, 'ether');
}

async function getTokensBalance() {
    let errorOccur
    for (var i = 0; i < tokens.length; i++) {
        let tokenBalance;
        if (tokens[i].symbol === 'ETH') {
            // get balance of ETH
            await getEthBalance().then(function (etherBalance) {
                tokenBalance = etherBalance;
            }).catch((err) => {
                console.log('get ether balance error:', err);
                errorOccur = true
            })
        } else {
            // get balance of other ERC20 token
            await getBalance(tokens[i].tokenAddress).then(function (balance) {
                tokenBalance = balance;
            }).catch((err) => {
                console.log('get erc20 balance error:', err);
                errorOccur = true
            });
        }
        // get price of ETH
        if (tokens[i].symbol === 'ETH') {
            await simplePriceUtils.getSimplePrice(tokens[i].symbol, tokenBalance)
            continue;
        }
        // get price of other ERC20 token
        await tokenPriceUtils.getTokenPrice(tokens[i].symbol, tokenBalance, tokens[i].tokenAddress)
    }
}

module.exports = {
    getTokensBalance: getTokensBalance
}