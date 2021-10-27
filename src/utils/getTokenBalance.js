const {
    tokens,
    erc20MinABI
} = require('./constants.js');

const tokenPriceUtils = require('./getTokenPriceByCoinGeckoApi');
const simplePriceUtils = require('./getSimplePriceByCoinGeckoApi');

/**
 * Get erc20 token balance.
 * @param web3 a Web3 instance
 * @param walletAddr wallet address to get balance of
 * @param tokenAddr erc20 token address to get balance of
 * @returns balance of erc20
 */
async function getBalance(web3, walletAddr, tokenAddr) {
    const contract = new web3.eth.Contract(erc20MinABI, tokenAddr);
    const decimals = await contract.methods.decimals().call();
    const balance = await contract.methods.balanceOf(walletAddr).call();
    return (balance / (Math.pow(10, decimals))).toFixed(decimals);
}

/**
 * Get ETH balance of account.
 * @param web3 a Web3 instance
 * @param walletAddr wallet address to get balance of
 * @returns balance of ether
 */
async function getEthBalance(web3, walletAddr) {
    const etherBalance = await web3.eth.getBalance(walletAddr);
    return parseFloat(web3.utils.fromWei(etherBalance, 'ether')).toFixed(18);
}

/**
 * Get an appropriate getter function for the given token
 * @param token is a Token object
 * @returns getter function
 */
function balanceGetterForCurrency(token) {
    if (token.address) {
        return (web3, walletAddr) => getBalance(web3, walletAddr, token.address);
    }
    return getEthBalance;
}
/**
 * Get balances for all currencies.
 * @param conns is a Connections object
 * @param walletAddr wallet address to get balance of
 * @returns balance of ether
 */
async function getBalances(conns, walletAddr) {
    let balances = {};

    await Promise.all(tokens.map(async token => {
        return balanceGetterForCurrency(token)(conns.web3, walletAddr).then((balance) => {
            balances[token.symbol] = balance;
        }).catch((err) => {
            console.log('get balance error:', err);
            return 0;
        });
    }));

    return balances;
}

module.exports = getBalances;
