import {
    CreateTableCommand,
    DeleteTableCommand,
    DynamoDBClient,
    PutItemCommand,
    QueryCommand
} from '@aws-sdk/client-dynamodb'
import {AttributeValue} from '@aws-sdk/client-dynamodb/dist-types/models/models_0'
import {Balances, ByBitContribution} from '../models'
import {DateEndTime, DateTimeRange, WrapNumber} from './utils'

enum Key {
    Partition = 'type_',
    Sort = 'timestamp_'
}

enum SampleTypes {
    ByBitContributions = 'bybit_contributions',
    Balances = 'balances'
}

const maxQueryLimit = 100
const defaultEndpoint = 'http://localhost:8000'

export class Client {
    private tableName: string
    private conn: DynamoDBClient

    constructor(tableName: string, endpoint: string = defaultEndpoint) {
        this.tableName = tableName
        this.conn = new DynamoDBClient({endpoint})
    }

    CreateTable() {
        return this.conn.send(
            new CreateTableCommand({
                TableName: this.tableName,
                KeySchema: [
                    {
                        AttributeName: Key.Partition,
                        KeyType: 'HASH'
                    },
                    {
                        AttributeName: Key.Sort,
                        KeyType: 'RANGE'
                    }
                ],
                AttributeDefinitions: [
                    {
                        AttributeName: Key.Partition,
                        AttributeType: 'S'
                    },
                    {
                        AttributeName: Key.Sort,
                        AttributeType: 'N'
                    }
                ],
                ProvisionedThroughput: {
                    ReadCapacityUnits: 1,
                    WriteCapacityUnits: 1
                }
            })
        )
    }

    DeleteTable() {
        return this.conn.send(
            new DeleteTableCommand({
                TableName: this.tableName
            })
        )
    }

    CreateByBitContribution(c: ByBitContribution) {
        let item: Record<string, AttributeValue> = {
            ethPrice: {N: WrapNumber(c.ethPrice)},
            tradeVolume: {N: WrapNumber(c.tradeVolume)},
            contributionVolume: {N: WrapNumber(c.contributeVolume)},

            ethAmount: {N: WrapNumber(c.ethAmount)},
            ethCount: {N: WrapNumber(c.ethCount)},
            usdtAmount: {N: WrapNumber(c.usdtAmount)},
            usdtCount: {N: WrapNumber(c.usdtCount)},
            usdcAmount: {N: WrapNumber(c.usdcAmount)},
            usdcCount: {N: WrapNumber(c.usdcCount)}
        }

        item[Key.Partition] = {S: SampleTypes.ByBitContributions}
        item[Key.Sort] = {N: WrapNumber(c.timestamp)}

        return this.conn.send(
            new PutItemCommand({
                TableName: this.tableName,
                Item: item
            })
        )
    }

    CreateBalances(b: Balances) {
        let item: Record<string, AttributeValue> = {
            ethCount: {N: WrapNumber(b.ethCount)},
            ethPrice: {N: WrapNumber(b.ethPrice)},
            bitCount: {N: WrapNumber(b.bitCount)},
            bitPrice: {N: WrapNumber(b.bitPrice)},
            fttCount: {N: WrapNumber(b.fttCount)},
            fttPrice: {N: WrapNumber(b.fttPrice)},
            usdtPrice: {N: WrapNumber(b.usdtPrice)},
            usdtCount: {N: WrapNumber(b.usdtCount)},
            usdcPrice: {N: WrapNumber(b.usdcPrice)},
            usdcCount: {N: WrapNumber(b.usdcCount)},
            xsushiCount: {N: WrapNumber(b.xsushiCount)},
            xsushiPrice: {N: WrapNumber(b.xsushiPrice)},

            usdTotal: {N: WrapNumber(b.usdTotal)}
        }

        item[Key.Partition] = {S: SampleTypes.Balances}
        item[Key.Sort] = {N: WrapNumber(b.timestamp)}

        return this.conn.send(
            new PutItemCommand({
                TableName: this.tableName,
                Item: item
            })
        )
    }

    GetCurrentBalances() {
        return this.conn.send(
            new QueryCommand({
                TableName: this.tableName,
                KeyConditionExpression: `${Key.Partition} = :id`,
                ScanIndexForward: false,
                ExpressionAttributeValues: {
                    ':id': {S: SampleTypes.Balances}
                },
                Limit: 1
            })
        )
    }

    GetAllByBitContributions(endDate: string, count: number = maxQueryLimit) {
        if (count > maxQueryLimit) {
            throw new Error('Can not load this many items.')
        }

        return this.conn.send(
            new QueryCommand({
                Limit: count,
                ScanIndexForward: false,
                TableName: this.tableName,
                KeyConditionExpression: `${Key.Partition} = :sampleName AND ${Key.Sort} <= :endTime`,
                ExpressionAttributeValues: {
                    ':sampleName': {S: SampleTypes.ByBitContributions},
                    ':endTime': {N: WrapNumber(DateEndTime(endDate))}
                }
            })
        )
    }

    GetByBitContribution(date: string) {
        let key: Record<string, AttributeValue> = {}
        key[Key.Partition] = {S: SampleTypes.ByBitContributions}

        let timeRange = DateTimeRange(date)

        return this.conn.send(
            new QueryCommand({
                Limit: 1,
                ScanIndexForward: false,
                TableName: this.tableName,
                KeyConditionExpression: `${Key.Partition} = :type_ AND ${Key.Sort} BETWEEN :start AND :end`,
                ExpressionAttributeValues: {
                    ':type_': {S: SampleTypes.ByBitContributions},
                    ':start': {N: WrapNumber(timeRange.start)},
                    ':end': {N: WrapNumber(timeRange.end)}
                }
            })
        )
    }
}
