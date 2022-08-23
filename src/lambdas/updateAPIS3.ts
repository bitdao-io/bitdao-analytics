import newConfigFromEnv from '../config'
import newConnections from '../connections'
import {uploadFile} from '../s3'
import getBalances from '../getters/getBalances'
import getContributions from '../getters/getContributions'

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

const config = newConfigFromEnv()
const {
    s3,
    web3
} = newConnections(config)


function writeToS3(name: string, body: unknown, date: string): Promise<[string, string]> {
    const json = JSON.stringify({
        success: true,
        body: body
    })
    return Promise.all([
      uploadFile(s3, config.s3.bucket, 'analytics/' + name + '.json', json),
      uploadFile(s3, config.s3.bucket, 'analytics/' + name + '-' + date + '.json', json)
    ])
}

export default async function handler() {
    // get start of today in utc
    const today = dayjs.utc()
    const yesterday = today.subtract(1, "day")

    // update balances
    await writeToS3('balance', await getBalances(web3, config.treasuryAddress), today.format("YYYY-MM-DD"))
    // write to yesterday to ensure we caught all data there
    await writeToS3('chart-100', await getContributions(yesterday.format("YYYY/MM/DD")), yesterday.format("YYYY-MM-DD"))
    // write to today to update chart
    await writeToS3('chart-100', await getContributions(today.format("YYYY/MM/DD")), today.format("YYYY-MM-DD"))
}
