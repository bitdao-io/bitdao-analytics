require("dotenv").config({ path: '.env' });

enum Env {
    Dev= 'dev',
    Test = 'test',
    Prod = 'prod'
}

class S3Config{
    region: string;
    bucket: string;
    accessKeyID: string;
    secretAccessKey: string;
}

export class DynamoDBConfig{
    endpoint: string;
    tableName: string;
}

export class Config{
    env: Env;

    displayPrecision: number;
    treasuryAddress: string;
    web3RPCHost: string;

    s3: S3Config;
    dynamodb: DynamoDBConfig;
}

export default function newConfigFromEnv() {
    let config = new Config();

    config.env = Env[process.env.ENV as keyof typeof Env] || Env.Dev

    config.displayPrecision = parseInt(process.env.BITDAO_DISPLAY_PRECISCION, 10) || 3;
    config.treasuryAddress = process.env.BITDAO_ACCOUNT;
    config.web3RPCHost = process.env.WEB3_RPC_URL;

    config.s3 = new S3Config();
    config.s3.bucket = process.env.AWS_BUCKET_NAME || 'api.bitdao.io';
    config.s3.accessKeyID = process.env.AWS_ACCESS_KEY_ID;
    config.s3.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    config.dynamodb = new DynamoDBConfig();
    config.dynamodb.tableName = process.env.AWS_DYNAMODB_TABLE_NAME || 'test-ddb';

    if (config.env !== Env.Prod) {
        config.dynamodb.endpoint = 'http://localhost:8000'
    }

    return config;
}
