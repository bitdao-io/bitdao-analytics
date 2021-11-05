require("dotenv").config({ path: '../.env' });
const balanceUtils = require('./utils/getTokenBalance')
const byBitSpotUtils = require('./utils/getExpectedContribution')

balanceUtils.getTokensBalance()
byBitSpotUtils.getByBitSpogtVolume()
