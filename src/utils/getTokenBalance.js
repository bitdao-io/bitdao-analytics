require("dotenv").config('../../.env');
const {
    tokens,
    erc20MinABI
} = require('./constants.js')
const uploadS3 = require('./uploadS3');
const dateUtils = require('./dateUtils');

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
        if (tokens[i].symbol === 'ETH') {
            // get balance of ETH
            await getEthBalance().then(function (etherBalance) {
                const fileName = getFileName(tokens[i].symbol)
                const content = getContent(tokens[i].symbol, etherBalance);
                uploadS3.uploadFile(fileName, JSON.stringify(content));
            }).catch((err) => {
                console.log('get ether balance error:', err);
                errorOccur = true
            })
        } else {
            // get balance of other ERC20 token
            await getBalance(tokens[i].tokenAddress).then(function (balance) {
                const fileName = getFileName(tokens[i].symbol)
                const content = getContent(tokens[i].symbol, balance);
                uploadS3.uploadFile(fileName, JSON.stringify(content));
            }).catch((err) => {
                console.log('get erc20 balance error:', err);
                errorOccur = true
            });
        }
    }
}

function getFileName(token) {
    const year = dateUtils.getYear()
    const month = dateUtils.getMonth()
    const day = dateUtils.getDay()
    return `${token}-${year}-${month}-${day}.json`;
}

function getContent(token, quantity) {
    const year = dateUtils.getYear()
    const month = dateUtils.getMonth()
    const day = dateUtils.getDay()
    let content = {
        yyyy: year,
        mm: month,
        dd: day,
        token: token,
        quantity: quantity,
        source: 'https://etherscan.io/address/0x78605df79524164911c144801f41e9811b7db73d'
    }
    return content;
}

module.exports = {
    getTokensBalance: getTokensBalance
}