require("dotenv").config({ path: '.env' });

class S3Config{
    bucket: string;
    accessKeyID: string;
    secretAccessKey: string;
}

export class Config{
    displayPrecision: number;
    treasuryAddress: string;
    web3RPCHost: string;
    s3: S3Config;
}

export default function newConfigFromEnv() {
    let config = new Config();

    config.displayPrecision = parseInt(process.env.BITDAO_DISPLAY_PRECISCION, 10) || 3;
    config.treasuryAddress = process.env.BITDAO_ACCOUNT;
    config.web3RPCHost = process.env.MAIN_RPC_URL;

    config.s3 = new S3Config();
    config.s3.bucket = process.env.AWS_BUCKET_NAME || 'api.bitdao.io';
    config.s3.accessKeyID = process.env.AWS_ACCESS_KEY_ID;
    config.s3.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    return config;
}
