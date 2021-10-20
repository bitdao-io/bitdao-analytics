require("dotenv").config({ path: '../.env' });
const balanceUtils = require('./utils/getTokenBalance')
const byBitSpotUtils = require('./utils/getSpotVolumeByCoinGeckoApi')

balanceUtils.getTokensBalance()
byBitSpotUtils.getByBitSpotVolume()