import {Client} from './ddb'
import {ResourceInUseException} from '@aws-sdk/client-dynamodb'
import {ByBitContribution} from '../models'
import {FormatDate} from './utils'

function newByBitContributionBaseFixture(): ByBitContribution {
    return {
        date: FormatDate(new Date()),
        timestamp: new Date().getTime(),
        ethPrice: 100.0,

        tradeVolume: 100000,
        contributeVolume: 100,

        ethAmount: 25,
        ethCount: 0.25,
        usdtAmount: 25,
        usdtCount: 25,
        usdcAmount: 25,
        usdcCount: 25
    }
}

const fixtureCount = 4
const client = new Client('test-ddb')

beforeAll(async function () {
    // Recreate table
    await client.DeleteTable()
    await client.CreateTable()
})

describe('Client', () => {
    it('should be able to create new contribution records', async () => {
        let now = new Date().getTime()
        for (let i = 0; i < fixtureCount; i++) {
            let f = newByBitContributionBaseFixture()
            f.timestamp = now
            now -= 86400000

            const resp = await client.CreateByBitContribution(f)
            expect(resp).toBeDefined()
            expect(resp.$metadata.httpStatusCode).toBe(200)
        }
    })

    it('should be able to retrieve the latest records', async () => {
        const date = FormatDate(new Date())
        const resp = await client.GetAllByBitContributions(date)

        expect(resp).toBeDefined()
        expect(resp.$metadata.httpStatusCode).toBe(200)

        expect(resp.Count).toBe(fixtureCount)

        const items = resp.Items
        expect(items.length).toBe(fixtureCount)

        const c = ByBitContribution.FromDDB(items[0])
    })

    it('should be able to retrieve a given dates record', async () => {
        const date = FormatDate(new Date())
        const resp = await client.GetByBitContribution(date)

        expect(resp).toBeDefined()
        expect(resp.$metadata.httpStatusCode).toBe(200)
        expect(resp.Count).toBe(1)
    })
})
