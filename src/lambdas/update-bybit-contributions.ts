import getBalances from '../getters/getBalances'
import newConfigFromEnv from '../config'
import newConnections from '../connections'
import getContributions
    from "../getters/getContributions";

const config = newConfigFromEnv()
const conns = newConnections(config)

export default async function handler() {
    // Load latest contribution
    // Get date
    // Poll ByBit for each date and add
    conns.ddb.CreateBalances(await getContributions())
}
