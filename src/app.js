require("dotenv").config({ path: '../.env' });
const balanceUtils = require('./utils/getTokenBalance')
const priceUtils = require('./utils/getPriceByCryptoCompare')

balanceUtils.getTokensBalance()
priceUtils.getPrice()