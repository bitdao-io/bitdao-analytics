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

export const handler = async function(event: Event, context: { logStreamName: string }) {
    console.log("EVENT: \n" + JSON.stringify(event, null, 2))

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
    
    console.log("Getting last known state from s3 bucket")
    // get the last known good state from the bucket
    const data = await getJSON(s3, config.s3.bucket, 'analytics/chart-100-day.json') as {body: { list: Contribution[] }}
    
    console.log("Add/update new entries for today/yesterday")
    // push new day and update yesterday
    if (data.body.list[0] && data.body.list[0].date === yesterday.format("YYYY-MM-DD")) {
        console.log(" - last update was yesterday, update and push today")
        
        // record the old vol total
        const oldVol = data.body.list[0].contributeVolume;

        // update yesterday
        data.body.list.splice(0, 1, (await getContributions(yesterday.format("YYYY/MM/DD")))[0]);
        // add today
        data.body.list.splice(0, 0, (await getContributions(today.format("YYYY/MM/DD")))[0]);

        // save in the logs that yesterdays result has changed
        if (oldVol !== data.body.list[1].contributeVolume) {
            console.log(" -- yesterdays contributionVolume has changed", oldVol, " => ", data.body.list[1].contributeVolume)
        }
    } else if (data.body.list[0] && data.body.list[0].date === today.format("YYYY-MM-DD")) {
        console.log(" - last update was earlier today, update todays results only")
        // update today (yesterday already up to date)
        data.body.list.splice(0, 1, (await getContributions(today.format("YYYY/MM/DD")))[0]);
    }

    console.log("Add missing entries")
    // add missing entries
    let pointer = 0;
    for(const iday of days) {
        if (iday !== data.body?.list?.[pointer]?.date) {
            console.log(` - missing entry ${pointer} - ${iday}`)
            data.body.list.splice(pointer, 0, (await getContributions(iday.replace(/-/g, "/")))[0])
        }
        pointer++
    }

    console.log("Trim list to 100 entries")
    // drop results so that we only ever have 100 items in here
    if (data.body.list.length > 100) {
        data.body.list = data.body.list.slice(0, 99);
    }

    console.log("Saving to s3 - chart-100-day.json")
    // write to today to update chart
    await writeToS3('chart-100-day', data.body, today.format("YYYY-MM-DD"))
    console.log(" - File saved.")

    console.log("Saving to s3 - balance.json")
    // update balances
    await writeToS3('balance', await getBalances(web3, config.treasuryAddress), today.format("YYYY-MM-DD"))
    console.log(" - File saved.")

    return context.logStreamName || false
}
