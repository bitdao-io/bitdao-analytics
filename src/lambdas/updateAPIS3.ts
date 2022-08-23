import newConfigFromEnv from '../config'
import newConnections from '../connections'
import {Contribution} from '../models'
import {uploadFile, getJSON} from '../s3'
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

    // collect an array of every day which will appear in the 100 day results
    const days = [];
    let day = dayjs.utc(today);
    for (let i=1; i < 100; i++){
        days.push(day.format("YYYY-MM-DD"))
        day = day.subtract(1, "day")
    }

    // get the last known good state from the bucket
    const data = await getJSON(s3, config.s3.bucket, 'analytics/chart-100-day.json') as {body: { list: Contribution[] }}

    // push new day and update yesterday
    if (data.body.list[0] && data.body.list[0].date === yesterday.format("YYYY-MM-DD")) {
        // update yesterday
        data.body.list.splice(0, 1, (await getContributions(yesterday.format("YYYY/MM/DD")))[0]);
        // add today
        data.body.list.splice(0, 0, (await getContributions(today.format("YYYY/MM/DD")))[0]);
    } else if (data.body.list[0] && data.body.list[0].date === today.format("YYYY-MM-DD")) {
        // update today (yesterday already upto date)
        data.body.list.splice(0, 1, (await getContributions(today.format("YYYY/MM/DD")))[0]);
    }

    // drop oldest result
    if (data.body.list.length > 100) {
        data.body.list.pop();
    }

    // add missing entries
    let pointer = 0;
    for(const iday of days) {
        if (iday !== data.body?.list?.[pointer]?.date) {
            data.body.list.splice(pointer, 0, (await getContributions(iday.replace(/-/g, "/")))[0])
        }
        pointer++
    }

    // update balances
    await writeToS3('balance', await getBalances(web3, config.treasuryAddress), today.format("YYYY-MM-DD"))
    // write to today to update chart (we need to place `chart-100-day` here once we know this is correct)
    await writeToS3('chart-100', await getContributions(today.format("YYYY/MM/DD")), today.format("YYYY-MM-DD"))
}
