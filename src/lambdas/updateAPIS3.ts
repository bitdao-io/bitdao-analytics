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
    const lastWeek = today.subtract(7, "day")

    // collect an array of every day which will appear in the chart results
    const days = [];
    // ensures we have every day from start of this collection to today
    const forDays = today.diff(dayjs.utc("2021/07/14", "YYYY/MM/DD"), "days") + 1;
    // day is moved back a day for each day in the forDays range
    let day = dayjs.utc(today);
    for (let i=1; i < forDays; i++){
        days.push(day.format("YYYY-MM-DD"))
        day = day.subtract(1, "day")
    }
    
    console.log("Getting last known state from s3 bucket")
    // get the last known good state from the bucket
    const data = await getJSON(s3, config.s3.bucket, 'analytics/chart-100-day.json') as {body: { list: Contribution[] }}
    
    console.log("Add new entry for today and update last weeks entry")
    // push new day and update yesterday
    if (data.body.list[0] && data.body.list[0].date === yesterday.format("YYYY-MM-DD")) {
        console.log(" - last update was yesterday, update the entry from 7 days ago, then yesterday, then push a new result for today")
        
        // record the old vol total
        const oldVol = data.body.list[6].contributeVolume;

        // update lastWeek (entry from 7 days ago)
        if (data.body.list[6].date === lastWeek.format("YYYY-MM-DD").toString()) {
          data.body.list.splice(6, 1, (await getContributions(lastWeek.format("YYYY/MM/DD")))[0]);
        }
        
        // save in the logs that lastWeeks result has changed
        if (oldVol !== data.body.list[6].contributeVolume) {
            console.log(" -- lastWeeks contributionVolume has changed", oldVol, " => ", data.body.list[6].contributeVolume)
        }

        // update yesterdays entry (update the entry at the top of the list)
        data.body.list.splice(0, 1, (await getContributions(yesterday.format("YYYY/MM/DD")))[0]);
        // add todays entry (push the entry to the front of the list - no need to generate numbers yet this would be a partial result...)
        data.body.list.splice(0, 0, {
          date: today.format("YYYY-MM-DD"),
          tradeVolume: 0,
          contributeVolume: 0,
          ethCount: 0,
          ethPrice: 0,
          bitPrice: 0,
          ethAmount: 0,
          usdtAmount: 0,
          usdtCount: 0,
          usdcAmount: 0,
          usdcCount: 0,
          bitAmount: 0,
          bitCount: 0
        });
    } else if (data.body.list[0] && data.body.list[0].date === today.format("YYYY-MM-DD")) {
        console.log(" - last update was earlier today, update todays results only")
        // update today (replace the entry in the list)
        data.body.list.splice(0, 1, (await getContributions(today.format("YYYY/MM/DD")))[0]);
    }

    console.log("Add missing entries")
    // add missing entries
    let pointer = 0;
    for(const iday of days) {
        // fill any missing entries
        if (iday !== data.body?.list?.[pointer]?.date) {
            console.log(` - missing entry ${pointer} - ${iday}`)
            data.body.list.splice(pointer, 0, (await getContributions(iday.replace(/-/g, "/")))[0])
        }
        
        // upgrade the schema to include bitAmount and count (if missing)
        if (data.body?.list?.[pointer] && typeof data.body?.list?.[pointer].bitAmount === "undefined") {
            data.body.list[pointer].bitAmount = 0;
            data.body.list[pointer].bitCount = 0;
        }

        // point to the next day
        pointer++
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
