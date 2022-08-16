import getBalances from '../getters/getBalances'
import newConfigFromEnv from '../config'
import newConnections from '../connections'

const config = newConfigFromEnv()
const conns = newConnections(config)

export default async function handler() {
    conns.ddb.CreateBalances(await getBalances(conns.web3, config.treasuryAddress))
}
