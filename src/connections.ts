import {Client} from './stores/ddb'
import Web3 from 'web3'
import {Config} from './config'
import {S3Client} from '@aws-sdk/client-s3'

export default function newConnections(config: Config) {
    return {
        s3: new S3Client({region: config.s3.region}),
        ddb: new Client(config.dynamodb.tableName, config.dynamodb.endpoint),
        web3: new Web3(new Web3.providers.HttpProvider(config.web3RPCHost))
    }
}
