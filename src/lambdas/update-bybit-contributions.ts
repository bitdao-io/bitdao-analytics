import newConfigFromEnv from '../config'
import newConnections from '../connections'
import getContributions from '../getters/getContributions'

const config = newConfigFromEnv()
const conns = newConnections(config)

export default async function handler() {
    (await getContributions()).forEach((c) => {
        conns.ddb.CreateByBitContribution(c)
    })
}
