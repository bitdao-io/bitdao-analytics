require("dotenv").config({ path: '../.env' });
const balanceUtils = require('./utils/getTokenBalance')

balanceUtils.getTokensBalance()